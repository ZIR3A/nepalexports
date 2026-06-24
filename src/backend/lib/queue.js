import { Queue } from 'bullmq';
import Redis from 'ioredis';

// We fall back to localhost redis if no URL is provided. 
// For Upstash cloud redis, the user should provide REDIS_URL in .env.local
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  // Suppress connection errors during Next.js build phase
  if (err.code === 'ECONNREFUSED') {
    console.warn('[Redis] Connection refused. If you are building the app, this is safely ignored.');
  } else {
    console.error('[Redis] Error:', err);
  }
});

export const paymentTimeoutQueue = new Queue('payment-timeouts', {
  connection: redisConnection
});

/**
 * Schedules a background job to run after a specific delay.
 * @param {string} orderId 
 * @param {Array} inventoryUpdates 
 * @param {number} delayMs 
 */
export async function schedulePaymentTimeout(orderId, inventoryUpdates, delayMs = 60000) {
  try {
    await paymentTimeoutQueue.add(
      'check-payment-timeout',
      { orderId, inventoryUpdates },
      { delay: delayMs, removeOnComplete: true }
    );
    console.log(`[Queue] Scheduled payment timeout for Order: ${orderId} in ${delayMs / 1000}s`);
  } catch (error) {
    console.error(`[Queue] Failed to schedule payment timeout for Order: ${orderId}`, error);
  }
}
