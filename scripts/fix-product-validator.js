import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function fixValidator() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Remove the collection-level validator that enforces the old "category" field
  console.log('Removing collection validator from "products"...');
  await db.command({ collMod: 'products', validator: {}, validationLevel: 'off' });
  console.log('Done! Validator removed.');

  // Also drop any stale index on "category" if it exists
  try {
    await db.collection('products').dropIndex('category_1');
    console.log('Dropped stale "category_1" index.');
  } catch (e) {
    console.log('No stale "category_1" index found (this is fine).');
  }

  await mongoose.disconnect();
  console.log('Disconnected. You can now create products.');
}

fixValidator().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
