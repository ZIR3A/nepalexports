import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  country: {
    type: String,
    required: true, // e.g., 'Nepal', 'United Kingdom'
  },
  countryCode: {
    type: String,
    required: true, // e.g., 'NP', 'GB' — used for geo-routing lookups
    uppercase: true,
    trim: true,
  },
  currency: {
    type: String,
    required: true, // e.g., 'NPR', 'GBP'
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefaultInternational: {
    type: Boolean,
    default: false, // Only one warehouse should be true — used for third-country fallback
  },
  acceptsInternationalOrders: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
