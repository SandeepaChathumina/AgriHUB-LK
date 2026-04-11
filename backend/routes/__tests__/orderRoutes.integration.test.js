/* eslint-env jest */
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// 1. MOCK THE MIDDLEWARE
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
        return res.status(403).json({ success: false, message: 'Forbidden: Role not authorized' });
      }
      next();
    };
  }
}));

// 2. MOCK EXTERNAL SERVICES
jest.mock('../../controllers/paymentController.js', () => ({
  createStripeSession: jest.fn().mockResolvedValue({ 
    id: 'mock_stripe_session_123', 
    url: 'https://checkout.stripe.com/mock-url' 
  }),
  verifyStripeSession: jest.fn()
}));

jest.mock('../../utils/currencyConverter.js', () => ({
  getUSDPrice: jest.fn().mockResolvedValue(5.50)
}));

// 3. IMPORT REAL ROUTES AND MODELS
import orderRoutes from '../orderRoutes.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import * as paymentController from '../../controllers/paymentController.js';

// 4. SET UP THE TEST EXPRESS APP
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Order Routes Integration Tests', () => {
  let mongoServer;
  let farmerId;
  let distributorId;
  let testProductId;
  let testOrderId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Ensure strict mode doesn't interfere with custom test fields
    User.schema.set('strict', false);
    Product.schema.set('strict', false);
    Order.schema.set('strict', false);
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

    const farmer = new User({ fullName: 'Test Farmer', role: 'Farmer', email: 'f@test.com' });
    const distributor = new User({ fullName: 'Test Dist', role: 'Distributor', email: 'd@test.com' });
    await farmer.save({ validateBeforeSave: false });
    await distributor.save({ validateBeforeSave: false });
    
    farmerId = farmer._id.toString();
    distributorId = distributor._id.toString();

    // --- CRITICAL FIX: Added 'category' and 'unit' to match your Model Schema ---
    const product = new Product({
      farmer: farmerId,
      productName: 'Test Carrots',
      category: 'Vegetables', 
      unit: 'kg',             
      price: 100,
      quantity: 50,
      pickupLocation: { address: 'Farm 1', coordinates: { lat: 0, lng: 0 } }
    });
    await product.save({ validateBeforeSave: false });
    testProductId = product._id.toString();

    const order = new Order({
      distributor: distributorId,
      product: testProductId,
      quantity: 10,
      totalPrice: 1000,
      paymentStatus: 'paid',
      status: 'Awaiting Farmer Approval',
      deliveryAddress: { addressLine: 'City', city: 'Colombo' }
    });
    await order.save({ validateBeforeSave: false });
    testOrderId = order._id.toString();
  });

  describe('POST /api/orders (Place Order)', () => {
    it('should block Farmers from placing orders (Role Authorization)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('x-mock-user-id', farmerId)
        .set('x-mock-user-role', 'Farmer')
        .send({
          productId: testProductId,
          quantity: 5,
          deliveryAddress: { addressLine: '123 Test St', city: 'Colombo' }
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow Distributors to place orders and return a Stripe URL', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('x-mock-user-id', distributorId)
        .set('x-mock-user-role', 'Distributor')
        .send({
          productId: testProductId,
          quantity: 5,
          deliveryAddress: { addressLine: '123 Test St', city: 'Colombo' }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.checkoutUrl).toBe('https://checkout.stripe.com/mock-url');
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('should fetch paginated orders for the logged-in Distributor', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders?page=1&limit=10')
        .set('x-mock-user-id', distributorId)
        .set('x-mock-user-role', 'Distributor');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orders.length).toBe(1);
    });
  });

  describe('PATCH /api/orders/:id/farmer-accept', () => {
    it('should allow the product owner (Farmer) to accept a paid order', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrderId}/farmer-accept`)
        .set('x-mock-user-id', farmerId)
        .set('x-mock-user-role', 'Farmer');

      expect(res.statusCode).toBe(200);
      expect(res.body.order.status).toBe('Confirmed');
    });
  });

  describe('GET /api/orders/success (Stripe Redirect)', () => {
    it('should successfully verify payment, deduct stock, and redirect to frontend', async () => {
      paymentController.verifyStripeSession.mockResolvedValueOnce({
        payment_status: 'paid',
        metadata: { orderId: testOrderId }
      });

      await Order.findByIdAndUpdate(testOrderId, { paymentStatus: 'unpaid' });

      const res = await request(app)
        .get(`/api/orders/success?session_id=mock_stripe_session_123`);

      // Verify the redirect is to SUCCESS instead of error
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('payment=success');

      // Verify DB interaction: 50 original - 10 ordered = 40 remaining
      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct.quantity).toBe(40); 
    });
  });
});