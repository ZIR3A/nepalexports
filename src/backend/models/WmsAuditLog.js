import mongoose from 'mongoose';

const WmsAuditLogSchema = new mongoose.Schema({
  userId: {
    type: String, // Storing as String for MVP since auth is mocked, can be ObjectId later
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['add_stock', 'remove_stock', 'log_new_item', 'transfer_dispatched', 'transfer_received', 'cargo_loss'],
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  quantityChange: {
    type: Number,
    required: true, // Can be positive or negative
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  reason: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.models.WmsAuditLog || mongoose.model('WmsAuditLog', WmsAuditLogSchema);
