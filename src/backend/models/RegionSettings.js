import mongoose from 'mongoose';

const RegionSettingsSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true,
    unique: true, // e.g., 'GB', 'NP'
  },
  countryName: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true, // e.g., 'GBP', 'NPR'
  },
  taxRate: {
    type: Number,
    required: true,
    default: 0, // Percentage, e.g., 20 for UK VAT
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.models.RegionSettings || mongoose.model('RegionSettings', RegionSettingsSchema);
