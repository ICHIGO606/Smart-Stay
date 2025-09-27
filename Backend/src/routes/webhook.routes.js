import express from 'express';
import { handlePaymentWebhook } from '../controllers/webhook.controllers.js';

const router = express.Router();

// Webhook endpoint for payment notifications (no auth required)
router.post('/payment-webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

export default router;