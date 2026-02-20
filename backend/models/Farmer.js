import mongoose from 'mongoose';
import User from './User.js'; // Must include .js

const FarmerSchema = new mongoose.Schema({
  farmSize: { type: Number, required: true },
  mainCrops: [{ type: String }],
  nicNumber: { type: String, required: true }
});

const Farmer = User.discriminator('Farmer', FarmerSchema);

export default Farmer;