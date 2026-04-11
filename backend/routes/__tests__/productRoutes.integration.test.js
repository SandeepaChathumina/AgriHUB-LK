/* eslint-env jest */
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// 1. MOCK THE AUTH MIDDLEWARE
jest.mock('../../middleware/authMiddleware.js', () => ({
  protect: jest.fn((req, res, next) => {
    if (req.headers['x-mock-user-id']) {
      req.user = {
        _id: req.headers['x-mock-user-id'],
        role: req.headers['x-mock-user-role']
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }),
  authorizeRoles: (...allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    };
  }
}));

// 2. MOCK CLOUDINARY & MULTER
jest.mock('../../config/cloudinary.js', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://cloudinary.com/test-image.jpg',
      public_id: 'test_public_id'
    }),
    destroy: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../middleware/upload.js', () => ({
  array: () => (req, res, next) => {
    req.files = [{ path: 'test/path/img1.jpg', originalname: 'img1.jpg' }];
    next();
  }
}));

// 3. IMPORT REAL ROUTES AND MODELS
import productRoutes from '../productRoutes.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';

// 4. SET UP THE TEST EXPRESS APP
const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Product Routes Integration Tests', () => {
  let mongoServer;
  let farmerId;
  let adminId;
  let testProductId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    User.schema.set('strict', false);
    Product.schema.set('strict', false);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    // CREATE FARMER
    const farmerUser = new User({ 
      fullName: 'Farmer Kamal', 
      role: 'Farmer', 
      email: 'kamal@test.com',
      location: { district: 'Colombo', city: 'Colombo', coordinates: { lat: 6.9, lng: 79.8 } }
    });
    await farmerUser.save({ validateBeforeSave: false });
    farmerId = farmerUser._id.toString();

    // CREATE ADMIN
    const adminUser = new User({ fullName: 'Admin User', role: 'Admin', email: 'admin@test.com' });
    await adminUser.save({ validateBeforeSave: false });
    adminId = adminUser._id.toString();

    // --- CRITICAL FIX: Add full pickupLocation details to pass model validation ---
    const product = new Product({
      farmer: farmerId,
      productName: 'Fresh Leeks',
      category: 'Vegetables',
      price: 150,
      quantity: 100,
      unit: 'kg',
      isAvailable: true,
      pickupLocation: { 
        address: 'No 1, Farm Road, Colombo', // REQUIRED
        city: 'Colombo',
        district: 'Colombo',
        coordinates: { lat: 6.9, lng: 79.8 } 
      }
    });
    await product.save({ validateBeforeSave: false });
    testProductId = product._id.toString();
  });

  describe('GET /api/products (Public Access)', () => {
    it('should allow anyone to fetch the product list without a token', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.products.length).toBe(1);
    });
  });

  describe('POST /api/products (Farmer Only)', () => {
    it('should block non-farmers from creating products', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('x-mock-user-id', adminId)
        .set('x-mock-user-role', 'Admin')
        .send({ productName: 'Illegal Carrots' });

      expect(res.statusCode).toBe(403);
    });

    it('should allow a farmer to create a product and save it to the DB', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('x-mock-user-id', farmerId)
        .set('x-mock-user-role', 'Farmer')
        .send({
          productName: 'Organic Spinach',
          category: 'Vegetables',
          price: 80,
          quantity: 200,
          unit: 'kg',
          pickupLocation: {
            address: '123 Farm Lane',
            coordinates: { lat: 6.92, lng: 79.86 }
          }
        });

      expect(res.statusCode).toBe(201);
      const dbProduct = await Product.findOne({ productName: 'Organic Spinach' });
      expect(dbProduct).toBeTruthy();
    });
  });

  describe('PATCH /api/products/:id/availability', () => {
    it('should toggle product availability in the database', async () => {
      const res = await request(app)
        .patch(`/api/products/${testProductId}/availability`)
        .set('x-mock-user-id', farmerId)
        .set('x-mock-user-role', 'Farmer')
        .send({ isAvailable: false });

      expect(res.statusCode).toBe(200);
      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct.isAvailable).toBe(false);
      expect(updatedProduct.status).toBe('Sold Out');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should allow a farmer to delete their own product', async () => {
      const res = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set('x-mock-user-id', farmerId)
        .set('x-mock-user-role', 'Farmer');

      expect(res.statusCode).toBe(200);
      const deletedProduct = await Product.findById(testProductId);
      expect(deletedProduct).toBeNull();
    });
  });
});