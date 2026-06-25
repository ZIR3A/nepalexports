import mongoose from 'mongoose';
import dbConnect from '../config/db.js';
import Product from '../models/Product.js';

process.env.MONGODB_URI = "mongodb+srv://saranbrl35_db_user:EC9prrVMbgymLTXt@cluster0.kuiwk2t.mongodb.net/ecom?retryWrites=true&w=majority";

async function migrate() {
  await dbConnect();
  const products = await Product.find({});
  let count = 0;
  for (const p of products) {
    let changed = false;
    if (p.pricing && p.pricing.length > 0) {
      p.pricing.forEach(pr => {
        if (pr.country && pr.country.startsWith('(') && pr.country.endsWith(')')) {
          pr.country = pr.country.replace(/[()]/g, '');
          changed = true;
        }
      });
    }
    if (changed) {
      await p.save();
      count++;
    }
  }
  console.log(`Migrated ${count} products.`);
  mongoose.disconnect();
}
migrate().catch(console.error);
