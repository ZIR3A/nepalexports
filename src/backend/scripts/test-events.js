import mongoose from 'mongoose';
import dbConnect from '../config/db.js';
import { InventoryService } from '../services/inventoryService.js';
import { registerInventoryListeners } from '../events/inventory.listeners.js';
import { getRedisClient } from '../config/redis.js';

async function testEvents() {
  console.log('--- Initializing Event Bus & Listeners ---');
  // 1. Initialize Redis and db
  await dbConnect();
  getRedisClient(); // Should print success or dummy warning
  
  // 2. Register listeners
  registerInventoryListeners();

  console.log('\n--- Finding Mock Data ---');
  // Grab any inventory record for testing
  const inventory = await mongoose.connection.collection('inventories').findOne({});
  
  if (!inventory) {
    console.log('No inventory records found. Exiting test.');
    process.exit(0);
  }

  const productId = inventory.product;
  const warehouseId = inventory.warehouse;

  console.log(`Testing with Product ${productId} and Warehouse ${warehouseId}`);

  console.log('\n--- Firing Atomic Stock Update (recount) ---');
  
  try {
    // This will trigger a DB transaction, update the stock, and fire 'inventory:recount'
    // which in turn fires 'inventory:*', activating our listener that invalidates Redis and writes to ActivityLog
    const result = await InventoryService.updateStock(
      productId, 
      warehouseId, 
      'recount', 
      inventory.quantity + 1, // Just testing an increment
      'test-system-user'
    );

    console.log(`Success! New stock quantity: ${result.quantity}`);
    
    // Wait briefly to allow async listeners to finish printing to console
    setTimeout(() => {
      console.log('\nTest complete.');
      mongoose.disconnect();
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('Test Failed:', error.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

testEvents();
