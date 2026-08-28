import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import razorpay from '../config/razorpay.js';
import generateOrderId from '../utils/generateOrderId.js';
import { sendOrderConfirmationEmail, sendOrderShippedEmail } from '../utils/sendEmail.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';

const GIFT_WRAP_PRICE = 499;
const CONVENIENCE_FEE = 2;
const FESTIVAL_DISCOUNT_PERCENT = 5;

/**
 * POST /api/orders
 * Place a new order — creates Razorpay order
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      items, shippingAddress, deliveryMode, giftPackaging,
      giftMessage, paymentMethod, couponCode,
    } = req.body;

    // 1. Validate and fetch products
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();

    if (products.length !== items.length) {
      return errorResponse(res, 'One or more products are unavailable', 400);
    }

    // 2. Check inventory
    for (const item of items) {
      const inv = await Inventory.findOne({ product: item.product });
      if (inv) {
        const available = inv.totalStock - inv.reserved - inv.sold;
        if (available < item.quantity) {
          const prod = products.find((p) => p._id.toString() === item.product);
          return errorResponse(res, `"${prod?.name}" is out of stock`, 400);
        }
      }
    }

    // 3. Calculate pricing
    const orderItems = items.map((item) => {
      const prod = products.find((p) => p._id.toString() === item.product);
      return {
        product: prod._id,
        name: prod.name,
        price: prod.price,
        image: prod.images?.[0]?.url || '',
        quantity: item.quantity,
        fabric: prod.fabric,
        category: '',
      };
    });

    const mrpTotal = orderItems.reduce((sum, i) => {
      const prod = products.find((p) => p._id.toString() === i.product.toString());
      return sum + (prod.mrpPrice || Math.round(prod.price * 1.15)) * i.quantity;
    }, 0);

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const festivalDiscount = Math.round(subtotal * (FESTIVAL_DISCOUNT_PERCENT / 100));
    const giftPackCharge = giftPackaging ? GIFT_WRAP_PRICE : 0;

    // Apply coupon
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid()) {
        couponDiscount = coupon.calculateDiscount(subtotal);
      }
    }

    const totalAmount = Math.max(0, subtotal - festivalDiscount - couponDiscount + giftPackCharge + CONVENIENCE_FEE);
    const totalSavings = mrpTotal - subtotal + festivalDiscount + couponDiscount;

    // 4. Generate order ID
    const orderId = generateOrderId();

    // 5. Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // paise (must be integer)
        currency: 'INR',
        receipt: orderId,
        notes: { orderId, userId: req.user._id.toString() },
      });
    } catch (rpError) {
      const errorMsg = rpError.error?.description || rpError.message || JSON.stringify(rpError);
      console.error('Razorpay error details:', errorMsg);
      return errorResponse(res, `Razorpay Error: ${errorMsg}`, 502);
    }

    // 6. Reserve inventory
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { product: item.product },
        {
          $inc: { reserved: item.quantity },
          $push: {
            stockHistory: {
              type: 'reservation',
              quantity: item.quantity,
              note: `Reserved for order ${orderId}`,
            },
          },
        }
      );
    }

    // 7. Save order
    const order = await Order.create({
      orderId,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      deliveryMode: deliveryMode || 'standard',
      giftPackaging: giftPackaging || false,
      giftMessage: giftMessage || '',
      mrpTotal,
      subtotal,
      discount: festivalDiscount,
      couponCode: couponCode || '',
      couponDiscount,
      giftPackCharge,
      convenienceFee: CONVENIENCE_FEE,
      totalAmount,
      totalSavings,
      paymentMethod,
      paymentStatus: 'pending',
      razorpayOrderId: razorpayOrder.id,
      status: 'PROCESSING',
      statusHistory: [{
        status: 'PROCESSING',
        note: 'Order placed, awaiting payment',
      }],
      estimatedDelivery: new Date(Date.now() + (deliveryMode === 'express' ? 5 : 9) * 24 * 60 * 60 * 1000),
      isPreorder: orderItems.some((i) => {
        const prod = products.find((p) => p._id.toString() === i.product.toString());
        return prod?.isPreorder;
      }),
    });

    // 8. Increment coupon usage
    if (couponCode && couponDiscount > 0) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    successResponse(res, {
      orderId: order.orderId,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
      currency: 'INR',
    }, 'Order created — complete payment', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment and confirm order
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse(res, 'Payment verification failed', 400);
    }

    // Update order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = 'CONFIRMED';
    order.statusHistory.push({
      status: 'CONFIRMED',
      note: 'Payment confirmed via Razorpay',
    });
    await order.save();

    // Convert reserved → sold
    for (const item of order.items) {
      await Inventory.findOneAndUpdate(
        { product: item.product },
        {
          $inc: { reserved: -item.quantity, sold: item.quantity },
          $push: {
            stockHistory: {
              type: 'sale',
              quantity: item.quantity,
              note: `Sold via order ${order.orderId}`,
            },
          },
        }
      );
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

    // Send confirmation email
    const user = await User.findById(order.user);
    if (user) {
      sendOrderConfirmationEmail(user, order);
    }

    successResponse(res, { orderId: order.orderId }, 'Payment verified — order confirmed');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders
 * Get user's order history
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    paginatedResponse(res, orders, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderId
 * Get single order details
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user._id,
    }).lean();

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/cancel
 * Cancel an order (only if PROCESSING or CONFIRMED)
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user._id,
    });

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    if (!['PROCESSING', 'CONFIRMED'].includes(order.status)) {
      return errorResponse(res, `Cannot cancel order in "${order.status}" status`, 400);
    }

    order.status = 'CANCELLED';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: 'Cancelled by customer',
    });
    await order.save();

    // Release inventory
    for (const item of order.items) {
      const field = order.paymentStatus === 'paid' ? 'sold' : 'reserved';
      await Inventory.findOneAndUpdate(
        { product: item.product },
        {
          $inc: { [field]: -item.quantity },
          $push: {
            stockHistory: {
              type: 'release',
              quantity: item.quantity,
              note: `Released from cancelled order ${order.orderId}`,
            },
          },
        }
      );
    }

    successResponse(res, { orderId: order.orderId }, 'Order cancelled');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tracking/:orderId
 * Public order tracking
 */
export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('orderId status statusHistory trackingNumber courier estimatedDelivery items createdAt deliveryMode')
      .lean();

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:orderId/status (Admin)
 * Update order status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, location, note, trackingNumber, courier } = req.body;

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    order.status = status;
    order.statusHistory.push({
      status,
      location: location || '',
      note: note || '',
    });

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;

    await order.save();

    // Send email notifications on key status changes
    if (status === 'SHIPPED') {
      const user = await User.findById(order.user);
      if (user) sendOrderShippedEmail(user, order);
    }

    successResponse(res, order, 'Order status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders (Admin)
 * List all orders with filters
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, dateRange, sort = 'newest', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    if (dateRange) {
      if (dateRange === '7days') {
        const now = new Date();
        filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      } else if (dateRange === '30days') {
        const now = new Date();
        filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      } else {
        // Assume dateRange is a specific date string (YYYY-MM-DD)
        const startOfDay = new Date(dateRange);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateRange);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email')
        .sort(sortOption)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    paginatedResponse(res, orders, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};
