// models/AggregatedRating.js
import mongoose from 'mongoose';

const AggregatedRatingSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['Farmer', 'Distributor', 'Transporter'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  // Role-specific stats
  farmerSpecific: {
    averageProductQuality: { type: Number, default: 0 },
    averageFreshness: { type: Number, default: 0 },
    averagePackaging: { type: Number, default: 0 }
  },
  transporterSpecific: {
    averageTimeliness: { type: Number, default: 0 },
    averageVehicleCondition: { type: Number, default: 0 },
    averageProfessionalism: { type: Number, default: 0 }
  },
  distributorSpecific: {
    averagePaymentReliability: { type: Number, default: 0 },
    averageCommunication: { type: Number, default: 0 },
    wouldWorkAgainPercentage: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

AggregatedRatingSchema.index({ targetType: 1, targetId: 1 }, { unique: true });

const AggregatedRating = mongoose.model('AggregatedRating', AggregatedRatingSchema);
export default AggregatedRating;