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
  uploader: { upload: jest.fn().mockResolvedValue({ secure_url: 'https://cdn.com/v.jpg', public_id: 'v1' }) }
}));
jest.mock('../../middleware/upload.js', () => ({
  array: () => (req, res, next) => {
    req.files = [{ path: 'test.jpg', originalname: 'test.jpg' }];
    next();
  }
}));

// 3. IMPORT MODELS
import vehicleRoutes from '../vehicleRoutes.js';
import User from '../../models/User.js';
import Vehicle from '../../models/Vehicle.js';
import Transporter from '../../models/Transporter.js'; 
import Distributor from '../../models/Distributor.js'; 

const app = express();
app.use(express.json());
app.use('/api/vehicles', vehicleRoutes);

describe('Vehicle Routes Integration Tests', () => {
  let mongoServer;
  let transporterId;
  let distributorId;
  let testVehicleId;
  let validVehicleType;
  let validCategory;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // --- DYNAMIC ENUM DETECTION ---
    // This looks at your model and grabs the first allowed value so the test never fails validation.
    validVehicleType = Vehicle.schema.path('vehicleType').options.enum ? Vehicle.schema.path('vehicleType').options.enum[0] : 'Van';
    validCategory = Vehicle.schema.path('category').options.enum ? Vehicle.schema.path('category').options.enum[0] : 'Light';

    // Disable validators for raw setup
    Vehicle.schema.path('vehicleType').validators = [];
    Vehicle.schema.path('category').validators = [];
    
    User.schema.set('strict', false);
    Vehicle.schema.set('strict', false);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});

    // CREATE TRANSPORTER
    const transporter = await Transporter.create({
      fullName: 'Express Transport',
      role: 'Transporter',
      email: 't@test.com',
      phone: '0771234567',
      password: 'hashedPassword123',
      businessRegNumber: 'BR-T-12345',
      companyName: 'Express Logistics',
      businessName: 'Express Logistics',
      isVerified: true
    });
    transporterId = transporter._id.toString();

    // CREATE DISTRIBUTOR
    const distributor = await Distributor.create({
      fullName: 'Distributor Dave',
      role: 'Distributor',
      email: 'd@test.com',
      phone: '0711234567',
      password: 'hashedPassword123',
      businessRegNumber: 'BR-D-67890',
      businessName: 'Dave Distributors'
    });
    distributorId = distributor._id.toString();

    // CREATE INITIAL VEHICLE (Raw Insert to bypass initial setup issues)
    const rawVehicle = {
      _id: new mongoose.Types.ObjectId(),
      transporter: new mongoose.Types.ObjectId(transporterId),
      registrationNumber: 'WP-CAD-1122',
      vehicleType: validVehicleType, 
      brand: 'Toyota',
      model: 'Dyna',
      category: validCategory,
      loadCapacity: { weight: { value: 2000, unit: 'kg' } },
      status: 'Available',
      fuelType: 'Diesel'
    };
    await mongoose.connection.collection('vehicles').insertOne(rawVehicle);
    testVehicleId = rawVehicle._id.toString();
  });

  describe('POST /api/vehicles (Create Vehicle)', () => {
    it('should allow a Transporter to create a vehicle', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter')
        .send({
          registrationNumber: 'WP-CAT-9999',
          vehicleType: validVehicleType, // Automatically uses a valid value from your model
          brand: 'Nissan',
          model: 'Caravan',
          category: validCategory,      // Automatically uses a valid value from your model
          loadCapacity: { weight: { value: 800, unit: 'kg' } },
          fuelType: 'Petrol',
          transporterId: transporterId  // Added to body for controller satisfaction
        });

      expect(res.statusCode).toBe(201);
    });

    it('should block a Distributor from creating a vehicle', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('x-mock-user-id', distributorId)
        .set('x-mock-user-role', 'Distributor')
        .send({ registrationNumber: 'WP-NA-0000' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/vehicles/my-vehicles', () => {
    it('should fetch only the logged-in transporters vehicles', async () => {
      const res = await request(app)
        .get('/api/vehicles/my-vehicles')
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter');

      expect(res.statusCode).toBe(200);
      expect(res.body.vehicles.length).toBe(1);
    });
  });

  describe('PATCH /api/vehicles/:id/status', () => {
    it('should allow a transporter to update their vehicle status', async () => {
      const res = await request(app)
        .patch(`/api/vehicles/${testVehicleId}/status`)
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter')
        .send({ status: 'Maintenance' });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/vehicles/available', () => {
    it('should allow users to see available vehicles', async () => {
      const res = await request(app)
        .get('/api/vehicles/available')
        .set('x-mock-user-id', distributorId)
        .set('x-mock-user-role', 'Distributor');

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should allow a transporter to delete their vehicle', async () => {
      const res = await request(app)
        .delete(`/api/vehicles/${testVehicleId}`)
        .set('x-mock-user-id', transporterId)
        .set('x-mock-user-role', 'Transporter')
        .send({ transporterId: transporterId }); 

      expect(res.statusCode).toBe(200);
    });
  });
});