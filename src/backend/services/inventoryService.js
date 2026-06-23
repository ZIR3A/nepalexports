import mongoose from 'mongoose';
import Batch from '../models/Batch';
import Inventory from '../models/Inventory';

/**
 * Service to handle inventory operations, including FIFO allocation for batched items.
 */
export const InventoryService = {
  
  /**
   * Allocate inventory for an order using FIFO (First In First Out) logic for batched products.
   * If it's a non-batched product (like clothing), it simply checks and deducts from the general Variant Inventory.
   * 
   * @param {string} productId - The product ID
   * @param {string} variantId - The variant ID
   * @param {number} requestedQuantity - The quantity to allocate
   * @param {boolean} isBatched - Whether the product uses batch tracking (e.g. Food)
   * @param {string} warehouseId - The warehouse to fulfill from
   * @returns {Array} - Array of allocations { batchId?, warehouseId, quantity }
   */
  allocateInventory: async (productId, variantId, requestedQuantity, isBatched, warehouseId) => {
    let remainingQuantity = requestedQuantity;
    const allocations = [];

    if (isBatched) {
      // Find valid (unexpired), non-empty batches for this product in this warehouse, sorted by expiry date ASC (FIFO)
      const batches = await Batch.find({
        product: productId,
        ...(variantId ? { variantId } : {}),
        warehouse: warehouseId,
        quantity: { $gt: 0 },
        $or: [
          { expiryDate: { $gt: new Date() } },
          { expiryDate: { $exists: false } },
          { expiryDate: null }
        ]
      }).sort({ expiryDate: 1, createdAt: 1 });

      let batchIndex = 0;
      while (remainingQuantity > 0 && batchIndex < batches.length) {
        const batch = batches[batchIndex];
        const allocateFromBatch = Math.min(remainingQuantity, batch.quantity);
        
        allocations.push({
          batchId: batch._id,
          warehouseId: batch.warehouse,
          quantity: allocateFromBatch
        });

        // Deduct from batch
        batch.quantity -= allocateFromBatch;
        await batch.save();

        remainingQuantity -= allocateFromBatch;
        batchIndex++;
      }

      if (remainingQuantity > 0) {
        throw new Error(`Insufficient unexpired batch inventory for product ${productId}. Short by ${remainingQuantity}.`);
      }

    } else {
      // Standard variant-level inventory deduction
      const inventory = await Inventory.findOne({
        product: productId,
        variantId: variantId,
        warehouse: warehouseId
      });

      if (!inventory || inventory.quantity < remainingQuantity) {
        throw new Error(`Insufficient variant inventory for product ${productId}.`);
      }

      inventory.quantity -= remainingQuantity;
      await inventory.save();

      allocations.push({
        warehouseId: inventory.warehouse,
        quantity: requestedQuantity
      });
    }

    return allocations;
  },

  /**
   * Get products that are expiring within the specified number of days.
   * @param {number} days - Days from now (e.g. 30, 60, 90)
   */
  getExpiringBatches: async (days) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return await Batch.find({
      quantity: { $gt: 0 },
      expiryDate: { $lte: targetDate, $gt: new Date() }
    })
    .populate('product', 'name sku')
    .populate('warehouse', 'name')
    .sort({ expiryDate: 1 });
  }
};
