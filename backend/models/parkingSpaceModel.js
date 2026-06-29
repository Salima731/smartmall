import mongoose from 'mongoose';

// ParkingSpace — represents a zone/area within a mall (e.g. "Ground Floor 4-Wheeler")
const parkingSpaceSchema = mongoose.Schema(
  {
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    name: { type: String, required: true }, // e.g. "Block A - Four Wheeler"
    totalCapacity: { type: Number, required: true },
    availableSpaces: { type: Number },
    occupiedSpaces: { type: Number, default: 0 },
    parkingFeePerHour: { type: Number, default: 0 },
    vehicleType: {
      type: String,
      enum: ['Two-Wheeler', 'Four-Wheeler'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Full', 'Maintenance'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

// Auto-set availableSpaces when totalCapacity is set
parkingSpaceSchema.pre('save', function (next) {
  if (this.isNew && this.availableSpaces === undefined) {
    this.availableSpaces = this.totalCapacity;
  }
  next();
});

const ParkingSpace = mongoose.model('ParkingSpace', parkingSpaceSchema);
export default ParkingSpace;
