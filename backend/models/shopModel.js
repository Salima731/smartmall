import mongoose from 'mongoose';

const shopSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true },
    shopType: {
      type: String,
      enum: ['Retail', 'Restaurant', 'Food Court', 'Cafe', 'Bakery', 'Juice Bar'],
      default: 'Retail',
    },
    floor: { type: String },
    image: { type: String }, // Used as logo
    banner: { type: String },
    description: { type: String },
    contactDetails: {
      phone: { type: String },
      email: { type: String },
    },
    timings: {
      open: { type: String, default: '10:00 AM' },
      close: { type: String, default: '10:00 PM' },
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Suspended', 'Closed'],
      default: 'Active',
    },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Shop = mongoose.model('Shop', shopSchema);
export default Shop;
