import { Hono } from 'hono';
import { UserControllerClass } from '../controller/user.controller.js';
import { MessageControllerClass } from '../controller/message.controller.js';
import { OrchestratorControllerClass } from '../controller/orchestrator.controller.js';
import { SubscriptionControllerClass } from '../controller/subscription.controller.js';
import { MemoryControllerClass } from '../controller/memory.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rateLimitMiddleware, heavyRateLimitMiddleware } from '../middleware/ratelimit.middleware.js';

const api = new Hono();

const userController = new UserControllerClass();
const messageController = new MessageControllerClass();
const orchestratorController = new OrchestratorControllerClass();
const subscriptionController = new SubscriptionControllerClass();
const memoryController = new MemoryControllerClass();

api.post('/auth/login', userController.login);
api.get('/user', authMiddleware, rateLimitMiddleware, userController.getUser);
api.put('/user', authMiddleware, rateLimitMiddleware, userController.updateUser);
api.get('/subscription', authMiddleware, rateLimitMiddleware, subscriptionController.getSubscription);
api.post('/completion', authMiddleware, heavyRateLimitMiddleware, orchestratorController.processAudio);
api.get('/messages', authMiddleware, rateLimitMiddleware, messageController.getMessages);
api.get('/memory', authMiddleware, rateLimitMiddleware, memoryController.getMemories);
api.post('/memory', authMiddleware, rateLimitMiddleware, memoryController.addMemory);
api.delete('/memory', authMiddleware, rateLimitMiddleware, memoryController.deleteMemory);

export default api;
