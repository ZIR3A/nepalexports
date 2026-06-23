import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  size: { type: String }, // e.g., 'S', 'M', 'L', 'XL'
  color: { type: String }, // e.g., 'Black', 'White', 'Red'
  sku: { type: String, required: true, unique: true },
});

const MediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  url: { type: String, required: true },
  provider: { type: String, default: 'vercel-blob' },
  key: { type: String }
});

const FlashSaleSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  price: { type: Number },
  expiresAt: { type: Date }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'NPR' // Base currency as per PRD
  },
  category: {
    type: String,
    required: true,
  },
  media: [MediaSchema],
  variants: [VariantSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  flashSale: {
    type: FlashSaleSchema,
    default: () => ({})
  }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
