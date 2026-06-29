import mongoose from 'mongoose';

const alertSchema = mongoose.Schema(
  {
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    type: {
      type: String,
      enum: ['Fire', 'Medical', 'Lost Child', 'Parking Blocked', 'General'],
      required: true,
    },
    message: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
