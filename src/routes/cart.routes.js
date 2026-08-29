import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartCount, syncCart,
} from '../controllers/cart.controller.js';

const router = Router();

router.use(protect); // All cart routes require auth

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/sync', syncCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);
router.get('/count', getCartCount);

export default router;
