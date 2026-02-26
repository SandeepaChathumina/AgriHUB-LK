import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile, 
  deleteUserAdmin 
} from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// USER ROUTES (For the logged-in user)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);


// ADMIN ROUTES
// Only Admins can hit this route to delete someone else
router.delete('/:id', protect, authorizeRoles('Admin'), deleteUserAdmin);

export default router;