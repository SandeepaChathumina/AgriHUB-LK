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
  
  manufacturingYear: {
    type: Number,
    min: 1950,
    max: new Date().getFullYear()
  },
  
  lastMaintenanceDate: Date,
  nextMaintenanceDue: Date,
  insuranceExpiry: Date,
  registrationExpiry: Date,
  
  images: [{
    url: String,
    publicId: String
  }]
}, { timestamps: true });

// Fixed pre-save hook - generate unique vehicle ID per transporter
VehicleSchema.pre('save', async function() {
  if (this.isNew) {
    try {
      const Vehicle = mongoose.model('Vehicle');
      
      // Get all vehicles for this transporter
      const vehicles = await Vehicle.find({ transporter: this.transporter });
      
      // Count existing vehicles for this transporter
      const count = vehicles.length;
      
      // Get prefix based on category
      const prefix = { 
        'Truck': 'TRK',
        'Lorry': 'LRY', 
        'Pickup': 'PCK', 
        'Van': 'VAN'
      }[this.category] || 'VEH';
      
      // Generate unique ID (e.g., TRK001, LRY002, etc.)
      let newId = `${prefix}${String(count + 1).padStart(3, '0')}`;
      
      // Ensure uniqueness across all vehicles (not just this transporter's)
      let existingVehicle = await Vehicle.findOne({ vehicleId: newId });
      let counter = 1;
      
      while (existingVehicle) {
        newId = `${prefix}${String(count + counter).padStart(3, '0')}`;
        existingVehicle = await Vehicle.findOne({ vehicleId: newId });
        counter++;
      }
      
      this.vehicleId = newId;
    } catch (error) {
      throw error;
    }
  }
  
  // Auto set status to Offline if insurance or registration expired
  const today = new Date();
  if (this.insuranceExpiry && new Date(this.insuranceExpiry) < today) {
    this.status = 'Offline';
  }
  if (this.registrationExpiry && new Date(this.registrationExpiry) < today) {
    this.status = 'Offline';
  }
});

// Middleware to check expiry on update
VehicleSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  if (update.$set) {
    const today = new Date();
    if (update.$set.insuranceExpiry && new Date(update.$set.insuranceExpiry) < today) {
      update.$set.status = 'Offline';
    }
    if (update.$set.registrationExpiry && new Date(update.$set.registrationExpiry) < today) {
      update.$set.status = 'Offline';
    }
  }
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;