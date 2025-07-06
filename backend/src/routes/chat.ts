import { Router } from 'express';
import { chatController } from '@/controllers/ChatController';
import { rateLimiter } from '@/middleware/rateLimiter';
import { validateRequest } from '@/middleware/validation';

const router = Router();

// Apply rate limiting to all chat routes
router.use(rateLimiter);

// POST /api/v1/chat - Send a message and get AI response
router.post('/', chatController.sendMessage.bind(chatController));

// GET /api/v1/chat/history - Get chat history
router.get('/history', chatController.getChatHistory.bind(chatController));

// DELETE /api/v1/chat/history/:sessionId - Clear specific session history
router.delete('/history/:sessionId', chatController.clearChatHistory.bind(chatController));

// GET /api/v1/chat/sessions - Get all chat sessions
router.get('/sessions', chatController.getSessions.bind(chatController));

export default router;