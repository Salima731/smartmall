import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    image: { type: String },
    gallery: [{ type: String }],
    category: { type: String, required: true },
    brand: { type: String },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    countInStock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Active', 'Out of Stock', 'Hidden', 'Draft', 'Under Review', 'Approved', 'Suspended'], default: 'Active' },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
