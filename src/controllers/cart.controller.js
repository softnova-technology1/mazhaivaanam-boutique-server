import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/** Compute effective (post-discount) price for a product */
function effectivePrice(product) {
  const d = product.discount;
  if (!d || !d.isActive || !d.type) return product.price;
  const now = new Date();
  if (d.startDate && now < new Date(d.startDate)) return product.price;
  if (d.endDate && now > new Date(d.endDate)) return product.price;
  if (d.type === 'percentage') return Math.round(product.price * (1 - d.value / 100));
  if (d.type === 'fixed') return Math.max(0, product.price - d.value);
  return product.price;
}

/** Enrich cart item: attach discountedPrice & discountActive */
function enrichItem(item) {
  const prod = item.product;
  if (!prod) return item;
  const discounted = effectivePrice(prod);
  return {
    ...item,
    product: {
      ...prod,
      discountedPrice: discounted,
      discountActive: discounted < prod.price,
    },
  };
}

/**
 * GET /api/cart
 * Get user's cart with populated product data
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price mrpPrice images tag fabric isActive isPreorder discount')
      .lean();

    if (!cart) {
      return successResponse(res, { items: [], total: 0, itemCount: 0 });
    }

    // Filter out inactive or deleted products
    cart.items = cart.items.filter((item) => item.product && item.product.isActive);

    // Enrich items with discountedPrice
    cart.items = cart.items.map(enrichItem);

    // Calculate totals using effective (discounted) price
    const total = cart.items.reduce((sum, item) => sum + effectivePrice(item.product) * item.quantity, 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    successResponse(res, { items: cart.items, total, itemCount });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cart/add
 * Add item to cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Verify product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return errorResponse(res, 'Product not found or unavailable', 404);
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      // Check if product already in cart
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    // Return populated cart
    cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price mrpPrice images tag fabric isActive discount');

    const enrichedItems = cart.items.map(item => ({
      ...item.toObject(),
      product: {
        ...item.product.toObject(),
        discountedPrice: effectivePrice(item.product),
        discountActive: effectivePrice(item.product) < item.product.price,
      }
    }));

    const total = enrichedItems.reduce((sum, item) => sum + effectivePrice(item.product) * item.quantity, 0);
    const itemCount = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

    successResponse(res, { items: enrichedItems, total, itemCount }, 'Added to cart');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/cart/update
 * Update item quantity
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return errorResponse(res, 'Cart not found', 404);
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return errorResponse(res, 'Item not in cart', 404);
    }

    if (quantity <= 0) {
      // Remove item
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    const populated = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price mrpPrice images tag fabric isActive discount')
      .lean();

    const enrichedItems = (populated?.items || []).map(enrichItem);
    const total = enrichedItems.reduce((sum, i) => sum + effectivePrice(i.product) * i.quantity, 0);
    const itemCount = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);

    successResponse(res, { items: enrichedItems, total, itemCount }, 'Cart updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cart/remove/:productId
 * Remove item from cart
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return errorResponse(res, 'Cart not found', 404);
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await cart.save();

    const populated = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price mrpPrice images tag fabric isActive discount')
      .lean();

    const enrichedItems = (populated?.items || []).map(enrichItem);
    const total = enrichedItems.reduce((sum, i) => sum + effectivePrice(i.product) * i.quantity, 0);
    const itemCount = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);

    successResponse(res, { items: enrichedItems, total, itemCount }, 'Item removed');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cart/clear
 * Clear entire cart
 */
export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] }
    );
    successResponse(res, { items: [], total: 0, itemCount: 0 }, 'Cart cleared');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cart/count
 * Get cart item count
 */
export const getCartCount = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).lean();
    const count = cart
      ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
    successResponse(res, { count });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cart/sync
 * Sync local storage cart to DB
 */
export const syncCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return successResponse(res, null, 'No items to sync');
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const item of items) {
      const productId = item.productId || item.id || item.product || item._id;
      if (!productId) continue;

      const product = await Product.findOne({ _id: productId, isActive: true });
      if (!product) continue;

      const existingItem = cart.items.find(
        (i) => i.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += (item.quantity || 1);
      } else {
        cart.items.push({ product: productId, quantity: item.quantity || 1 });
      }
    }

    await cart.save();
    successResponse(res, null, 'Cart synced successfully');
  } catch (error) {
    next(error);
  }
};
