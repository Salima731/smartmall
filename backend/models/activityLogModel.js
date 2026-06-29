import mongoose from 'mongoose';

const activityLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'LOGIN', 'LOGOUT', 'CREATE_MALL', 'DELETE_USER', 'UPDATE_SHOP_STATUS', 'MODERATE_PRODUCT'
    },
    details: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetModel: {
      type: String, // e.g., 'User', 'Mall', 'Shop', 'Product', 'Offer', 'Review', 'Complaint'
    },
    severity: {
      type: String,
      enum: ['Info', 'Warning', 'Critical'],
      default: 'Info',
    },
    mall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mall', // For Mall Admin filtering
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
