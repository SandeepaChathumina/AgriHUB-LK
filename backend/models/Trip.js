import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    unique: true,
    sparse: true
    // NO index: true here - removed completely
  },

  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required'],
    unique: true
  },

  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transporter',
    required: [true, 'Transporter reference is required']
  },

  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle assignment is required']
  },

  tripStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  pickupLocation: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    city: String,
    district: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String,
    contactPerson: {
      name: String,
      phone: String
    }
  },

  dropoffLocation: {
    address: {
      type: String,
      required: [true, 'Dropoff address is required']
    },
    city: {
      type: String,
      required: [true, 'Dropoff city is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String,
    contactPerson: {
      name: String,
      phone: String
    }
  },

  schedule: {
    scheduledPickup: {
      type: Date,
      required: [true, 'Scheduled pickup time is required']
    },
    estimatedDelivery: {
      type: Date,
      required: [true, 'Estimated delivery time is required']
    },
    actualPickup: Date,
    actualDelivery: Date
  },

  distance: {
    value: Number,
    unit: { type: String, enum: ['km'], default: 'km' }
  },

  estimatedDuration: Number,

  costs: {
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: [0, 'Base fare cannot be negative']
    },
    distanceCharge: {
      type: Number,
      default: 0,
      min: [0, 'Distance charge cannot be negative']
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative']
    }
  },

  currency: {
    type: String,
    default: 'LKR',
    enum: ['LKR', 'USD']
  },

  specialInstructions: String,

  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  cancellationReason: String,
  cancelledAt: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

// Define indexes HERE - only once
// This is the ONLY place where indexes are defined
TripSchema.index({ tripId: 1 });
TripSchema.index({ transporter: 1, tripStatus: 1 });
TripSchema.index({ vehicle: 1, tripStatus: 1 });
TripSchema.index({ 'schedule.scheduledPickup': 1 });

// Generate Trip ID
TripSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Trip = mongoose.model('Trip');
      const count = await Trip.countDocuments({ transporter: this.transporter });
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      this.tripId = `TRIP${year}${month}${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Calculate total cost
TripSchema.pre('save', function(next) {
  try {
    const additionalTotal = this.costs.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;
    this.costs.totalCost = this.costs.baseFare + this.costs.distanceCharge + additionalTotal;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to add timeline
TripSchema.methods.addTimelineEvent = function(status, note = '', userId = null) {
  this.timeline.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy: userId
  });
};

const Trip = mongoose.model('Trip', TripSchema);
export default Trip;