import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Specific user, if any
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['Order', 'Offer', 'Parking', 'System'],
      default: 'System',
    },
    isRead: { type: Boolean, default: false },
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall' },

    // For Role-based or Global broadcasts
    isGlobal: { type: Boolean, default: false },
    targetRoles: [{ type: String, enum: ['Super Admin', 'Mall Admin', 'Shop Owner', 'Staff', 'User'] }],
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin or staff who sent it
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
