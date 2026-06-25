import mongoose from 'mongoose';
import RegionSettings from '../models/RegionSettings.js';
import dbConnect from '../config/db.js';

async function seedRegions() {
  await dbConnect();

  const regions = [
    {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      currency: 'GBP',
      taxRate: 20 // 20% VAT
    },
    {
      countryCode: 'NP',
      countryName: 'Nepal',
      currency: 'NPR',
      taxRate: 13 // 13% VAT
    }
  ];

  for (const region of regions) {
    await RegionSettings.findOneAndUpdate(
      { countryCode: region.countryCode },
      region,
      { upsert: true, new: true }
    );
    console.log(`Seeded region: ${region.countryCode} with ${region.taxRate}% tax`);
  }

  mongoose.disconnect();
}

seedRegions().catch(err => console.error(err));
