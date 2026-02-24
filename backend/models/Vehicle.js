import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transporter',
    required: [true, 'Vehicle must belong to a transporter']
  },
  
  category: {
    type: String,
    required: [true, 'Vehicle category is required'],
    enum: ['Truck', 'Lorry', 'Pickup', 'Van']
  },
  
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['Open body', 'Covered body', 'Refrigerated', 'Container']
  },
  
  loadCapacity: {
    weight: {
      value: {
        type: Number,
        required: [true, 'Weight capacity is required'],
        min: [500, 'Weight capacity cannot be less than 500kg']
      },
      unit: { type: String, enum: ['kg'], default: 'kg' }
    },
    volume: {
      value: {
        type: Number,
        min: [100, 'Volume capacity cannot be less than 100L']
      },
      unit: { type: String, enum: ['L'], default: 'L' }
    }
  },
  
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  brand: { type: String, required: [true, 'Brand is required'], trim: true },
  model: { type: String, required: [true, 'Model is required'], trim: true },
  
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Diesel', 'Petrol', 'Electric', 'Hybrid']
  },
  
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Delivery', 'Maintenance', 'Offline'],
    default: 'Available'
  },
  
  manufacturingYear: Number,
  lastMaintenanceDate: Date,
  nextMaintenanceDue: Date,
  insuranceExpiry: Date,
  registrationExpiry: Date
}, { timestamps: true });

// Fixed pre-save hook - async function WITHOUT next parameter
VehicleSchema.pre('save', async function() {
  // Only generate vehicleId for new documents
  if (this.isNew) {
    try {
      const Vehicle = mongoose.model('Vehicle');
      
      // Count existing vehicles for this transporter and category
      const count = await Vehicle.countDocuments({
        transporter: this.transporter,
        category: this.category
      });
      
      // Generate vehicle ID (e.g., T001, L002, etc.)
      const prefix = { 
        'Truck': 'T', 
        'Lorry': 'L', 
        'Pickup': 'P', 
        'Van': 'V' 
      }[this.category] || 'V';
      
      this.vehicleId = `${prefix}${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      // In async middleware without next, throw the error
      throw error;
    }
  }
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;