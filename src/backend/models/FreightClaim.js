import mongoose from 'mongoose';

const FreightClaimSchema = new mongoose.Schema({
  transfer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transfer',
    required: true
  },
  transferReference: {
    type: String,
    required: true
  },
  cargoTrackingNumber: {
    type: String
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId
  },
  missingQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Claim Filed', 'Reimbursed', 'Resolved'],
    default: 'Pending'
  },
  logisticsCompany: {
    type: String,
    default: 'Unknown'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

export default mongoose.models.FreightClaim || mongoose.model('FreightClaim', FreightClaimSchema);
