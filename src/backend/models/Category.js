import mongoose from 'mongoose';

const AttributeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Material", "Size Type"
  type: { type: String, enum: ['string', 'number', 'boolean', 'array'], default: 'string' },
  required: { type: Boolean, default: false },
});

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null, // Null means it's a Main Category
  },
  productType: {
    type: String,
    enum: ['standard', 'clothing', 'food', 'electronics', 'custom'],
    default: 'standard',
  },
  customAttributes: [AttributeSchema],
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
