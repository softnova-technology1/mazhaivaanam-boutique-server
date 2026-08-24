import { Router } from 'express';
import {
  getProducts, getFeaturedProducts, getNewArrivals, getBestSellers,
  getPreOrders, searchProducts, getProductBySlug,
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/pre-orders', getPreOrders);
router.get('/search', searchProducts);
router.get('/:slug', getProductBySlug);

export default router;
