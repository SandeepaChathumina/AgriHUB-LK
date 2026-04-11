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
        role: req.headers['x-mock-user-role'] || 'Farmer'
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Not authorized' });
  })
}));

// 2. MOCK THE CRYPTO UTILS
jest.mock('../../utils/messageCrypto.js', () => ({
  encryptMessage: jest.fn(text => `encrypted_${text}`),
  decryptMessage: jest.fn(text => text ? text.replace('encrypted_', '') : '')
}));

// 3. IMPORT REAL ROUTES AND MODELS
import messageRoutes from '../messageRoutes.js';
import User from '../../models/User.js';
import Message from '../../models/Message.js';

// 4. SET UP THE TEST EXPRESS APP
const app = express();
app.use(express.json());

// Inject a mock Socket.io instance
app.use((req, res, next) => {
  req.io = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  };
  next();
});

app.use('/api/messages', messageRoutes);

describe('Message Routes Integration Tests', () => {
  let mongoServer;
  let user1Id;
  let user2Id;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // CRITICAL FIX: Turn off strict mode for the User model during testing.
    // This prevents Mongoose from silently dropping the 'role' field if 
    // the schema expects a different format or if it uses discriminators.
    User.schema.set('strict', false);
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

    // CRITICAL FIX: Use individual saves with `validateBeforeSave: false`
    // to bypass any missing required fields (like addresses or NICs) that 
    // would normally block test users from saving.
    const user1 = new User({
      fullName: 'Farmer John',
      email: 'farmer@test.com',
      password: 'hashedpassword123',
      role: 'Farmer',
      phone: '0711111111'
    });
    
    const user2 = new User({
      fullName: 'Distributor Bob',
      email: 'distributor@test.com',
      password: 'hashedpassword123',
      role: 'Distributor',
      phone: '0722222222'
    });

    await user1.save({ validateBeforeSave: false });
    await user2.save({ validateBeforeSave: false });

    user1Id = user1._id.toString();
    user2Id = user2._id.toString();
  });

  describe('POST /api/messages', () => {
    it('should block unauthorized requests missing the protect token', async () => {
      const res = await request(app).post('/api/messages').send({});
      
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Not authorized');
    });

    it('should successfully hit the route, reach the controller, and save to the real DB', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('x-mock-user-id', user1Id)
        .set('x-mock-user-role', 'Farmer')
        .send({
          receiverId: user2Id,
          content: 'Hello from Farmer to Distributor!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      const savedMessage = await Message.findOne({ sender: user1Id });
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.content).toBe('encrypted_Hello from Farmer to Distributor!');
    });
  });

  describe('GET /api/messages/users/list', () => {
    it('should query the DB and return allowed chat partners', async () => {
      const res = await request(app)
        .get('/api/messages/users/list')
        .set('x-mock-user-id', user1Id)
        .set('x-mock-user-role', 'Farmer');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1); 
      expect(res.body.data[0].role).toBe('Distributor');
    });
  });

  describe('GET /api/messages/:userId', () => {
    it('should fetch and decrypt the conversation history', async () => {
      await Message.create({
        sender: user1Id,
        receiver: user2Id,
        content: 'encrypted_Secret API Test',
        isRead: false
      });

      const res = await request(app)
        .get(`/api/messages/${user2Id}`)
        .set('x-mock-user-id', user1Id)
        .set('x-mock-user-role', 'Farmer');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].content).toBe('Secret API Test'); 
    });
  });
});