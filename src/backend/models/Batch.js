import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
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
  batchNumber: {
    type: String,
    required: true,
  },
  manufacturingDate: {
    type: Date,
    // Optional for non-food items
  },
  expiryDate: {
    type: Date,
    // Optional for non-perishable items
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  supplier: { type: String },
  purchaseReference: { type: String },
}, { timestamps: true });

// Ensure unique index for batch number per product variant and warehouse
BatchSchema.index({ product: 1, variantId: 1, warehouse: 1, batchNumber: 1 }, { unique: true });

export default mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
