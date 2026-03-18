import { Hono } from 'hono';
import { UserControllerClass } from '../controller/user.controller.js';
import { MessageControllerClass } from '../controller/message.controller.js';
import { OrchestratorControllerClass } from '../controller/orchestrator.controller.js';
import { SubscriptionControllerClass } from '../controller/subscription.controller.js';
import { MemoryControllerClass } from '../controller/memory.controller.js';
import { BillingControllerClass } from '../controller/billing.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rateLimitMiddleware, heavyRateLimitMiddleware } from '../middleware/ratelimit.middleware.js';

const api = new Hono();

const userController = new UserControllerClass();
const messageController = new MessageControllerClass();
const orchestratorController = new OrchestratorControllerClass();
const subscriptionController = new SubscriptionControllerClass();
const memoryController = new MemoryControllerClass();
const billingController = new BillingControllerClass();

api.post('/auth/login', userController.login);
api.get('/user', authMiddleware, rateLimitMiddleware, userController.getUser);
api.put('/user', authMiddleware, rateLimitMiddleware, userController.updateUser);
api.get('/subscription', authMiddleware, rateLimitMiddleware, subscriptionController.getSubscription);
api.put('/subscription', authMiddleware, rateLimitMiddleware, subscriptionController.updateSubscription);
api.post('/billing/razorpay/subscription', authMiddleware, rateLimitMiddleware, billingController.createProSubscription);
api.post('/billing/razorpay/cancel', authMiddleware, rateLimitMiddleware, billingController.cancelProSubscription);
api.post('/billing/razorpay/webhook', billingController.razorpayWebhook);
api.post('/completion', authMiddleware, heavyRateLimitMiddleware, orchestratorController.processAudio);
api.get('/messages', authMiddleware, rateLimitMiddleware, messageController.getMessages);
api.get('/memory', authMiddleware, rateLimitMiddleware, memoryController.getMemories);
api.post('/memory', authMiddleware, rateLimitMiddleware, memoryController.addMemory);
api.delete('/memory', authMiddleware, rateLimitMiddleware, memoryController.deleteMemory);

export default api;
