import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getProductReviews, createReview, deleteReview } from '../controllers/review.controller.js';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', createReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;
