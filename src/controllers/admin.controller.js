import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import ContactInquiry from '../models/ContactInquiry.js';
import Inventory from '../models/Inventory.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/admin/dashboard
 * Overview stats
 */
export const getDashboard = async (req, res, next) => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      pendingInquiries,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      ContactInquiry.countDocuments({ status: 'new' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const revenue = revenueResult[0]?.total || 0;
    const paidOrders = revenueResult[0]?.count || 0;

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Low stock count (only active products)
    const allInv = await Inventory.find().populate('product', 'isActive').lean();
    const activeInv = allInv.filter((i) => i.product && i.product.isActive !== false);
    const lowStockCount = activeInv.filter((i) => {
      const available = i.totalStock - i.reserved - i.sold;
      return available <= i.lowStockThreshold && available > 0;
    }).length;
    const outOfStockCount = activeInv.filter((i) => i.totalStock - i.reserved - i.sold <= 0).length;

    successResponse(res, {
      overview: {
        totalRevenue: revenue,
        totalOrders,
        paidOrders,
        totalUsers,
        totalProducts,
        pendingInquiries,
        lowStockCount,
        outOfStockCount,
      },
      statusBreakdown,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard/sales?period=daily|weekly|monthly
 * Sales analytics
 */
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const days = period === 'monthly' ? 365 : period === 'weekly' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let groupBy;
    if (period === 'daily') {
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (period === 'weekly') {
      groupBy = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
    } else {
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          items: { $sum: { $size: '$items' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    successResponse(res, { sales, topProducts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .lean();
    successResponse(res, users);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );
    successResponse(res, user, 'User role updated');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/status
 * Toggle user active/inactive status
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    
    // Prevent self-deactivation if admin
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot deactivate your own account', 400);
    }

    user.isActive = !user.isActive;
    await user.save();
    successResponse(res, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user completely
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    await User.findByIdAndDelete(req.params.id);
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/bulk-status
 * Bulk update status for selected orders
 */
export const bulkUpdateOrderStatus = async (req, res, next) => {
  try {
    const { orderIds, status, note } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return errorResponse(res, 'Please provide an array of order IDs', 400);
    }
    if (!status) {
      return errorResponse(res, 'Please provide a target status', 400);
    }

    const historyEntry = {
      status,
      timestamp: new Date(),
      note: note || `Bulk status updated to ${status} by admin`,
    };

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: { status },
        $push: { statusHistory: historyEntry },
      }
    );

    successResponse(res, result, `Successfully updated ${result.modifiedCount} orders to ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/products/bulk-delete
 * Bulk delete products
 */
export const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse(res, 'Please provide an array of product IDs', 400);
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isActive: false } }
    );

    successResponse(res, result, `Successfully removed ${result.modifiedCount} products`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/products/bulk-hard-delete
 * Bulk permanently delete products
 */
export const hardBulkDeleteProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse(res, 'Please provide an array of product IDs', 400);
    }

    await Inventory.deleteMany({ product: { $in: productIds } });
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    successResponse(res, result, `Successfully permanently deleted ${result.deletedCount} products`);
  } catch (error) {
    next(error);
  }
};
