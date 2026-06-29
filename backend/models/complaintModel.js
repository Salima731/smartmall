import mongoose from 'mongoose';

const complaintSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // If against a shop
    department: { type: String, enum: ['Management', 'Security', 'Parking', 'Restroom', 'Shop'] },
    
    subject: { type: String, required: true },
    description: { type: String, required: true },
    
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Emergency'], 
      default: 'Medium' 
    },
    
    status: {
      type: String,
      enum: ['Open', 'In-Review', 'Resolved', 'Closed'],
      default: 'Open',
    },
    
    adminNotes: [
      {
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
