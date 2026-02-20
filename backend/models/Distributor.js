import mongoose from 'mongoose';
import User from './User.js';

const DistributorSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  businessRegNumber: { type: String, required: true },
  warehouseCapacity: { type: Number }
});

const Distributor = User.discriminator('Distributor', DistributorSchema);

export default Distributor;