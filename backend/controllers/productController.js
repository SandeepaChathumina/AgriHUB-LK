import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import mongoose from 'mongoose';

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Farmer only)
export const createProduct = async (req, res) => {
  try {
    console.log('Create product called');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    // Check if user exists (from protect middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, no user found' 
      });
    }
    
    const userId = req.user._id;
    
    // Check if user is a farmer
    const farmer = await Farmer.findById(userId);
    if (!farmer) {
      return res.status(403).json({ 
        success: false,
        message: 'Only farmers can create products' 
      });
    }

    const productData = req.body;

    // Validate required fields
    const requiredFields = ['productName', 'category', 'quantity', 'unit', 'price'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Handle pickup location
    let pickupLocation = productData.pickupLocation || {};
    
    // If no pickup location type specified, default to Farmer Location
    if (!pickupLocation.type) {
      pickupLocation.type = 'Farmer Location';
    }

    // If using Farmer Location, populate with farmer's location
    if (pickupLocation.type === 'Farmer Location') {
      pickupLocation = {
        type: 'Farmer Location',
        address: farmer.location?.address || '',
        city: farmer.location?.city || '',
        district: farmer.location?.district || '',
        instructions: pickupLocation.instructions || ''
      };
    }

    // Create product object
    const product = new Product({
      productName: productData.productName,
      category: productData.category,
      variety: productData.variety || '',
      quantity: Number(productData.quantity),
      unit: productData.unit,
      price: Number(productData.price),
      currency: productData.currency || 'LKR',
      description: productData.description || '',
      quality: productData.quality || 'Standard',
      harvestDate: productData.harvestDate || null,
      expiryDate: productData.expiryDate || null,
      images: productData.images || [],
      isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : true,
      status: productData.status || 'Available',
      pickupLocation,
      farmer: userId
    });

    await product.save();
    await product.populate('farmer', 'fullName phone location farmSize mainCrops');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Get all products (with filters)
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      district,
      status = 'Available',
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isAvailable: true };

    if (category) filter.category = category;
    if (status) filter.status = status;
    
    // Search by pickup location district
    if (district) {
      filter['pickupLocation.district'] = district;
    }
    
    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(filter)
      .populate('farmer', 'fullName phone location farmSize mainCrops')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get farmer's products
// @route   GET /api/products/farmer/my-products
// @access  Private (Farmer only)
export const getMyProducts = async (req, res) => {
  try {
    // Check if user exists (from protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
    const userId = req.user._id;
    
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { farmer: userId };
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('farmer', 'fullName phone location farmSize mainCrops');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.viewCount = (product.viewCount || 0) + 1;
    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Farmer owner only)
export const updateProduct = async (req, res) => {
  try {
    // Check if user exists (from protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    const userId = req.user._id;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if the authenticated user owns this product
    if (product.farmer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product'
      });
    }

    // Handle pickup location update
    const updateData = { ...req.body };
    
    // Convert string numbers to actual numbers
    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
    if (updateData.price) updateData.price = Number(updateData.price);
    
    if (updateData.pickupLocation) {
      // If custom location is provided, ensure type is set correctly
      if (updateData.pickupLocation.type !== 'Farmer Location') {
        updateData.pickupLocation.type = 'Custom Location';
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('farmer', 'fullName phone location');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Farmer owner only or Admin)
export const deleteProduct = async (req, res) => {
  try {
    // Check if user exists (from protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const userId = req.user._id;
    const userRole = req.user.role;
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user is authorized (owner or admin)
    const isOwner = product.farmer.toString() === userId.toString();
    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Update product availability
// @route   PATCH /api/products/:id/availability
// @access  Private (Farmer owner only)
export const toggleAvailability = async (req, res) => {
  try {
    // Check if user exists (from protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    const userId = req.user._id;
    const { isAvailable } = req.body;
    
    if (isAvailable === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isAvailable field is required'
      });
    }
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if the authenticated user owns this product
    if (product.farmer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product'
      });
    }

    product.isAvailable = isAvailable;
    product.status = isAvailable ? 'Available' : 'Sold Out';
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product marked as ${isAvailable ? 'available' : 'unavailable'}`,
      product
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
};

// @desc    Get products by pickup location district
// @route   GET /api/products/location/:district
// @access  Public
export const getProductsByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const filter = {
      'pickupLocation.district': district,
      isAvailable: true,
      status: 'Available'
    };

    const products = await Product.find(filter)
      .populate('farmer', 'fullName phone')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    console.error('Get products by district error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products by location',
      error: error.message
    });
  }
};