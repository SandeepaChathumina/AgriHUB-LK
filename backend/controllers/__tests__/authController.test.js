// controllers/__tests__/authController.test.js
import { verifyEmail } from '../authController.js';
import User from '../../models/User.js';
import httpMocks from 'node-mocks-http';

// Mock the User model so we don't connect to the real database
jest.mock('../../models/User.js');

describe('Auth Controller - verifyEmail', () => {
  let req, res;

  // This runs before every single test to reset our environment
  beforeEach(() => {
    jest.clearAllMocks();
    req = httpMocks.createRequest({
      method: 'POST',
      body: {
        email: 'test@example.com',
        otp: '123456'
      }
    });
    res = httpMocks.createResponse();
  });

  it('1. should verify the email successfully with valid OTP', async () => {
    // Create a fake user object with a save function we can track
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockUser = {
      email: 'test@example.com',
      isVerified: false,
      otp: '123456',
      otpExpires: Date.now() + 10000, // Expires in the future
      save: mockSave
    };

    // Make User.findOne return our mock user
    User.findOne.mockResolvedValue(mockUser);

    await verifyEmail(req, res);

    const responseData = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(responseData.message).toBe('Email verified successfully! You can now log in.');
    
    // Prove that the user data was updated correctly in memory
    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.otp).toBeUndefined();
    expect(mockUser.otpExpires).toBeUndefined();
    
    // Prove that the save() method was actually called
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('2. should return 404 if the user is not found', async () => {
    User.findOne.mockResolvedValue(null); // Simulate user not existing

    await verifyEmail(req, res);

    const responseData = res._getJSONData();

    expect(res.statusCode).toBe(404);
    expect(responseData.message).toBe('User not found');
  });

  it('3. should return 400 if the user is already verified', async () => {
    const mockUser = {
      email: 'test@example.com',
      isVerified: true // Already verified!
    };
    User.findOne.mockResolvedValue(mockUser);

    await verifyEmail(req, res);

    const responseData = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(responseData.message).toBe('User is already verified');
  });

  it('4. should return 400 if the OTP is invalid', async () => {
    const mockUser = {
      email: 'test@example.com',
      isVerified: false,
      otp: '999999' // Database has '999999', but req.body has '123456'
    };
    User.findOne.mockResolvedValue(mockUser);

    await verifyEmail(req, res);

    const responseData = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(responseData.message).toBe('Invalid OTP code');
  });

  it('5. should return 400 if the OTP has expired', async () => {
    const mockUser = {
      email: 'test@example.com',
      isVerified: false,
      otp: '123456',
      otpExpires: Date.now() - 10000 // Expired 10 seconds ago
    };
    User.findOne.mockResolvedValue(mockUser);

    await verifyEmail(req, res);

    const responseData = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(responseData.message).toBe('OTP has expired. Please request a new one.');
  });

  it('6. should handle database/server errors gracefully', async () => {
    // Force the database mock to throw an error
    User.findOne.mockRejectedValue(new Error('Database crashed'));

    await verifyEmail(req, res);

    const responseData = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(responseData.message).toBe('Server error');
    expect(responseData.error).toBe('Database crashed');
  });
});