import mongoose from 'mongoose';
import dbConnect from '../config/db.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';

async function migrate() {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Connected to database.');

  try {
    console.log('\n--- Migrating Products ---');
    // Using strict: false allows us to read fields that were removed from the schema
    const products = await mongoose.connection.collection('products').find({}).toArray();
    let productUpdatedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updateDoc = { $set: {}, $unset: {} };

      // 1. Migrate Pricing
      if (product.basePrice !== undefined || product.localPrice !== undefined) {
        needsUpdate = true;
        // Default to NPR if not set
        const currency = product.currency || 'NPR';
        
        // We will push a single pricing tier based on what they had
        // assuming standard region (e.g. NP for NPR, GB for GBP)
        const country = currency === 'GBP' ? 'GB' : 'NP';

        updateDoc.$set.pricing = [{
          country: country,
          currency: currency,
          basePrice: product.basePrice || 0,
          salePrice: product.localPrice || undefined,
          taxRate: 0,
          isActive: true
        }];

        updateDoc.$unset.basePrice = "";
        updateDoc.$unset.localPrice = "";
        updateDoc.$unset.currency = "";
      }

      // 2. Migrate Enrichment (Description)
      if (product.description !== undefined || product.shortDescription !== undefined) {
        needsUpdate = true;
        
        updateDoc.$set['enrichment.description'] = product.description || '';
        if (product.shortDescription) updateDoc.$set['enrichment.shortDescription'] = product.shortDescription;

        updateDoc.$unset.description = "";
        updateDoc.$unset.shortDescription = "";
      }

      if (needsUpdate) {
        // Clean up empty $unset object so mongo doesn't throw
        if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;
        
        await mongoose.connection.collection('products').updateOne(
          { _id: product._id },
          updateDoc
        );
        productUpdatedCount++;
      }
    }
    console.log(`Successfully migrated ${productUpdatedCount} Product documents.`);


    console.log('\n--- Migrating Warehouses ---');
    const warehouses = await mongoose.connection.collection('warehouses').find({}).toArray();
    let warehouseUpdatedCount = 0;

    for (const warehouse of warehouses) {
      let needsUpdate = false;
      const updateDoc = { $set: {} };

      if (!warehouse.countriesServed || warehouse.countriesServed.length === 0) {
        needsUpdate = true;
        updateDoc.$set.countriesServed = [warehouse.countryCode];
      }

      if (!warehouse.address) {
        needsUpdate = true;
        updateDoc.$set.address = {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          coordinates: {
            type: 'Point',
            coordinates: [0, 0]
          }
        };
      }

      if (!warehouse.operatingHours) {
        needsUpdate = true;
        updateDoc.$set.operatingHours = {
          timezone: 'UTC',
          offPeakStart: '02:00',
          offPeakEnd: '05:00'
        };
      }

      if (needsUpdate) {
        await mongoose.connection.collection('warehouses').updateOne(
          { _id: warehouse._id },
          updateDoc
        );
        warehouseUpdatedCount++;
      }
    }
    console.log(`Successfully migrated ${warehouseUpdatedCount} Warehouse documents.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
