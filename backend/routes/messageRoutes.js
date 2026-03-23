import express from 'express';
import {
  sendMessage,
  getConversation,
  getChatUsers,
  getConversationList,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/users/list', getChatUsers);
router.get('/conversations/list', getConversationList);
router.get('/:userId', getConversation);
router.post('/', sendMessage);

export default router;