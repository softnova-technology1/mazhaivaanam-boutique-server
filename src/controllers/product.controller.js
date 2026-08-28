import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { isDiscountActive, computeDiscountedPrice } from './discount.controller.js';

/**
 * GET /api/products
 * List products with filtering, sorting, search, and pagination
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      occasion,
      fabric,
      color,
      tag,
      minPrice,
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 12,
      featured,
      preorder,
    } = req.query;

    const filter = { isActive: true };

    // Category filter (by slug)
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    // Direct filters
    if (occasion) filter.occasion = occasion;
    if (fabric) filter.fabric = fabric;
    if (tag) filter.tag = tag;
    if (featured === 'true') filter.isFeatured = true;
    if (preorder === 'true') filter.isPreorder = true;

    // Color filter
    if (color) filter['color.hex'] = `#${color}`;

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default: newest
    switch (sort) {
      case 'price_asc': sortOption = { price: 1 }; break;
      case 'price_desc': sortOption = { price: -1 }; break;
      case 'rating': sortOption = { averageRating: -1 }; break;
      case 'name_asc': sortOption = { name: 1 }; break;
      case 'name_desc': sortOption = { name: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'oldest': sortOption = { createdAt: 1 }; break;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Enrich with discount info
    const enriched = products.map((p) => ({
      ...p,
      discountedPrice: computeDiscountedPrice(p.price, p.discount),
      discountActive: isDiscountActive(p.discount),
    }));

    paginatedResponse(res, enriched, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/featured
 * Get featured products for homepage
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const enriched = products.map((p) => ({
      ...p,
      discountedPrice: computeDiscountedPrice(p.price, p.discount),
      discountActive: isDiscountActive(p.discount),
    }));
    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/new-arrivals
 */
export const getNewArrivals = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const products = await Product.find({ isActive: true, tag: 'NEW ARRIVAL' })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const enriched = products.map((p) => ({
      ...p,
      discountedPrice: computeDiscountedPrice(p.price, p.discount),
      discountActive: isDiscountActive(p.discount),
    }));
    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/best-sellers
 * Returns best sellers (both manual 'BESTSELLER' tagged and dynamic highest-rated products)
 */
export const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    // 1. First get products explicitly tagged as BESTSELLER
    let products = await Product.find({ isActive: true, tag: 'BESTSELLER' })
      .populate('category', 'name slug')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // 2. If fewer than limit, dynamically fetch highest-rated / featured products to fill the quota
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const remainingLimit = limit - products.length;

      const dynamicTopSellers = await Product.find({
        isActive: true,
        _id: { $nin: existingIds },
      })
        .populate('category', 'name slug')
        .sort({ averageRating: -1, reviewCount: -1, createdAt: -1 })
        .limit(remainingLimit)
        .lean();

      products = [...products, ...dynamicTopSellers];
    }

    const enriched = products.map((p) => ({
      ...p,
      discountedPrice: computeDiscountedPrice(p.price, p.discount),
      discountActive: isDiscountActive(p.discount),
    }));
    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/pre-orders
 */
export const getPreOrders = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isPreorder: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
    const enriched = products.map((p) => ({
      ...p,
      discountedPrice: computeDiscountedPrice(p.price, p.discount),
      discountActive: isDiscountActive(p.discount),
    }));
    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/search?q=
 */
export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return errorResponse(res, 'Search query must be at least 2 characters', 400);
    }

    const products = await Product.find({
      isActive: true,
      $text: { $search: q },
    })
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:slug
 * Get single product by slug
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const isId = mongoose.isValidObjectId(req.params.slug);
    const query = isId
      ? { $or: [{ _id: req.params.slug }, { slug: req.params.slug }], isActive: true }
      : { slug: req.params.slug, isActive: true };

    const product = await Product.findOne(query)
      .populate('category', 'name slug')
      .populate('collection', 'name slug')
      .lean();

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Get inventory status
    const inventory = await Inventory.findOne({ product: product._id }).lean();
    product.stock = inventory
      ? {
        available: Math.max(0, inventory.totalStock - inventory.reserved - inventory.sold),
        isLowStock: inventory.totalStock - inventory.reserved - inventory.sold <= inventory.lowStockThreshold,
        isOutOfStock: inventory.totalStock - inventory.reserved - inventory.sold <= 0,
      }
      : { available: 0, isLowStock: true, isOutOfStock: true };

    // Enrich with discount info
    product.discountedPrice = computeDiscountedPrice(product.price, product.discount);
    product.discountActive = isDiscountActive(product.discount);

    successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

// ============ ADMIN ENDPOINTS ============

/**
 * POST /api/admin/products
 * Create a new product (Admin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    // Create inventory entry
    const initialStock = req.body.stock !== undefined ? Number(req.body.stock) : (req.body.isPreorder ? 1 : 25);
    await Inventory.create({
      product: product._id,
      totalStock: initialStock,
      lowStockThreshold: 5,
    });

    const populated = await Product.findById(product._id).populate('category', 'name slug');

    successResponse(res, populated, 'Product created', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/products/:id
 * Update a product (Admin)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    Object.assign(product, req.body);
    await product.save();

    if (req.body.stock !== undefined) {
      await Inventory.findOneAndUpdate(
        { product: product._id },
        { totalStock: Number(req.body.stock) },
        { upsert: true }
      );
    }

    const populated = await Product.findById(product._id).populate('category', 'name slug');

    successResponse(res, populated, 'Product updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/products/:id
 * Soft-delete a product (Admin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    product.isActive = false;
    await product.save();

    successResponse(res, null, 'Product deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/products/:id/hard
 * Permanently delete a product and its inventory (Admin)
 */
export const hardDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Delete inventory record
    await Inventory.findOneAndDelete({ product: product._id });

    // Delete product
    await Product.findByIdAndDelete(req.params.id);

    successResponse(res, null, 'Product permanently deleted');
  } catch (error) {
    next(error);
  }
};