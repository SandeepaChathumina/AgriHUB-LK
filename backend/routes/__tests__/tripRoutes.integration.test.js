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
import tripRoutes from '../tripRoutes.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Vehicle from '../../models/Vehicle.js';
import Trip from '../../models/Trip.js';
import Product from '../../models/Product.js';
import Transporter from '../../models/Transporter.js';
import Farmer from '../../models/Farmer.js';
import Distributor from '../../models/Distributor.js';

const app = express();
app.use(express.json());
app.use('/api/trips', tripRoutes);

describe('Trip Routes Integration Tests', () => {
  let mongoServer;
  let transporterId;
  let distributorId;
  let testOrderId;
  let testVehicleId;
  let testTripId;
  let testProductId;
  let validVehicleType;
  let validCategory;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Auto-detect valid Enums for Vehicle
    validVehicleType = Vehicle.schema.path('vehicleType').options.enum ? Vehicle.schema.path('vehicleType').options.enum[0] : 'Van';
    validCategory = Vehicle.schema.path('category').options.enum ? Vehicle.schema.path('category').options.enum[0] : 'Light';

    User.schema.set('strict', false);
    Product.schema.set('strict', false);
    
    await Product.createIndexes();
    await User.createIndexes();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Vehicle.deleteMany({}),
      Trip.deleteMany({})
    ]);

    // 1. Create Farmer
    const farmer = await Farmer.create({
      fullName: 'Farmer John',
      role: 'Farmer',
      email: 'f@test.com',
      phone: '0771112223',
      password: 'password123',
      nicNumber: '199012345678',
      farmSize: 5
    });

    // 2. Create Product
    const product = await Product.create({
      farmer: farmer._id,
      productName: 'Veggies',
      category: 'Vegetables',
      price: 150,
      unit: 'kg',
      quantity: 100,
      pickupLocation: {
        address: 'Farmer Road',
        city: 'Colombo',
        district: 'Colombo',
        coordinates: { 
            lat: 6.9271,
            lng: 79.8612
        }
      }
    });
    testProductId = product._id.toString();

    // 3. Create Transporter
    const transporter = await Transporter.create({
      fullName: 'Transporter Pro',
      role: 'Transporter',
      email: 't@test.com',
      phone: '0773334445',
      password: 'password123',
      businessRegNumber: 'BR-T-999',
      companyName: 'AgriTrans',
      isVerified: true,
      location: {
        city: 'Colombo',
        district: 'Colombo',
        coordinates: { lat: 6.9271, lng: 79.8612 }
      }
    });
    transporterId = transporter._id.toString();

    // 4. Create Distributor
    const distributor = await Distributor.create({
      fullName: 'Distributor Dave',
      role: 'Distributor',
      email: 'd@test.com',
      phone: '0775556667',
      password: 'password123',
      businessRegNumber: 'BR-D-888',
      businessName: 'DaveDistro'
    });
    distributorId = distributor._id.toString();

    // 5. Create Vehicle
    const vehicle = await Vehicle.create({
      transporter: transporterId,
      registrationNumber: 'CAD-1234',
      vehicleType: validVehicleType,
      brand: 'Toyota',
      model: 'Dyna',
      category: validCategory,
      loadCapacity: { weight: { value: 2000, unit: 'kg' } },
      status: 'Available',
      fuelType: 'Diesel'
    });
    testVehicleId = vehicle._id.toString();

    // 6. Create Order
    const order = await Order.create({
      distributor: distributorId,
      product: testProductId,
      status: 'Confirmed',
      deliveryStatus: 'Requested',
      totalPrice: 5000,
      quantity: 10,
      deliveryAddress: {
        addressLine: 'Main St',
        city: 'Colombo',
        district: 'Colombo',
        coordinates: { lat: 6.9275, lng: 79.8615 }
      }
    });
    testOrderId = order._id.toString();

    // 7. Create Initial Trip
    const trip = new Trip({
      order: testOrderId,
      transporter: transporterId,
      vehicle: testVehicleId,
      tripStatus: 'Pending',
      pickupLocation: { address: 'Farm', city: 'Colombo' },
      dropoffLocation: { address: 'Market', city: 'Colombo' },
      costs: { baseFare: 1000, totalCost: 1000 },
      proposedBy: transporterId,
      createdBy: transporterId,
      schedule: { scheduledPickup: new Date(), estimatedDelivery: new Date() }
    });
    
    if (Trip.prototype.addTimelineEvent) Trip.prototype.addTimelineEvent = jest.fn();
    await trip.save({ validateBeforeSave: false });
    testTripId = trip._id.toString();
  });

  describe('POST /api/trips (Create Trip)', () => {
    it('should successfully create a trip and update vehicle status', async () => {
      const freshVehicle = await Vehicle.create({
        transporter: transporterId, 
        registrationNumber: 'NEW-999', 
        status: 'Available', 
        vehicleType: validVehicleType, 
        brand: 'Toyota', 
        model: 'Hilux', 
        category: validCategory,
        loadCapacity: { weight: { value: 1000, unit: 'kg' } },
        fuelType: 'Diesel'
      });

      const freshOrder = await Order.create({
        distributor: distributorId, 
        product: testProductId, 
        status: 'Confirmed', 
        deliveryStatus: 'Requested',
        deliveryAddress: { 
          addressLine: '99 Test Road', // FIXED: Path was required
          city: 'Colombo', 
          district: 'Colombo', // Added for safety
          coordinates: { lat: 6.92, lng: 79.86 } 
        },
        totalPrice: 500, 
        quantity: 2
      });

      const res = await request(app)
        .post('/api/trips')
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter')
        .send({
          orderId: freshOrder._id.toString(),
          vehicleId: freshVehicle._id.toString(),
          scheduledPickup: new Date(Date.now() + 3600000).toISOString(),
          estimatedDelivery: new Date(Date.now() + 7200000).toISOString(),
          baseFare: 2500,
          distance: 5,
          duration: 20,
          pickupLocation: { address: 'Farm A', city: 'Colombo' },
          dropoffLocation: { address: 'Market B', city: 'Colombo' },
          proposedBy: transporterId
        });

      expect(res.statusCode).toBe(201);
      const dbVehicle = await Vehicle.findById(freshVehicle._id);
      expect(dbVehicle.status).toBe('On Delivery');
    });
  });

  describe('GET /api/trips/available-orders', () => {
    it('should allow Transporters to see orders waiting for transport', async () => {
      const res = await request(app)
        .get('/api/trips/available-orders')
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/trips/:id/status', () => {
    it('should allow completing a trip and marking the order as Delivered', async () => {
      const res = await request(app)
        .patch(`/api/trips/${testTripId}/status`)
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter')
        .send({ status: 'Completed' });

      expect(res.statusCode).toBe(200);
      const dbOrder = await Order.findById(testOrderId);
      expect(dbOrder.deliveryStatus).toBe('Delivered');
    });
  });

  describe('GET /api/trips/stats', () => {
    it('should return trip statistics for the transporter', async () => {
      const res = await request(app)
        .get('/api/trips/stats')
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter');

      expect(res.statusCode).toBe(200);
      expect(res.body.stats).toHaveProperty('totalTrips');
    });
  });
});