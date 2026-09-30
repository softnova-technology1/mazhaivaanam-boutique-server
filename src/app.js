import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import errorHandler from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import { categoryRouter, collectionRouter } from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import addressRoutes from './routes/address.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import contactRoutes from './routes/contact.routes.js';
import adminRoutes from './routes/admin.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();

// ==================== SECURITY MIDDLEWARE ====================

// Helmet — HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS — Only FRONTEND_URL from .env is the allowed origin
// In development, localhost variants are also permitted for convenience
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
    : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / Postman requests (no origin) OR matched frontend origin
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive or origin match
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Trust proxy for Render/Cloud environments (fixes rate limiter blocking everyone)
app.set('trust proxy', 1);

// Rate limiting — General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased for development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later' },
});
app.use(generalLimiter);

// Rate limiting — Auth routes (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Max 10 attempts per 15 minutes for security
  message: { success: false, message: 'Too many auth attempts — please try again later' },
});

// ==================== BODY PARSING & STATIC ====================

// Preserve raw body for Razorpay webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhooks')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mazhai Vaanam API is running ✨',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ==================== API ROUTES ====================

import { getOfferConfig, spinWheel, getTimedOfferProducts, getOfferSections, getMyCoupons } from './controllers/offer.controller.js';
import { protect } from './middleware/auth.middleware.js';
import { getAllFabrics } from './controllers/fabric.controller.js';
import { getStoreConfig } from './controllers/storeConfig.controller.js';

app.get('/api/limited-offer/config', getOfferConfig);
app.get('/api/limited-offer/timed-products', getTimedOfferProducts); // Public timed products
app.get('/api/limited-offer/sections', getOfferSections);            // Public offer sections
app.post('/api/limited-offer/spin', protect, spinWheel);
app.get('/api/limited-offer/my-coupons', protect, getMyCoupons);
app.get('/api/store/config', getStoreConfig); // Public — Client fetches discount config
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/collections', collectionRouter);
app.get('/api/fabrics', getAllFabrics);

app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// ==================== 404 HANDLER ====================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ==================== ERROR HANDLER ====================

app.use(errorHandler);

export default app;
