import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  sku: { type: String },
  size: { type: String },
  color: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  fulfillmentStatus: { type: String, enum: ['IN_STOCK', 'AVAILABLE_VIA_IMPORT'] },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
});

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Optional, to support guest checkouts
  },
  customerDetails: {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postcode: { type: String },
    country: { type: String, required: true }, // e.g., 'GB', 'NP'
  },
  items: [OrderItemSchema],
  billing: {
    currency: { type: String, required: true, enum: ['GBP', 'NPR', 'USD', 'EUR'] },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    importFees: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  payment: {
    method: { type: String, required: true }, // e.g., 'card', 'paypal', 'esewa', 'khalti'
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    transactionId: { type: String },
  },
  warehouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  }], // The warehouses responsible for fulfillment
}, { timestamps: true });

// Auto-generate a readable order number before saving if not provided
OrderSchema.pre('validate', async function() {
  if (!this.orderNumber) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `DRP-${randomNum}`;
  }
});

delete mongoose.models.Order;
export default mongoose.model('Order', OrderSchema);
