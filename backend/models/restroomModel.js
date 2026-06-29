import mongoose from 'mongoose';

const restroomSchema = mongoose.Schema(
  {
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    location: { type: String, required: true }, // e.g., "Near Food Court"
    floor: { type: String, default: 'Floor 1' },
    gender: { type: String, enum: ['Male', 'Female', 'Unisex'], required: true },
    status: { 
      type: String, 
      enum: ['Available', 'Closed for Cleaning', 'Clean', 'Occupied', 'Needs Cleaning', 'Maintenance', 'Closed'], 
      default: 'Clean' 
    },
    lastCleanedAt: { type: Date, default: Date.now },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    occupancy: { type: Number, default: 0 }, // Current occupancy count
    averageRating: { type: Number, default: 4.8 },
    maintenanceReports: [
      {
        issue: { type: String, required: true },
        reportedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
        reportedBy: { type: String, default: 'Staff' }
      }
    ],
    complaints: [
      {
        qrCodeId: { type: String },
        complaint: { type: String, required: true },
        rating: { type: Number, default: 5 },
        submittedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const Restroom = mongoose.model('Restroom', restroomSchema);
export default Restroom;
