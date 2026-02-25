import express from 'express';
import { 
  getUsersForNotification, 
  sendNotification, 
  getMyNotifications, 
  markAsRead 
} from '../controllers/notificationController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ADMIN ROUTES (Strictly Protected)

// GET /api/notifications/admin/users?role=Farmer&status=Unverified
// Admin fetching the filtered list of users to see who they are messaging
router.get('/admin/users', protect, authorizeRoles('Admin'), getUsersForNotification);

// POST /api/notifications/admin/send
// Admin sending a notification (Single or Bulk)
router.post('/admin/send', protect, authorizeRoles('Admin'), sendNotification);


// USER ROUTES (For everyone who is logged in)

// GET /api/notifications/my-notifications
// A user fetching their own personal inbox
router.get('/my-notifications', protect, getMyNotifications);

// PUT /api/notifications/:id/read
// A user clicking a notification to mark it as read
router.put('/:id/read', protect, markAsRead);

export default router;