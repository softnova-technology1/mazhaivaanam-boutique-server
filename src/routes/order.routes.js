import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createOrderValidator, shippingEstimateValidator } from '../validators/order.validator.js';
import {
  createOrder, verifyPayment, getUserOrders,
  getOrderById, trackOrder, estimateShipping,
} from '../controllers/order.controller.js';
import { validateCoupon } from '../controllers/coupon.controller.js';

const router = Router();

// Static / specific routes FIRST (before any dynamic /:param routes)
router.get('/tracking/:orderId', trackOrder);
router.get('/track/:orderId', trackOrder);
router.post('/validate-coupon', validateCoupon);
router.post('/shipping-estimate', validate(shippingEstimateValidator), estimateShipping); // public — zone-wise fee preview
router.post('/payments/verify', optionalAuth, verifyPayment); // ← public/optionalAuth: verify payment for guest or user

// Order creation (supports both logged-in users & guest checkout)
router.post('/', optionalAuth, validate(createOrderValidator), createOrder);

// User-specific protected routes
router.get('/', protect, getUserOrders);
router.get('/:orderId', optionalAuth, getOrderById);        // ← dynamic: must be last

export default router;
