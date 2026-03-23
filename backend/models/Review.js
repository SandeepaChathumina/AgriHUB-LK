// models/Review.js
import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  // Who is giving the review
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Role of the reviewer (for quick filtering)
  reviewerRole: {
    type: String,
    enum: ['Farmer', 'Distributor', 'Transporter'],
    required: true
  },
  
  // What is being reviewed
  targetType: {
    type: String,
    enum: ['Farmer', 'Distributor', 'Transporter'],
    required: true
  },
  
  // The specific target being reviewed
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  // Order reference (to verify transaction)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Review content
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Category-specific ratings
  criteria: {
    // For Farmer reviews (by Distributor)
    productQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    freshness: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // For Transporter reviews (by Distributor)
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    vehicleCondition: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // For Distributor reviews (by Farmer)
    paymentReliability: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    wouldWorkAgain: {
      type: Boolean,
      default: true
    }
  },
  
  // Images
  images: [{
    url: String,
    caption: String
  }],
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  isPublished: {
    type: Boolean,
    default: true
  },
  
  // Admin moderation
  moderationStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  
  moderationNote: {
    type: String,
    trim: true
  },
  
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Response from the target
  response: {
    text: {
      type: String,
      trim: true,
      maxlength: 500
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
  
}, {
  timestamps: true
});

// Ensure one user can only review a target once per order
ReviewSchema.index(
  { reviewer: 1, targetType: 1, targetId: 1, order: 1 }, 
  { unique: true }
);

// Indexes for efficient queries
ReviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ReviewSchema.index({ targetType: 1, targetId: 1, rating: -1 });
ReviewSchema.index({ moderationStatus: 1, createdAt: -1 });
ReviewSchema.index({ reviewer: 1, createdAt: -1 });

// Virtual for average rating calculation
ReviewSchema.virtual('averageRating').get(function() {
  if (this.targetType === 'Farmer') {
    const ratings = [this.rating, this.criteria.productQuality, this.criteria.freshness, this.criteria.packaging];
    const validRatings = ratings.filter(r => r);
    return validRatings.length ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : this.rating;
  }
  if (this.targetType === 'Transporter') {
    const ratings = [this.rating, this.criteria.timeliness, this.criteria.vehicleCondition, this.criteria.professionalism];
    const validRatings = ratings.filter(r => r);
    return validRatings.length ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : this.rating;
  }
  if (this.targetType === 'Distributor') {
    const ratings = [this.rating, this.criteria.paymentReliability, this.criteria.communication];
    const validRatings = ratings.filter(r => r);
    return validRatings.length ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : this.rating;
  }
  return this.rating;
});

const Review = mongoose.model('Review', ReviewSchema);
export default Review;