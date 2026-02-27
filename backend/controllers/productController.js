import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import mongoose from 'mongoose';


export const createProduct = async (req, res) => {
  try {
    console.log('Create product called');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, no user found' 
      });
    }
    
    const userId = req.user._id;
    
    const farmer = await Farmer.findById(userId);
    if (!farmer) {
      return res.status(403).json({ 
        success: false,
        message: 'Only farmers can create products' 
      });
    }

    const productData = req.body;

    
    const requiredFields = ['productName', 'category', 'quantity', 'unit', 'price'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (!productData.pickupLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup location is required'
      });
    }

    if (!productData.pickupLocation.address) {
      return res.status(400).json({
        success: false,
        message: 'Pickup address is required'
      });
    }

    if (!productData.pickupLocation.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Pickup location coordinates are required'
      });
    }

    if (!productData.pickupLocation.coordinates.lat || !productData.pickupLocation.coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude are required for pickup location'
      });
    }

    // Validate coordinate ranges
    const lat = Number(productData.pickupLocation.coordinates.lat);
    const lng = Number(productData.pickupLocation.coordinates.lng);

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    let pickupLocation = { ...productData.pickupLocation };
    
    
    const isFarmerLocation = farmer.location?.coordinates && 
      Math.abs(farmer.location.coordinates.lat - lat) < 0.0001 && 
      Math.abs(farmer.location.coordinates.lng - lng) < 0.0001;

    pickupLocation.type = isFarmerLocation ? 'Farmer Location' : 'Custom Location';

    
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
      pickupLocation: {
        type: pickupLocation.type,
        address: pickupLocation.address,
        city: pickupLocation.city || farmer.location?.city || '',
        district: pickupLocation.district || farmer.location?.district || '',
        coordinates: {
          lat: lat,
          lng: lng
        },
        instructions: pickupLocation.instructions || ''
      },
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

    
    const filter = { isAvailable: true };

    if (category) filter.category = category;
    if (status) filter.status = status;
    
    if (district) {
      filter['pickupLocation.district'] = district;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    
    if (search) {
      filter.$text = { $search: search };
    }

    
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


export const getMyProducts = async (req, res) => {
  try {
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


export const getProductById = async (req, res) => {
  try {
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


export const updateProduct = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
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

   
    if (product.farmer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product'
      });
    }

    const updateData = { ...req.body };
    
    
    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
    if (updateData.price) updateData.price = Number(updateData.price);
    
    
    if (updateData.pickupLocation) {
      
      if (updateData.pickupLocation.address === '') {
        return res.status(400).json({
          success: false,
          message: 'Pickup address cannot be empty'
        });
      }
      
      
      if (updateData.pickupLocation.coordinates) {
        if (!updateData.pickupLocation.coordinates.lat || !updateData.pickupLocation.coordinates.lng) {
          return res.status(400).json({
            success: false,
            message: 'Both latitude and longitude are required for pickup location'
          });
        }
        
        
        const lat = Number(updateData.pickupLocation.coordinates.lat);
        const lng = Number(updateData.pickupLocation.coordinates.lng);

        if (lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: 'Latitude must be between -90 and 90'
          });
        }

        if (lng < -180 || lng > 180) {
          return res.status(400).json({
            success: false,
            message: 'Longitude must be between -180 and 180'
          });
        }
        
        
        updateData.pickupLocation.coordinates = {
          lat: lat,
          lng: lng
        };
        
        
        const farmer = await Farmer.findById(userId);
        if (farmer.location?.coordinates) {
          const isFarmerLocation = 
            Math.abs(farmer.location.coordinates.lat - lat) < 0.0001 && 
            Math.abs(farmer.location.coordinates.lng - lng) < 0.0001;
          
          updateData.pickupLocation.type = isFarmerLocation ? 'Farmer Location' : 'Custom Location';
        }
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


export const deleteProduct = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }

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


export const toggleAvailability = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
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

export const findProductsNearby = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query; 
    const { page = 1, limit = 10, category, minPrice, maxPrice } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    
    const filter = {
      isAvailable: true,
      status: 'Available'
    };

    if (category) {
      filter.category = category;
    }

   
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter)
      .populate('farmer', 'fullName phone')
      .lean();

    const productsWithDistance = products.map(product => {
      if (product.pickupLocation?.coordinates) {
        const distance = calculateDistance(
          latitude,
          longitude,
          product.pickupLocation.coordinates.lat,
          product.pickupLocation.coordinates.lng
        );
        return {
          ...product,
          distance: Math.round(distance * 1000) / 1000 
        };
      }
      return {
        ...product,
        distance: null
      };
    })
    .filter(p => p.distance !== null && p.distance * 1000 <= maxDistance) // Convert km to m for comparison
    .sort((a, b) => a.distance - b.distance);

    
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedProducts = productsWithDistance.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: paginatedProducts.length,
      total: productsWithDistance.length,
      page: Number(page),
      pages: Math.ceil(productsWithDistance.length / Number(limit)),
      products: paginatedProducts
    });
  } catch (error) {
    console.error('Find nearby products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby products',
      error: error.message
    });
  }
};


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


export const getProductsByFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 10, status = 'Available' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farmer ID format'
      });
    }

    const filter = {
      farmer: farmerId,
      isAvailable: true,
      status: status
    };

    const products = await Product.find(filter)
      .populate('farmer', 'fullName phone location')
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
    console.error('Get products by farmer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products by farmer',
      error: error.message
    });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          averagePrice: { $avg: '$price' },
          availableProducts: {
            $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
          },
          soldOutProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'Sold Out'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        availableProducts: 0,
        soldOutProducts: 0
      },
      categoryStats
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
};