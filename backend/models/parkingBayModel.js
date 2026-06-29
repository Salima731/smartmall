import mongoose from 'mongoose';

// ParkingBay — represents an individual parking slot within a ParkingSpace zone
const parkingBaySchema = mongoose.Schema(
  {
    parkingSpace: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpace', required: true },
    slotNumber: { type: String, required: true }, // e.g. "A-01", "B-12"
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

const ParkingBay = mongoose.model('ParkingBay', parkingBaySchema);
export default ParkingBay;
