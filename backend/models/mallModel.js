import mongoose from 'mongoose';

const mallSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    image: { type: String },
    logo: { type: String },
    gallery: { type: [String], default: [] },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mallSchema.index({ location: '2dsphere' });

const Mall = mongoose.model('Mall', mallSchema);
export default Mall;
