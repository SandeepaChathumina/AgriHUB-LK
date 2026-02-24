import mongoose from 'mongoose';

const baseOptions = {
  discriminatorKey: 'role', 
  collection: 'users',      
  timestamps: true          
};

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  location: {
    address: { type: String },
    city: { type: String },
    district: { type: String }
  }
}, baseOptions);

const User = mongoose.model('User', UserSchema);

export default User;