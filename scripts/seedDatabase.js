import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Assuming this script is run via Node directly, we need to manually connect to mongoose
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

// Minimal models for seeding
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  currency: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});
const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, default: null },
  productType: { type: String, default: 'standard' },
});
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Seed Warehouses
    console.log("Seeding Warehouses...");
    const warehouses = [
      { name: "Nepal Warehouse", country: "Nepal", currency: "NPR" },
      { name: "UK Warehouse", country: "United Kingdom", currency: "GBP" },
      { name: "Transit", country: "Global", currency: "USD" },
    ];

    for (const wh of warehouses) {
      await Warehouse.findOneAndUpdate({ name: wh.name }, wh, { upsert: true, new: true });
    }
    console.log("Warehouses seeded.");

    // Seed Categories
    console.log("Seeding Categories...");
    const foodMain = await Category.findOneAndUpdate(
      { slug: 'food' },
      { name: "Food", slug: "food", productType: "food" },
      { upsert: true, new: true }
    );
    await Category.findOneAndUpdate(
      { slug: 'snacks' },
      { name: "Snacks", slug: "snacks", productType: "food", parentCategory: foodMain._id },
      { upsert: true, new: true }
    );

    const clothingMain = await Category.findOneAndUpdate(
      { slug: 'clothing' },
      { name: "Clothing", slug: "clothing", productType: "clothing" },
      { upsert: true, new: true }
    );
    await Category.findOneAndUpdate(
      { slug: 't-shirts' },
      { name: "T-Shirts", slug: "t-shirts", productType: "clothing", parentCategory: clothingMain._id },
      { upsert: true, new: true }
    );

    console.log("Categories seeded.");
    
    console.log("Seeding Complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
