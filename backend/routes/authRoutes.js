import express from 'express';
// Make sure to add getAllUsers to your import list!
import { register, login, getAllUsers,testEmail,verifyEmail } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/users (Test endpoint to view all registered users)
router.get('/users', getAllUsers);

// POST /api/auth/test-email (Temporary)
router.post('/test-email', testEmail);

router.post('/verify-email', verifyEmail);

export default router;