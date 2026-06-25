import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import RegionSettings from '@/backend/models/RegionSettings';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const data = await req.json();
    
    // Prevent updating country code if it conflicts
    if (data.countryCode) {
      const existing = await RegionSettings.findOne({ countryCode: data.countryCode, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: 'Another region with this country code exists' }, { status: 400 });
      }
    }
    
    const region = await RegionSettings.findByIdAndUpdate(id, data, { new: true });
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    
    return NextResponse.json(region);
  } catch (err) {
    console.error("Failed to update region", err);
    return NextResponse.json({ error: "Failed to update region" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const region = await RegionSettings.findByIdAndDelete(id);
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete region", err);
    return NextResponse.json({ error: "Failed to delete region" }, { status: 500 });
  }
}
