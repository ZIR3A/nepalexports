import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Warehouse from '@/backend/models/Warehouse';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    
    if (body.managerId === "") {
      delete body.managerId;
    }
    
    // We use findById and save() to ensure pre-save hooks are triggered
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return NextResponse.json({ message: 'Warehouse not found' }, { status: 404 });
    }

    Object.assign(warehouse, body);
    await warehouse.save();

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Update Warehouse Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'A warehouse with this name or code already exists.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // In a real system, you'd check for linked inventory/orders before deleting.
    // For this CRUD MVP, we allow deletion.
    const deleted = await Warehouse.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Delete Warehouse Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
