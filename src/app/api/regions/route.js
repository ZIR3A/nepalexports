import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import RegionSettings from '@/backend/models/RegionSettings';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const admin = searchParams.get('admin');
    
    await connectToDatabase();
    
    let query = { isActive: true };
    if (admin === 'true') {
      query = {}; // fetch all for admin
    }
    
    const regions = await RegionSettings.find(query).sort({ countryName: 1 });
    return NextResponse.json(regions);
  } catch (err) {
    console.error("Failed to fetch regions", err);
    return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    // Check if region with this code already exists
    const existing = await RegionSettings.findOne({ countryCode: data.countryCode });
    if (existing) {
      return NextResponse.json({ error: 'Region with this country code already exists' }, { status: 400 });
    }
    
    const region = await RegionSettings.create(data);
    return NextResponse.json(region, { status: 201 });
  } catch (err) {
    console.error("Failed to create region", err);
    return NextResponse.json({ error: "Failed to create region" }, { status: 500 });
  }
}
