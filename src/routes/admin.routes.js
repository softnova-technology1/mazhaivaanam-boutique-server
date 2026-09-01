import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createProductValidator, updateProductValidator } from '../validators/product.validator.js';
import { updateOrderStatusValidator } from '../validators/order.validator.js';
import upload from '../middleware/upload.middleware.js';
import { getAllFabrics, getAdminFabrics, createFabric, updateFabric, deleteFabric } from '../controllers/fabric.controller.js';

// Controllers
import { createProduct, updateProduct, deleteProduct, hardDeleteProduct, getAdminProducts, bulkImportProducts } from '../controllers/product.controller.js';
import {
  createCategory, updateCategory, deleteCategory, getAdminCategories,
  createCollection, updateCollection, deleteCollection, getAdminCollections,
} from '../controllers/category.controller.js';
import { getAllOrders, updateOrderStatus } from '../controllers/order.controller.js';
import { getInquiries, replyToInquiry } from '../controllers/contact.controller.js';
import {
  getProductReviews, createReview, deleteReview, getPendingReviews, approveReview, getAllReviews,
} from '../controllers/review.controller.js';
import {
  getAllInventory, getProductInventory, restockProduct,
  adjustStock, getLowStockProducts, getOutOfStockProducts,
} from '../controllers/inventory.controller.js';
import { uploadImage, deleteImage } from '../controllers/upload.controller.js';
import {
  getDashboard, getSalesAnalytics, getUsers, updateUserRole,
  toggleUserStatus, deleteUser,
  bulkUpdateOrderStatus, bulkDeleteProducts, hardBulkDeleteProducts,
} from '../controllers/admin.controller.js';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupon.controller.js';
import { getDiscounts, updateDiscount, removeDiscount, bulkUpdateDiscounts, bulkRemoveDiscounts } from '../controllers/discount.controller.js';
import { getOfferConfig, updateOfferConfig } from '../controllers/offer.controller.js';
import { updateStoreConfig } from '../controllers/storeConfig.controller.js';

const router = Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/dashboard/sales', getSalesAnalytics);

// Products
router.get('/products', getAdminProducts);
router.post('/products', validate(createProductValidator), createProduct);
router.post('/products/bulk/import', bulkImportProducts);
router.post('/products/bulk/delete', bulkDeleteProducts);
router.post('/products/bulk/hard-delete', hardBulkDeleteProducts);
router.put('/products/:id', validate(updateProductValidator), updateProduct);
router.delete('/products/:id', deleteProduct);
router.delete('/products/:id/hard', hardDeleteProduct);

// Categories
router.get('/categories', getAdminCategories);
router.get('/fabrics', getAdminFabrics);
router.post('/fabrics', createFabric);
router.put('/fabrics/:id', updateFabric);
router.delete('/fabrics/:id', deleteFabric);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Collections
router.get('/collections', getAdminCollections);
router.post('/collections', createCollection);
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/bulk/status', bulkUpdateOrderStatus);
router.put('/orders/:orderId/status', validate(updateOrderStatusValidator), updateOrderStatus);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Reviews
router.get('/reviews', getPendingReviews);
router.get('/reviews/all', getAllReviews);
router.put('/reviews/:reviewId/approve', approveReview);
router.delete('/reviews/:reviewId', deleteReview);

// Contact Inquiries
router.get('/inquiries', getInquiries);
router.put('/inquiries/:id/reply', replyToInquiry);

// Inventory
router.get('/inventory', getAllInventory);
router.get('/inventory/low-stock', getLowStockProducts);
router.get('/inventory/out-of-stock', getOutOfStockProducts);
router.get('/inventory/:productId', getProductInventory);
router.put('/inventory/:productId/restock', restockProduct);
router.put('/inventory/:productId/adjust', adjustStock);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Discounts
router.get('/discounts', getDiscounts);
router.put('/discounts/bulk', bulkUpdateDiscounts);
router.post('/discounts/bulk-remove', bulkRemoveDiscounts);
router.put('/discounts/:productId', updateDiscount);
router.delete('/discounts/:productId', removeDiscount);

// Image Upload
router.post('/upload', upload.single('image'), uploadImage);
router.delete('/upload/:publicId', deleteImage);

// Limited Offer Config
router.get('/limited-offer/config', getOfferConfig);
router.put('/limited-offer', updateOfferConfig);

// Store Config (Festival Discount, Fees)
router.get('/store/config', async (req, res, next) => { const { getStoreConfig } = await import('../controllers/storeConfig.controller.js'); getStoreConfig(req, res, next); });
router.put('/store/config', updateStoreConfig);

export default router;
