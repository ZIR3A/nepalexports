import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Order from '@/backend/models/Order';
import Inventory from '@/backend/models/Inventory';
import Product from '@/backend/models/Product';
import Batch from '@/backend/models/Batch';
import User from '@/backend/models/User';
import { schedulePaymentTimeout } from '@/backend/lib/queue';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req) {
  try {
    await connectToDatabase();
    
    // 1. Session & KYC Gate
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to complete checkout." }, { status: 401 });
    }
    
    const body = await req.json();
    let { 
      kycData,
      items, 
      customerDetails, 
      shippingAddress, 
      billing, 
      paymentMethod,
      warehouses 
    } = body;

    // Backfill missing customer details from DB User if KYC was previously completed
    const dbUser = await User.findById(session.user.id);
    if (dbUser) {
      if (!customerDetails.firstName) customerDetails.firstName = dbUser.firstName;
      if (!customerDetails.lastName) customerDetails.lastName = dbUser.lastName;
    }

    if (session.user.kycStatus !== 'COMPLETED' && !kycData) {
      return NextResponse.json({ error: "KYC Verification Required. Please complete KYC before checkout." }, { status: 403 });
    }

    if (kycData) {
      // Process KYC Data
      await User.findByIdAndUpdate(session.user.id, {
        kycStatus: 'COMPLETED',
        phoneNumber: kycData.phone,
        firstName: kycData.firstName || session.user.firstName,
        lastName: kycData.lastName || session.user.lastName,
        address: kycData.address,
        // Assuming coordinates are saved in a custom field or embedded in address. 
        // We'll attach it to the user object directly for now if needed, 
        // or just log it/save to a new location schema if necessary.
        // If we want to strictly save coordinates in the Order document, we can pass it down.
      });
      // Update session object in memory for the rest of this request
      session.user.kycStatus = 'COMPLETED';
    }

    if (!items || !items.length || !warehouses || warehouses.length === 0) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    // Double check inventory and deduct using FIFO logic
    const stockErrors = [];
    const now = new Date();
    
    // We will keep track of all required updates so we can apply them atomically (in memory first)
    const batchUpdates = [];
    const inventoryUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        stockErrors.push(`${item.name} is no longer available.`);
        continue;
      }

      const variant = product.variants?.find(v => {
        if (item.productType === 'food' || (product.category || '').toLowerCase() === 'food') {
          const flavor = v.attributes?.get ? v.attributes.get('flavor') : v.attributes?.flavor;
          const weight = v.attributes?.get ? v.attributes.get('weight') : v.attributes?.weight;
          const packSize = v.attributes?.get ? v.attributes.get('packSize') : v.attributes?.packSize;
          const matchFlavor = flavor === item.selectedColor || flavor === 'N/A' || !flavor;
          const matchWeight = weight === item.selectedSize || packSize === item.selectedSize || weight === 'N/A' || !weight;
          return matchFlavor && matchWeight;
        }
        const size = v.attributes?.get ? v.attributes.get('size') : v.attributes?.size;
        const color = v.attributes?.get ? v.attributes.get('color') : v.attributes?.color;
        return (size === item.selectedSize || size === 'N/A') && (color === item.selectedColor || color === 'N/A');
      });

      if (!variant) {
        stockErrors.push(`Variant invalid for ${item.name}.`);
        continue;
      }

      // Fetch all valid batches sorted by expiryDate (ascending) for FIFO across all selected warehouses
      const validBatches = await Batch.find({
        product: product._id,
        variantId: variant._id,
        warehouse: { $in: warehouses },
        $or: [
          { expiryDate: { $gt: now } },
          { expiryDate: { $exists: false } },
          { expiryDate: null }
        ],
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1 });

      const totalAvailable = validBatches.reduce((sum, b) => sum + b.quantity, 0);

      // Check raw inventory as a fallback in case batches are not fully populated
      const localInventories = await Inventory.find({ product: product._id, variantId: variant._id, warehouse: { $in: warehouses } });
      const rawAvailable = localInventories.reduce((sum, inv) => sum + (inv.quantity - (inv.reservedQuantity || 0)), 0);

      if (totalAvailable < item.quantity && rawAvailable < item.quantity) {
        stockErrors.push(`Insufficient stock for ${item.name}.`);
        continue;
      }
      
      // Calculate FIFO deductions
      let remainingToDeduct = item.quantity;
      for (const batch of validBatches) {
        if (remainingToDeduct === 0) break;
        
        if (batch.quantity >= remainingToDeduct) {
          // This batch can fulfill the remaining amount
          batchUpdates.push({ batchId: batch._id, deductQuantity: remainingToDeduct });
          remainingToDeduct = 0;
        } else {
          // Exhaust this batch and continue
          batchUpdates.push({ batchId: batch._id, deductQuantity: batch.quantity });
          remainingToDeduct -= batch.quantity;
          
          inventoryUpdates.push({
            product: product._id,
            variantId: variant._id,
            warehouse: batch.warehouse,
            deductQuantity: batch.quantity
          });
        }
      }

      // If we couldn't deduct enough from batches (maybe no batches exist, so fallback to raw inventory)
      if (remainingToDeduct > 0) {
        // Fallback: Just push a generic inventory update without batch
        inventoryUpdates.push({
          product: product._id,
          variantId: variant._id,
          warehouse: warehouses[0], // fallback to first warehouse
          deductQuantity: remainingToDeduct
        });
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json({ error: "Stock check failed", details: stockErrors }, { status: 400 });
    }

    // Apply the deductions
    // In production, use mongoose transactions
    for (const update of batchUpdates) {
      await Batch.updateOne(
        { _id: update.batchId },
        { $inc: { quantity: -update.deductQuantity } }
      );
    }

    for (const update of inventoryUpdates) {
      await Inventory.updateOne(
        { product: update.product, variantId: update.variantId, warehouse: update.warehouse },
        { 
          $inc: { 
            quantity: -update.deductQuantity,
            reservedQuantity: update.deductQuantity 
          } 
        }
      );
    }

    // Process Mock Payment Initiation (Pending)
    // Stripe/eSewa/Khalti APIs would go here to generate a payment intent

    // Create Order in Pending State
    const newOrder = new Order({
      user: session.user.id,
      customerDetails,
      shippingAddress: {
        ...shippingAddress,
        coordinates: kycData?.coordinates || null
      },
      items: items.map(i => ({
        product: i.id,
        name: i.name,
        sku: i.sku || "N/A",
        size: i.selectedSize,
        color: i.selectedColor,
        quantity: i.quantity,
        price: i.price,
        fulfillmentStatus: i.fulfillmentStatus || 'IN_STOCK'
      })),
      billing,
      payment: {
        method: paymentMethod,
        status: 'Pending',
        transactionId: `txn_pending_${Math.random().toString(36).substr(2, 9)}`
      },
      warehouses: warehouses,
      status: 'Pending',
    });

    await newOrder.save();


    // Schedule the 1-minute (dev) or 15-minute (prod) grace period timeout
    // Using 1 minute (60000ms) for testing as requested
    await schedulePaymentTimeout(newOrder._id.toString(), inventoryUpdates, 60000);

    // Notify WMS of the order allocation
    try {
      const { notifyWmsOrderAllocated } = require('@/backend/services/wmsService');
      await notifyWmsOrderAllocated({
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        items: newOrder.items,
        warehouses: newOrder.warehouses
      });
    } catch (wmsErr) {
      console.error('Failed to notify WMS of order allocation:', wmsErr);
      // We don't fail the checkout if WMS notification fails, but log it
    }

    return NextResponse.json({ 
      success: true, 
      orderNumber: newOrder.orderNumber 
    }, { status: 201 });

  } catch (error) {
    console.error("Order processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
