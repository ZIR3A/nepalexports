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
  productType: { type: String, enum: ['standard', 'clothing', 'food', 'electronics', 'custom'], default: 'standard' },

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
  
  foodCompliance: {
    ingredientsList: { type: String },
    nutritionalFacts: { type: Map, of: String },
    allergenWarnings: [{ type: String }],
    dietaryTags: [{ type: String }]
  },

  logisticsAttributes: {
    shelfLife: { type: String },
    storageConditions: { type: String, enum: ['Frozen', 'Refrigerated', 'Room Temperature'] },
    certifications: [{ type: String }]
  },

  isActive: { type: Boolean, default: true },
  availableCountries: [{ type: String, trim: true }],
  flashSale: { type: FlashSaleSchema, default: () => ({}) },

  // === WMS Integration Fields ===
  
  // Array of country codes (e.g. 'GB') where this product is staged for regional enrichment
  countryDrafts: [{ type: String, trim: true, uppercase: true }],

  // Product lifecycle status for the WMS → Enrichment → Published workflow
  status: {
    type: String,
    enum: ['wms_draft', 'enrichment_pending', 'published', 'archived'],
    default: 'published', // Default to published for backward compatibility
  },

  // Raw data received from the Warehouse Management System
  wmsData: {
    originalSku: { type: String },
    weight: { type: String },
    dimensions: { type: String },
    wmsProductId: { type: String },
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    receivedAt: { type: Date },
  },

  // Marketing enrichment data added by admin after WMS draft creation
  enrichment: {
    marketingDescription: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    enrichedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrichedAt: { type: Date },
  },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
