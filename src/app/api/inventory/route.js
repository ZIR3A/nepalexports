import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Inventory from '@/backend/models/Inventory';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // In admin panel, we want to fetch all inventory and populate product & warehouse
    const inventory = await Inventory.find()
      .populate('product', 'name sku media')
      .populate('warehouse', 'name country');

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Fetch Inventory Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    const { inventoryId, quantity } = await req.json();

    const inv = await Inventory.findByIdAndUpdate(
      inventoryId,
      { quantity },
      { new: true }
    );

    return NextResponse.json({ message: 'Stock updated', inventory: inv });
  } catch (error) {
    console.error('Update Inventory Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
