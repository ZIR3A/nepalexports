import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Order from '@/backend/models/Order';
import Inventory from '@/backend/models/Inventory';
import Product from '@/backend/models/Product';
import Batch from '@/backend/models/Batch';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { 
      items, 
      customerDetails, 
      shippingAddress, 
      billing, 
      paymentMethod,
      warehouseId 
    } = body;

    if (!items || !items.length || !warehouseId) {
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

      const variant = product.variants.find(v => 
        (v.size === item.selectedSize || v.size === 'N/A') && 
        (v.color === item.selectedColor || v.color === 'N/A')
      );

      if (!variant) {
        stockErrors.push(`Variant invalid for ${item.name}.`);
        continue;
      }

      // Fetch all valid batches sorted by expiryDate (ascending) for FIFO
      const validBatches = await Batch.find({
        product: product._id,
        variantId: variant._id,
        warehouse: warehouseId,
        $or: [
          { expiryDate: { $gt: now } },
          { expiryDate: { $exists: false } },
          { expiryDate: null }
        ],
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1 });

      const totalAvailable = validBatches.reduce((sum, b) => sum + b.quantity, 0);

      if (totalAvailable < item.quantity) {
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
        }
      }

      // Track aggregate inventory deduction
      inventoryUpdates.push({
        product: product._id,
        variantId: variant._id,
        warehouse: warehouseId,
        deductQuantity: item.quantity
      });
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
        { $inc: { quantity: -update.deductQuantity } }
      );
    }

    // Process Mock Payment (Success)
    // Stripe/eSewa/Khalti APIs would go here

    // Create Order
    const newOrder = new Order({
      customerDetails,
      shippingAddress,
      items: items.map(i => ({
        product: i.id,
        name: i.name,
        sku: i.sku || "N/A",
        size: i.selectedSize,
        color: i.selectedColor,
        quantity: i.quantity,
        price: i.price,
      })),
      billing,
      payment: {
        method: paymentMethod,
        status: 'Paid',
        transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`
      },
      warehouse: warehouseId,
      status: 'Processing',
    });

    await newOrder.save();

    return NextResponse.json({ 
      success: true, 
      orderNumber: newOrder.orderNumber 
    }, { status: 201 });

  } catch (error) {
    console.error("Order processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
