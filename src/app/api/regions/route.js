import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import RegionSettings from '@/backend/models/RegionSettings';

export async function GET() {
  try {
    await connectToDatabase();
    const regions = await RegionSettings.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(regions);
  } catch (err) {
    console.error("Failed to fetch regions", err);
    return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 });
  }
}
