// routes/__tests__/userRoutes.integration.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {app} from '../../app.js'; 
import User from '../../models/User.js';

let mongoServer;

// --- DATABASE SETUP & TEARDOWN ---
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoServer.getUri());
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// --- HELPER FUNCTION ---
// We need a valid token for tests 2, 3, and 4. This helper registers a fresh user and logs them in.
const setupUserAndGetToken = async () => {
  const userData = {
    fullName: 'Profile Tester',
    email: 'profile@test.com',
    password: 'Password123!',
    phone: '0701234567',
    role: 'Farmer',
    farmSize: 5,
    nicNumber: '123456789V'
  };

  // 1. Register the user
  await request(app).post('/api/auth/register').send(userData);
  
  // 2. Login to get the JWT token
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'profile@test.com',
    password: 'Password123!'
  });

  return loginRes.body.token; // Return the token for the tests to use
};

// --- INTEGRATION TESTS ---
describe('User Routes Integration (Protected Routes)', () => {

  it('1. should return 401 Unauthorized if no token is provided', async () => {
    // ACT: Try to access the protected profile route WITHOUT a token
    const response = await request(app).get('/api/users/profile');

    // ASSERT: Ensure the security middleware blocks the request
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Not authorized/i);
  });

  it('2. should get the user profile with a valid token', async () => {
    // ARRANGE: Get a valid token
    const token = await setupUserAndGetToken();

    // ACT: Send the GET request WITH the token in the headers
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`); // This is how you send a token in Postman/Supertest

    // ASSERT: Ensure it returns 200 OK and the correct data (but hides the password)
    expect(response.status).toBe(200);
    expect(response.body.user.fullName).toBe('Profile Tester');
    expect(response.body.user.email).toBe('profile@test.com');
    expect(response.body.user.password).toBeUndefined(); // Security check!
  });

  it('3. should update the user profile successfully', async () => {
    const token = await setupUserAndGetToken();

    // ACT: Send a PUT request to update the name and phone
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Updated Name Tester',
        phone: '0799999999'
      });

    // ASSERT: Check the API response
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('updated successfully');

    // ASSERT: Double-check the actual database to prove it saved
    const updatedUser = await User.findOne({ email: 'profile@test.com' });
    expect(updatedUser.fullName).toBe('Updated Name Tester');
    expect(updatedUser.phone).toBe('0799999999');
  });

  it('4. should delete the user account', async () => {
    const token = await setupUserAndGetToken();

    // Verify user exists before deleting
    const userBefore = await User.findOne({ email: 'profile@test.com' });
    expect(userBefore).toBeTruthy();

    // ACT: Send a DELETE request
    const response = await request(app)
      .delete('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    // ASSERT: Check the API response
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('deleted');

    // ASSERT: Check the database to prove the user is completely gone
    const userAfter = await User.findOne({ email: 'profile@test.com' });
    expect(userAfter).toBeNull();
  });

});