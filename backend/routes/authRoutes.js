import express from 'express';
import {
  register,
  login,
  getAllUsers,
  deleteUser,
  testEmail,
  verifyEmail,
  requestVerificationOTP,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', upload.single('logo'), register);
router.post('/login', login);
router.post('/test-email', testEmail);
router.post('/verify-email', verifyEmail);
router.post('/request-otp', requestVerificationOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/users', protect, authorizeRoles('Admin'), getAllUsers);
router.delete('/users/:id', protect, authorizeRoles('Admin'), deleteUser);

export default router;