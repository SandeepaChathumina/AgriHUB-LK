import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer ID is required'],
    index: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other']
  },
  variety: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'g', 'ton', 'dozen', 'pieces', 'litre', 'bundle']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'LKR',
    enum: ['LKR', 'USD']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  quality: {
    type: String,
    enum: ['Premium', 'Standard', 'Economy'],
    default: 'Standard'
  },
  harvestDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Sold Out', 'Pending'],
    default: 'Available'
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Farmer Location', 'Custom Location'],
      default: 'Farmer Location'
    },
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    city: String,
    district: String,
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required for pickup location']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required for pickup location']
      }
    },
    instructions: {
      type: String,
      maxlength: [200, 'Pickup instructions cannot exceed 200 characters']
    }
  },
  location: {
    address: String,
    city: String,
    district: String
  },
  totalSold: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for search
ProductSchema.index({ productName: 'text', description: 'text', category: 'text' });
ProductSchema.index({ farmer: 1, createdAt: -1 });
ProductSchema.index({ status: 1, isAvailable: 1 });
ProductSchema.index({ 'pickupLocation.district': 1, category: 1 });
ProductSchema.index({ price: 1 });

// COMMENT OUT THE PRE-SAVE MIDDLEWARE TEMPORARILY TO TEST
// ProductSchema.pre('save', async function(next) {
//   try {
//     // Your code here
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

const Product = mongoose.model('Product', ProductSchema);

export default Product;