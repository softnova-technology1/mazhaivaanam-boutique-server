import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createOrderValidator } from '../validators/order.validator.js';
import {
  createOrder, verifyPayment, getUserOrders,
  getOrderById, cancelOrder, trackOrder,
} from '../controllers/order.controller.js';
import { validateCoupon } from '../controllers/coupon.controller.js';

const router = Router();

// Static / specific routes FIRST (before any dynamic /:param routes)
router.get('/tracking/:orderId', trackOrder);
router.get('/track/:orderId', trackOrder);
router.post('/validate-coupon', validateCoupon);
router.post('/payments/verify', protect, verifyPayment); // ← MOVED UP: must be before /:orderId

// Protected routes (dynamic routes last)
router.post('/', protect, validate(createOrderValidator), createOrder);
router.get('/', protect, getUserOrders);
router.get('/:orderId', protect, getOrderById);        // ← dynamic: must be last
router.post('/:orderId/cancel', protect, cancelOrder);

export default router;
