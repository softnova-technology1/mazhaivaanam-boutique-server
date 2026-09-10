import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

// Razorpay webhook endpoint
router.post('/razorpay', handleRazorpayWebhook);

export default router;
