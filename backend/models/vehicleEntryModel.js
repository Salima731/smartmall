import mongoose from 'mongoose';

// VehicleLog — stores parking entry/exit transactions
const vehicleEntrySchema = mongoose.Schema(
  {
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    parkingSpace: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpace' },
    parkingBay: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingBay' },
    vehicleNumber: { type: String, required: true },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    fee: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'None'], default: 'None' },
    razorpayPaymentId: { type: String },
    utrNumber: { type: String },
    paymentDate: { type: Date },
    status: { type: String, enum: ['Parked', 'Exited'], default: 'Parked' },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const VehicleEntry = mongoose.model('VehicleEntry', vehicleEntrySchema);
export default VehicleEntry;
