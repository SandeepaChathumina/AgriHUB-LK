import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
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
    type: String, // URLs to product images
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
  location: {
    address: String,
    city: String,
    district: String
  },
  totalSold: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
ProductSchema.index({ productName: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', ProductSchema);

export default Product;