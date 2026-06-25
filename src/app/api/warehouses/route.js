import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Warehouse from '@/backend/models/Warehouse';

export async function GET(req) {
  try {
    await connectToDatabase();
    // Return all warehouses (active or not) for admin panel, populate manager
    const warehouses = await Warehouse.find({}).populate('managerId', 'name email').sort({ name: 1 });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Fetch Warehouses Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (body.managerId === "") {
      delete body.managerId;
    }
    
    // Mongoose pre-save hook handles the isDefaultInternational toggle
    const warehouse = new Warehouse(body);
    await warehouse.save();
    
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Create Warehouse Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'A warehouse with this name or code already exists.' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
