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

// 2. IMPORT REAL ROUTES AND MODELS
import reviewRoutes from '../reviewRoutes.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Review from '../../models/Review.js';
import AggregatedRating from '../../models/AggregatedRating.js';

// 3. SET UP THE TEST EXPRESS APP
const app = express();
app.use(express.json());
app.use('/api/reviews', reviewRoutes);

describe('Review Routes Integration Tests', () => {
  let mongoServer;
  let farmerId;
  let distributorId;
  let adminId;
  let testOrderId;
  let testReviewId;
  let testProductId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    User.schema.set('strict', false);
    Order.schema.set('strict', false);
    Product.schema.set('strict', false);
    Review.schema.set('strict', false);
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

    const farmer = new User({ fullName: 'Farmer John', role: 'Farmer', email: 'f@test.com' });
    await farmer.save({ validateBeforeSave: false });
    farmerId = farmer._id.toString();

    const distributor = new User({ fullName: 'Distributor Dave', role: 'Distributor', email: 'd@test.com' });
    await distributor.save({ validateBeforeSave: false });
    distributorId = distributor._id.toString();

    const admin = new User({ fullName: 'Admin User', role: 'Admin', email: 'admin@test.com' });
    await admin.save({ validateBeforeSave: false });
    adminId = admin._id.toString();

    const product = new Product({ 
        farmer: farmerId, 
        productName: 'Apples', 
        unit: 'kg', 
        category: 'Fruits',
        pickupLocation: { address: 'Farm', coordinates: { lat: 0, lng: 0 } }
    });
    await product.save({ validateBeforeSave: false });
    testProductId = product._id.toString();

    const order = new Order({
      distributor: distributorId,
      product: testProductId,
      quantity: 10,
      totalPrice: 1000,
      deliveryAddress: { addressLine: '123 Street', city: 'Colombo' },
      deliveryStatus: 'Delivered',
      status: 'Delivered'
    });
    await order.save({ validateBeforeSave: false });
    testOrderId = order._id.toString();

    const review = new Review({
      reviewer: distributorId,
      reviewerRole: 'Distributor',
      targetType: 'Farmer',
      targetId: farmerId,
      order: testOrderId,
      rating: 5,
      comment: 'Excellent service',
      moderationStatus: 'Approved',
      isPublished: true
    });
    await review.save({ validateBeforeSave: false });
    testReviewId = review._id.toString();
  });

  describe('POST /api/reviews (Create Review)', () => {
    it('should successfully create a new review for a delivered order', async () => {
      // Create a unique order for this specific test to avoid duplicate key error
      const newOrder = await Order.create({
        distributor: distributorId,
        product: testProductId,
        quantity: 5,
        totalPrice: 500,
        deliveryAddress: { addressLine: '456 Lane', city: 'Kandy' },
        deliveryStatus: 'Delivered',
        status: 'Delivered'
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('x-mock-user-id', distributorId)
        .set('x-mock-user-role', 'Distributor')
        .send({
          targetType: 'Farmer',
          targetId: farmerId,
          orderId: newOrder._id.toString(),
          rating: 4,
          comment: 'Very good'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/reviews/target/:targetType/:targetId', () => {
    it('should fetch all approved reviews for a specific farmer', async () => {
      const res = await request(app)
        .get(`/api/reviews/target/Farmer/${farmerId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.reviews.length).toBe(1);
    });
  });

  describe('PATCH /api/reviews/admin/:reviewId/moderate', () => {
    it('should allow Admin to approve a review and trigger aggregate update', async () => {
      // FIX: Create a brand new order so we don't hit the "one review per order" unique index limit
      const uniqueOrderForModeration = await Order.create({
        distributor: distributorId,
        product: testProductId,
        quantity: 2,
        totalPrice: 200,
        deliveryAddress: { addressLine: '789 Road', city: 'Galle' },
        deliveryStatus: 'Delivered',
        status: 'Delivered'
      });

      const pendingReview = await Review.create({
        reviewer: distributorId,
        reviewerRole: 'Distributor', 
        targetType: 'Farmer',
        targetId: farmerId,
        order: uniqueOrderForModeration._id,
        rating: 5,
        moderationStatus: 'Pending',
        isPublished: false
      });

      const res = await request(app)
        .patch(`/api/reviews/admin/${pendingReview._id}/moderate`)
        .set('x-mock-user-id', adminId)
        .set('x-mock-user-role', 'Admin')
        .send({ status: 'Approved' });

      expect(res.statusCode).toBe(200);
      expect(res.body.review.moderationStatus).toBe('Approved');
    });
  });

  describe('POST /api/reviews/:reviewId/respond', () => {
    it('should allow the Farmer to respond to a review directed at them', async () => {
      const res = await request(app)
        .post(`/api/reviews/${testReviewId}/respond`)
        .set('x-mock-user-id', farmerId)
        .set('x-mock-user-role', 'Farmer')
        .send({ responseText: 'Thank you for your feedback!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.review.response.text).toBe('Thank you for your feedback!');
    });
  });
});