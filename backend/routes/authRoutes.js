import express from 'express';
// Make sure to add getAllUsers to your import list!
import { register, login, getAllUsers,testEmail,verifyEmail,requestVerificationOTP,forgotPassword, resetPassword } from '../controllers/authController.js';

import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);



// POST /api/auth/test-email (Temporary)
router.post('/test-email', testEmail);

router.post('/verify-email', verifyEmail);

router.post('/request-otp', requestVerificationOTP);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.get('/users', protect, authorizeRoles('Admin'), getAllUsers);

export default router;