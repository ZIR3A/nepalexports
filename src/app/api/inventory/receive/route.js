import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Batch from '@/backend/models/Batch';
import Inventory from '@/backend/models/Inventory';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { product, variantId, warehouse, batchNumber, manufacturingDate, expiryDate, quantity } = body;

    if (!product || !variantId || !warehouse || !batchNumber || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the batch
    const newBatch = new Batch({
      product,
      variantId,
      warehouse,
      batchNumber,
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      quantity
    });

    await newBatch.save();

    // Update aggregate inventory
    let inventory = await Inventory.findOne({ product, variantId, warehouse });
    if (!inventory) {
      inventory = new Inventory({
        product,
        variantId,
        warehouse,
        quantity: 0
      });
    }

    inventory.quantity += quantity;
    await inventory.save();

    return NextResponse.json({ success: true, batch: newBatch, inventory }, { status: 201 });

  } catch (error) {
    console.error("Batch creation error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Batch number already exists for this product in this warehouse." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
