import mongoose from 'mongoose';

const offerSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountPercentage: { type: Number, default: 10 },
    // Optional product link (legacy / product-specific offers)
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    // Shop direct links (used by OfferManager)
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    offerType: { type: String, default: 'Festival Offer' },
    category: { type: String, default: 'General' },
    couponCode: { type: String, default: '' },
    audience: { type: String, default: 'All Users' },
    banner: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    redemptionLimit: { type: Number, default: null },
    termsAndConditions: { type: String, default: '' },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    sendNotification: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Scheduled', 'Expired', 'Rejected', 'Suspended', 'Under Review', 'Approved'],
      default: 'Active',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
