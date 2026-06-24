import mongoose from 'mongoose';

const AdminAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['stock_discrepancy', 'wms_sync_error', 'low_stock', 'wms_product_received'],
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    // Examples:
    // { productId, sku, warehouseId, expected, actual } for stock_discrepancy
    // { orderId, error } for wms_sync_error
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Index for efficient querying of unread alerts
AdminAlertSchema.index({ isRead: 1, createdAt: -1 });
AdminAlertSchema.index({ type: 1, severity: 1 });

export default mongoose.models.AdminAlert || mongoose.model('AdminAlert', AdminAlertSchema);
