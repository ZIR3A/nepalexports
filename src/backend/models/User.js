import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  firstName: { type: String },
  lastName: { type: String },
  avatarUrl: { type: String },
  phoneNumber: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  kycStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING',
  },
  password: {
    type: String,
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'warehouse_manager', 'marketing_admin', 'super_admin'],
    default: 'user',
  },
  image: {
    type: String,
  },
  googleId: {
    type: String,
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    type: mongoose.Schema.Types.Mixed // Full cart payload to match frontend caching
  }],
  paymentMethods: [{
    type: { type: String, enum: ['Visa', 'Mastercard', 'Amex'] },
    last4: { type: String },
    expiry: { type: String }
  }],
  preferences: {
    orderUpdates: { type: Boolean, default: true },
    newArrivals: { type: Boolean, default: false },
    flashSales: { type: Boolean, default: true },
    backInStock: { type: Boolean, default: true },
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
