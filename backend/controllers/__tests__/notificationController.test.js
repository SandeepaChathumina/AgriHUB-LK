// controllers/__tests__/notificationController.test.js
import {
  getUsersForNotification,
  sendNotification,
  getMyNotifications,
  markAsRead,
  getAllNotificationsAdmin,
  updateNotificationAdmin,
  deleteNotificationAdmin
} from '../notificationController.js';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import httpMocks from 'node-mocks-http';

// Mock BOTH models so we never hit the database
jest.mock('../../models/Notification.js');
jest.mock('../../models/User.js');

describe('Notification Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = httpMocks.createResponse();
  });

  describe('1. sendNotification', () => {
    it('should successfully send a Single notification', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'admin123' },
        body: {
          targetType: 'Single',
          userId: 'user1',
          title: 'Welcome',
          message: 'Hello'
        }
      });

      // Mock the save function for the "new Notification()" instance
      const mockSave = jest.fn().mockResolvedValue(true);
      Notification.mockImplementation(() => ({ save: mockSave }));

      await sendNotification(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(201);
      expect(responseData.message).toBe('Notification sent successfully to the user!');
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should successfully send Bulk notifications using insertMany', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'admin123' },
        body: {
          targetType: 'Bulk',
          role: 'Farmer',
          title: 'Weather Update',
          message: 'Rain expected'
        }
      });

      // Mock finding the target users
      const mockUsers = [{ _id: 'farmer1' }, { _id: 'farmer2' }];
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      // Mock the bulk insertion
      Notification.insertMany.mockResolvedValue(true);

      await sendNotification(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(201);
      expect(responseData.message).toBe('Bulk notification sent successfully to 2 users!');
      expect(Notification.insertMany).toHaveBeenCalledTimes(1);
      // Verify the payload being inserted matches the number of users
      expect(Notification.insertMany.mock.calls[0][0].length).toBe(2); 
    });

    it('should return 400 if targetType is invalid', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'admin123' },
        body: { targetType: 'Magic' } // Invalid type
      });

      await sendNotification(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Invalid targetType. Must be Single or Bulk.');
    });
  });

  describe('2. markAsRead', () => {
    it('should mark a notification as read for the correct user', async () => {
      req = httpMocks.createRequest({
        user: { _id: 'user1' },
        params: { id: 'notif123' }
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockNotif = { _id: 'notif123', recipient: 'user1', isRead: false, save: mockSave };

      Notification.findOne.mockResolvedValue(mockNotif);

      await markAsRead(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(200);
      expect(mockNotif.isRead).toBe(true); // Verifying the state change
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if notification belongs to someone else or does not exist', async () => {
      req = httpMocks.createRequest({ user: { _id: 'user1' }, params: { id: 'notif123' } });
      
      Notification.findOne.mockResolvedValue(null); // Simulate not found

      await markAsRead(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().message).toBe('Notification not found or unauthorized');
    });
  });

  describe('3. updateNotificationAdmin (Business Logic Test)', () => {
    it('should block the update if the notification is already read', async () => {
      req = httpMocks.createRequest({
        params: { id: 'notif123' },
        body: { title: 'New Title' }
      });

      // Create a mock notification that is ALREADY READ
      const mockNotif = { _id: 'notif123', isRead: true };
      Notification.findById.mockResolvedValue(mockNotif);

      await updateNotificationAdmin(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(400); // Expecting the security check to fire
      expect(responseData.message).toBe('Cannot update this notification because the user has already read it.');
    });

    it('should update successfully if the notification is unread', async () => {
      req = httpMocks.createRequest({
        params: { id: 'notif123' },
        body: { title: 'Updated Title', message: 'Updated Message' }
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockNotif = { 
        _id: 'notif123', 
        isRead: false, 
        title: 'Old Title', 
        message: 'Old Message',
        save: mockSave 
      };
      
      Notification.findById.mockResolvedValue(mockNotif);

      await updateNotificationAdmin(req, res);
      
      expect(res.statusCode).toBe(200);
      expect(mockNotif.title).toBe('Updated Title');
      expect(mockNotif.message).toBe('Updated Message');
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. deleteNotificationAdmin', () => {
    it('should delete a notification', async () => {
      req = httpMocks.createRequest({ params: { id: 'notif123' } });

      const mockDeleteOne = jest.fn().mockResolvedValue(true);
      Notification.findById.mockResolvedValue({ _id: 'notif123', deleteOne: mockDeleteOne });

      await deleteNotificationAdmin(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. getMyNotifications (Chaining test)', () => {
    it('should fetch, sort, and populate user notifications', async () => {
      req = httpMocks.createRequest({ user: { _id: 'user1' } });

      const mockNotifications = [{ title: 'Test 1' }, { title: 'Test 2' }];

      // Mocking the Mongoose chain: find().sort().populate()
      const mockPopulate = jest.fn().mockResolvedValue(mockNotifications);
      const mockSort = jest.fn().mockReturnValue({ populate: mockPopulate });
      Notification.find.mockReturnValue({ sort: mockSort });

      await getMyNotifications(req, res);
      const responseData = res._getJSONData();

      expect(res.statusCode).toBe(200);
      expect(responseData.count).toBe(2);
      expect(Notification.find).toHaveBeenCalledWith({ recipient: 'user1' });
    });
  });
});