import express from 'express';
import { askSystemAssistant } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Any logged-in user can ask the AI Assistant a question
// POST /api/chat/ask
router.post('/ask', askSystemAssistant);

export default router;