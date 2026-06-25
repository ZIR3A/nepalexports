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
  countriesServed: [{
    type: String, // e.g., ['GB', 'IE']
    trim: true,
    uppercase: true
  }],
  currency: {
    type: String,
    required: true, // e.g., 'NPR', 'GBP'
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    coordinates: { // GeoJSON
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [longitude, latitude]
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },
  isActive: {
    type: Boolean,
    default: true,
  },
  operatingHours: {
    timezone: { type: String, default: 'UTC' }, // e.g., 'Europe/London'
    offPeakStart: { type: String, default: '02:00' }, // For cron jobs
    offPeakEnd: { type: String, default: '05:00' }
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
