import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    unique: true,
    sparse: true
  },

  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },

  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transporter'
  },

  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  // Request type: who initiated the trip request
  requestType: {
    type: String,
    enum: ['transporter-initiated', 'transporter-initiated-request', 'distributor-initiated'],
    default: 'transporter-initiated'
  },

  // Request lifecycle status
  requestStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },

  // Who proposed the request (transporter or distributor)
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proposer reference is required']
  },

  // Trip execution status (after request acceptance)
  tripStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  // Rejection details
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes
TripSchema.index({ transporter: 1, tripStatus: 1 });
TripSchema.index({ proposedBy: 1, requestStatus: 1 });
TripSchema.index({ requestType: 1, requestStatus: 1 });
TripSchema.index({ vehicle: 1, tripStatus: 1 });
TripSchema.index({ 'schedule.scheduledPickup': 1 });

// Generate Trip ID - FIXED: Don't use next() with async function
TripSchema.pre('save', async function() {
  if (this.isNew) {
    try {
      const Trip = mongoose.model('Trip');
      const count = await Trip.countDocuments({ transporter: this.transporter });
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      this.tripId = `TRIP${year}${month}${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      throw error; // Just throw the error instead of passing to next()
    }
  }
});

// Calculate total cost - FIXED: Don't use next parameter
TripSchema.pre('save', function() {
  try {
    const additionalTotal = this.costs.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;
    this.costs.totalCost = this.costs.baseFare + this.costs.distanceCharge + additionalTotal;
  } catch (error) {
    throw error;
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