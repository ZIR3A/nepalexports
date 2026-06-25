import { NextResponse } from 'next/server';
import connectToDatabase from '@/backend/config/db';
import RegionSettings from '@/backend/models/RegionSettings';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Upsert US Region
    await RegionSettings.updateOne(
      { countryCode: 'US' },
      { $set: { countryCode: 'US', countryName: 'United States', currency: 'USD', taxRate: 8, isActive: true } },
      { upsert: true }
    );
    
    // Also ensure GB and NP exist for good measure
    await RegionSettings.updateOne(
      { countryCode: 'GB' },
      { $set: { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', taxRate: 20, isActive: true } },
      { upsert: true }
    );
    await RegionSettings.updateOne(
      { countryCode: 'NP' },
      { $set: { countryCode: 'NP', countryName: 'Nepal', currency: 'NPR', taxRate: 13, isActive: true } },
      { upsert: true }
    );

    const regions = await RegionSettings.find();
    return NextResponse.json({ success: true, regions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
