import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  deleteUserAdmin,
  removeLogo,
  getUserLogo,
  updateLogoOnly
} from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('logo'), updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);

router.delete('/profile/logo', protect, removeLogo);
router.put('/profile/logo', protect, upload.single('logo'), updateLogoOnly);
router.get('/:id/logo', getUserLogo);

router.delete('/:id', protect, authorizeRoles('Admin'), deleteUserAdmin);




export default router;