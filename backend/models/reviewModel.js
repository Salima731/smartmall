import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['Shop', 'Restroom', 'Parking', 'Mall', 'Product'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved'
    },
    isVerifiedPurchase: { type: Boolean, default: false } // Verified reviews feature
  },
  { timestamps: true }
);

// One review per user per target
reviewSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
