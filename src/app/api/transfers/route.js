import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import Transfer from '@/backend/models/Transfer';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Fetch transfers with populated warehouse names
    const transfers = await Transfer.find({})
      .populate('sourceWarehouse', 'name')
      .populate('destinationWarehouse', 'name')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Fetch Transfers Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // Generate a simple reference if not provided
    if (!body.transferReference) {
      const count = await Transfer.countDocuments();
      body.transferReference = `TRF-${String(count + 1).padStart(4, '0')}`;
    }

    const transfer = await Transfer.create(body);
    return NextResponse.json({ message: 'Transfer created successfully', transfer }, { status: 201 });
  } catch (error) {
    console.error('Create Transfer Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
