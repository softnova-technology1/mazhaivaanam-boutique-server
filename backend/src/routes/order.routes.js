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

// Order tracking & Coupon validation — public / customer
router.get('/tracking/:orderId', trackOrder);
router.get('/track/:orderId', trackOrder);
router.post('/validate-coupon', validateCoupon);

// Protected routes
router.post('/', protect, validate(createOrderValidator), createOrder);
router.get('/', protect, getUserOrders);
router.get('/:orderId', protect, getOrderById);
router.post('/:orderId/cancel', protect, cancelOrder);

// Payment verification
router.post('/payments/verify', protect, verifyPayment);

export default router;
