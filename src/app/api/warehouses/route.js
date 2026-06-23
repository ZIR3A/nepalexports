import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Warehouse from '@/backend/models/Warehouse';

export async function GET(req) {
  try {
    await connectToDatabase();
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Fetch Warehouses Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
