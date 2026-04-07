import mongoose from 'mongoose';
import User from './User.js';

const TransporterSchema = new mongoose.Schema({
  companyName: { 
    type: String, 
    required: true 
  },
  businessRegNumber: { 
    type: String, 
    required: true 
  },
  fleetSize: { 
    type: Number, 
    default: 0
  },

  logo: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' }
  }
});

const Transporter = User.discriminator('Transporter', TransporterSchema);

export default Transporter;