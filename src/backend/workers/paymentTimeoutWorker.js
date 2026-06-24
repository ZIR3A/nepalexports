const { Worker } = require('bullmq');
const Redis = require('ioredis');
const mongoose = require('mongoose');

// We need to establish a standalone DB connection since we are not running inside the Next.js API lifecycle
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

// Ensure models are registered (since we're running isolated)
// To keep this simple, we'll redefine the minimum needed or try to require the exact models.
// Since Next.js uses ES modules for models and standard require here might fail if we don't compile,
// we will just use a minimal connection and schema for the worker.
mongoose.connect(MONGODB_URI)
  .then(() => console.log('[Worker] Connected to MongoDB.'))
  .catch((err) => console.error('[Worker] MongoDB connection error:', err));

// Define minimal schemas for the worker to update state
const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const inventorySchema = new mongoose.Schema({}, { strict: false });
const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);


const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker('payment-timeouts', async job => {
  const { orderId, inventoryUpdates } = job.data;
  console.log(`[Worker] Processing payment timeout check for Order: ${orderId}`);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`[Worker] Order ${orderId} not found. Skipping.`);
      return;
    }

    // Check if the order is still pending
    if (order.get('payment.status') === 'Pending' || order.get('status') === 'Pending') {
      console.log(`[Worker] Order ${orderId} payment is still pending after grace period. Cancelling order...`);
      
      // Update Order
      await Order.updateOne(
        { _id: orderId },
        { 
          $set: { 
            'status': 'Cancelled', 
            'payment.status': 'Failed' 
          } 
        }
      );

      // Release reserved inventory
      // We stored inventoryUpdates in the job: { product, variantId, warehouse, deductQuantity }
      if (inventoryUpdates && inventoryUpdates.length > 0) {
        for (const update of inventoryUpdates) {
          console.log(`[Worker] Releasing ${update.deductQuantity} units for Product: ${update.product}`);
          await Inventory.updateOne(
            { product: update.product, variantId: update.variantId, warehouse: update.warehouse },
            { 
              $inc: { 
                quantity: update.deductQuantity,            // add back to available
                reservedQuantity: -update.deductQuantity    // remove from reserved
              } 
            }
          );
        }
      }

      console.log(`[Worker] Order ${orderId} cancelled and stock released.`);
    } else {
      console.log(`[Worker] Order ${orderId} payment status is ${order.get('payment.status')}. No action needed.`);
    }

  } catch (err) {
    console.error(`[Worker] Error processing job for Order ${orderId}:`, err);
    throw err;
  }
}, { connection: redisConnection });

worker.on('ready', () => {
  console.log('[Worker] Payment Timeout Worker is running and waiting for jobs...');
});

worker.on('error', err => {
  console.error('[Worker] Error:', err);
});
