import mongoose from 'mongoose';

const parkingSlotSchema = mongoose.Schema(
  {
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    slotNumber: { type: String, required: true },
    type: { type: String, enum: ['Two-Wheeler', 'Four-Wheeler'], required: true },
    isOccupied: { type: Boolean, default: false }, // Legacy field, keeping for backward compatibility
    status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'VIP', 'Maintenance'], default: 'Available' },
    floor: { type: String },
  },
  { timestamps: true }
);

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
export default ParkingSlot;
