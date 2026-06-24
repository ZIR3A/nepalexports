import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Transfer from '@/backend/models/Transfer';
import Inventory from '@/backend/models/Inventory';
import Product from '@/backend/models/Product';
import WmsAuditLog from '@/backend/models/WmsAuditLog';

export async function GET() {
  try {
    await connectToDatabase();
    // Populate references to show names in UI
    const transfers = await Transfer.find()
      .populate('sourceWarehouse', 'name')
      .populate('destinationWarehouse', 'name')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("Fetch Transfers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const { sourceWarehouse, destinationWarehouse, items } = await req.json();

    if (!sourceWarehouse || !destinationWarehouse || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate inventory and prepare deductions
    const deductions = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      // Defaulting to the first variant for MVP simplicity, or looking it up if provided
      const variantId = product.variants[0]?._id;

      const inventory = await Inventory.findOne({
        product: product._id,
        variantId: variantId,
        warehouse: sourceWarehouse
      });

      if (!inventory || inventory.quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for product ${product.name} at source warehouse.` }, { status: 400 });
      }

      deductions.push({ inventoryId: inventory._id, quantity: item.quantity, productId: product._id, variantId });
    }

    // Process deductions atomically (in-memory simulation for MVP)
    for (const deduction of deductions) {
      await Inventory.findByIdAndUpdate(deduction.inventoryId, {
        $inc: { quantity: -deduction.quantity }
      });

      await WmsAuditLog.create({
        userId: 'system_admin',
        userRole: 'super_admin',
        action: 'transfer_dispatched',
        sku: 'multiple', // MVP simplifier
        quantityChange: -deduction.quantity,
        warehouseId: sourceWarehouse,
        reason: 'Inter-warehouse transfer dispatched'
      });
    }

    // Create the transfer record
    const transferReference = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newTransfer = new Transfer({
      transferReference,
      sourceWarehouse,
      destinationWarehouse,
      status: 'Dispatched',
      items: items.map(i => ({
        product: i.productId,
        variantId: deductions.find(d => d.productId.toString() === i.productId.toString())?.variantId,
        quantity: i.quantity
      }))
    });

    await newTransfer.save();

    return NextResponse.json({ success: true, transfer: newTransfer }, { status: 201 });

  } catch (error) {
    console.error("Create Transfer Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
