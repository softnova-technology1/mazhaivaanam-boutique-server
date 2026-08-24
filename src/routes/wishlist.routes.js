import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getWishlist, toggleWishlist, removeFromWishlist, moveToCart,
} from '../controllers/wishlist.controller.js';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/toggle/:productId', toggleWishlist);
router.delete('/remove/:productId', removeFromWishlist);
router.post('/move-to-cart/:productId', moveToCart);

export default router;
