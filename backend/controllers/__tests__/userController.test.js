// controllers/__tests__/userController.test.js
import { 
  getUserProfile, 
  deleteUserProfile, 
  deleteUserAdmin, 
  getAllTransporterLogos 
} from '../userController.js';
import User from '../../models/User.js';
import httpMocks from 'node-mocks-http';

// Mock the Mongoose User model
jest.mock('../../models/User.js');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = httpMocks.createResponse();
  });

  describe('1. getUserProfile', () => {
    it('should return the logged-in user profile without the password', async () => {
      // Arrange: Fake request with a logged-in user ID
      req = httpMocks.createRequest({
        user: { _id: 'user123' }
      });

      const mockUser = { _id: 'user123', fullName: 'John Farmer', role: 'Farmer' };

      // Mock User.findById().select() chain
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await getUserProfile(req, res);
      const responseData = res._getJSONData();

      // Assert
      expect(res.statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.user.fullName).toBe('John Farmer');
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('should return 404 if the user is not found in the database', async () => {
      req = httpMocks.createRequest({ user: { _id: 'ghostUser' } });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null) // Simulate missing user
      });

      await getUserProfile(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(404);
      expect(responseData.message).toBe('User not found');
    });
  });

  describe('2. deleteUserProfile (Self-Delete)', () => {
    it('should delete the logged-in user successfully', async () => {
      req = httpMocks.createRequest({ user: { _id: 'user123' } });

      const mockDeleteOne = jest.fn().mockResolvedValue(true);
      const mockUser = { _id: 'user123', deleteOne: mockDeleteOne };

      User.findById.mockResolvedValue(mockUser);

      await deleteUserProfile(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(200);
      expect(responseData.message).toBe('Your account has been deleted successfully.');
      expect(mockDeleteOne).toHaveBeenCalledTimes(1); // Proves the delete function ran
    });
  });

  describe('3. deleteUserAdmin', () => {
    it('should allow an Admin to delete another user', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'admin999' }, // The admin making the request
        params: { id: 'user123' }  // The user being deleted
      });

      const mockDeleteOne = jest.fn().mockResolvedValue(true);
      const mockTargetUser = { 
        _id: 'user123', 
        fullName: 'Target User',
        deleteOne: mockDeleteOne,
        toString: () => 'user123' // Mocking JS string conversion for the ID check
      };

      User.findById.mockResolvedValue(mockTargetUser);

      await deleteUserAdmin(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(200);
      expect(responseData.message).toBe('User Target User has been removed by Admin.');
      expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    });

    it('should block an Admin from deleting themselves and return 400', async () => {
      // Both IDs are exactly the same
      req = httpMocks.createRequest({
        user: { _id: 'admin999' }, 
        params: { id: 'admin999' }
      });

      const mockTargetUser = { 
        _id: 'admin999', 
        toString: () => 'admin999' 
      };

      User.findById.mockResolvedValue(mockTargetUser);

      await deleteUserAdmin(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(400);
      expect(responseData.message).toBe('You cannot delete your own admin account from here.');
    });
  });

  describe('4. getAllTransporterLogos', () => {
    it('should return transporters and filter out those with empty logos', async () => {
      req = httpMocks.createRequest();

      const mockTransporters = [
        { _id: '1', companyName: 'Fast Move', logo: { url: 'http://img.com/1.png' } },
        { _id: '2', companyName: 'Hidden Truck', logo: { url: '   ' } }, // Empty/whitespace URL
        { _id: '3', companyName: 'No Logo Corp', logo: null } // No logo object at all
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockTransporters)
      });

      await getAllTransporterLogos(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(200);
      expect(responseData.count).toBe(1); // Only 'Fast Move' should survive the filter
      expect(responseData.data[0].name).toBe('Fast Move');
    });
  });
});