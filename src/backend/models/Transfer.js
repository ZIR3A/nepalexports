import mongoose from 'mongoose';

const TransferItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId, // Can be null if it's a product without variants
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const TransferSchema = new mongoose.Schema({
  transferReference: {
    type: String,
    required: true,
    unique: true
  },
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  destinationWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Packed', 'Dispatched', 'In Transit', 'Customs Clearance', 'Arrived', 'Received'],
    default: 'Draft'
  },
  items: [TransferItemSchema],
  notes: {
    type: String
  }
}, { timestamps: true });

export default mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema);
