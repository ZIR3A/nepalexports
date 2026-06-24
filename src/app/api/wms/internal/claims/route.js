import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import FreightClaim from '@/backend/models/FreightClaim';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Populate references to show product name and details
    const claims = await FreightClaim.find()
      .populate('product', 'name sku')
      .populate('transfer', 'sourceWarehouse destinationWarehouse')
      .sort({ createdAt: -1 });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Fetch Freight Claims Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    const { id, status } = await req.json();

    const claim = await FreightClaim.findByIdAndUpdate(id, { status }, { new: true });
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error("Update Freight Claim Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
