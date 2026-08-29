import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * GET /api/wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price mrpPrice images tag fabric occasion rating averageRating isActive')
      .lean();

    if (!wishlist) {
      return successResponse(res, { items: [] });
    }

    // Filter out inactive products
    wishlist.items = wishlist.items.filter((item) => item.product && item.product.isActive);

    successResponse(res, { items: wishlist.items });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wishlist/toggle/:productId
 * Add or remove from wishlist
 */
export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [{ product: productId }],
      });
      return successResponse(res, { added: true, message: 'Added to wishlist' });
    }

    const existingIndex = wishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      // Remove
      wishlist.items.splice(existingIndex, 1);
      await wishlist.save();
      return successResponse(res, { added: false, message: 'Removed from wishlist' });
    } else {
      // Add
      wishlist.items.push({ product: productId });
      await wishlist.save();
      return successResponse(res, { added: true, message: 'Added to wishlist' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/wishlist/remove/:productId
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return successResponse(res, { items: [] });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await wishlist.save();

    successResponse(res, null, 'Removed from wishlist');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wishlist/move-to-cart/:productId
 * Move item from wishlist to cart
 */
export const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(
        (item) => item.product.toString() !== productId
      );
      await wishlist.save();
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity: 1 }],
      });
    } else {
      const existing = cart.items.find(
        (item) => item.product.toString() === productId
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
      await cart.save();
    }

    successResponse(res, null, 'Moved to cart');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wishlist/sync
 * Sync local storage wishlist to DB
 */
export const syncWishlist = async (req, res, next) => {
  try {
    const { items = [] } = req.body; // expecting array of product IDs

    if (!items || !Array.isArray(items) || items.length === 0) {
      return successResponse(res, null, 'No items to sync');
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }

    for (const productId of items) {
      if (!productId) continue;

      const product = await Product.findOne({ _id: productId, isActive: true });
      if (!product) continue;

      const existingIndex = wishlist.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex === -1) {
        wishlist.items.push({ product: productId });
      }
    }

    await wishlist.save();
    successResponse(res, null, 'Wishlist synced successfully');
  } catch (error) {
    next(error);
  }
};
