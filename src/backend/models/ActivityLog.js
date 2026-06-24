import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: null, // Nullable for now
  },
  action_type: {
    type: String,
    required: true,
  },
  target_resource: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // JSON diff or summary
  }
}, { timestamps: true });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
