import express from 'express';
import { handlePaymentWebhook } from '../controllers/webhook.controllers.js';
import { apiLimiter, strictLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();
router.use(apiLimiter);
router.post('/payment-webhook',strictLimiter, express.raw({ type: 'application/json' }), handlePaymentWebhook);

export default router;