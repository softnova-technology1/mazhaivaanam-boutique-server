import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getWishlist, toggleWishlist, removeFromWishlist, moveToCart, syncWishlist
} from '../controllers/wishlist.controller.js';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/toggle/:productId', toggleWishlist);
router.post('/sync', syncWishlist);
router.delete('/remove/:productId', removeFromWishlist);
router.post('/move-to-cart/:productId', moveToCart);

export default router;
