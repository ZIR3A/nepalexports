import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  reservedQuantity: {
    type: Number,
    min: 0,
    default: 0
  },
  minimumStockLimit: {
    type: Number,
    default: 10,
  }
}, { timestamps: true });

// Ensure unique index for product + variant + warehouse
InventorySchema.index({ product: 1, variantId: 1, warehouse: 1 }, { unique: true });

export default mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
