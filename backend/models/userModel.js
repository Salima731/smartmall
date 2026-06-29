import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth
    googleId: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ['Super Admin', 'Mall Admin', 'Shop Owner', 'Staff', 'User'],
      default: 'User',
    },
    department: {
      type: String,
      enum: ['Parking', 'Restrooms', 'General'],
      default: 'General',
    },
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall' }, // For Mall Admin/Staff
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    vehicleNumbers: [{ type: String }], // Customer's registered vehicle plates
    otp: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
