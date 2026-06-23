import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  name: { type: String }, // e.g., "Black - M"
  priceOverride: { type: Number },
  localPriceOverride: { type: Number },
  attributes: { type: Map, of: String }, // Dynamic attributes like { size: 'M', color: 'Black' }
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
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  shortDescription: { type: String },
  description: { type: String, required: true },
  brand: { type: String },
  
  mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  basePrice: { type: Number, required: true, min: 0 },
  localPrice: { type: Number, min: 0 },
  currency: { type: String, default: 'NPR' },
  
  media: [MediaSchema],
  variants: [VariantSchema],
  
  tags: [{ type: String }],
  countryAvailability: [{ type: String }], // e.g., ['UK', 'NP']
  
  seo: {
    title: { type: String },
    description: { type: String }
  },

  attributes: { type: Map, of: mongoose.Schema.Types.Mixed }, // Dynamic category-specific fields

  isActive: { type: Boolean, default: true },
  availableCountries: [{ type: String, trim: true }],
  flashSale: { type: FlashSaleSchema, default: () => ({}) }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
