import { eventBus } from './eventBus.js';
import { getRedisClient } from '../config/redis.js';
import ActivityLog from '../models/ActivityLog.js';
import mongoose from 'mongoose';

/**
 * Listeners for all inventory-related events
 */
export function registerInventoryListeners() {
  
  eventBus.on('inventory:*', async (data) => {
    try {
      const redis = getRedisClient();
      const { productId, warehouseId, action, quantity, newAvailable, userId } = data;

      console.log(`[Listener] Processing inventory:${action} for Product ${productId} at Warehouse ${warehouseId}`);

      // 1. Invalidate Redis cache for this specific product in this warehouse
      if (redis.del) { // Ensure dummy client or real client has del
        await redis.del(`storefront:product:${productId}:${warehouseId}`);
      }

      // 2. Manage Storefront Visibility
      if (redis.sadd && redis.srem) {
        if (newAvailable <= 0) {
          // Hide from storefront
          await redis.sadd(`hidden_products:${warehouseId}`, productId.toString());
        } else {
          // Make visible
          await redis.srem(`hidden_products:${warehouseId}`, productId.toString());
        }
      }

      // 3. Log to ActivityLog / AuditLog
      if (mongoose.connection.readyState === 1) { // Only log if DB connected
        await ActivityLog.create({
          userId: userId || 'system',
          action_type: `inventory:${action}`,
          target_resource: `Product:${productId}`,
          details: {
            message: `Quantity changed by ${quantity}. New available: ${newAvailable}. Warehouse: ${warehouseId}`,
            warehouseId,
            productId,
            newAvailable
          }
        }).catch(err => console.error('Failed to write to ActivityLog:', err.message));
      }

    } catch (error) {
      console.error('[Listener Error] Failed to process inventory event:', error);
    }
  });

  // Example of a specific event listener (e.g., negative stock alert)
  eventBus.on('alert:negative_stock', (data) => {
    console.warn(`[ALERT] Negative stock reached for Product ${data.productId} in Warehouse ${data.warehouseId}. Current: ${data.quantityAvailable}`);
    // Here you could integrate email sending or Slack webhooks
  });

}
