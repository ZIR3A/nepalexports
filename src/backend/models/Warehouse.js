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
  currency: {
    type: String,
    required: true, // e.g., 'NPR', 'GBP'
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

export default mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
