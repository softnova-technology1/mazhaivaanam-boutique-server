import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { isDiscountActive, computeDiscountedPrice } from './discount.controller.js';
import { generateSKU } from '../utils/sku.util.js';

export const formatProductOutput = (p) => {
  if (!p) return p;
  const images = (p.images && Array.isArray(p.images) && p.images.length > 0)
    ? p.images.map(img => ({
        ...img,
        url: (typeof img.url === 'string' && img.url.startsWith('blob:')) ? '' : (img.url || '')
      }))
    : [];

  return {
    ...p,
    images,
    discountedPrice: computeDiscountedPrice(p.price, p.discount),
    discountActive: isDiscountActive(p.discount),
  };
};

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
    // Preorder filter - default: isolate pre-orders from regular catalog
    if (preorder === 'true') {
      filter.isPreorder = true;
    } else {
      filter.isPreorder = { $ne: true };
    }

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

    // Enrich with discount info & image sanitization
    const enriched = products.map(formatProductOutput);

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
    const products = await Product.find({ isActive: true, isFeatured: true, isPreorder: { $ne: true } })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const enriched = products.map(formatProductOutput);
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
    const products = await Product.find({ isActive: true, tag: 'NEW ARRIVAL', isPreorder: { $ne: true } })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const enriched = products.map(formatProductOutput);
    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/limited-offers
 * Returns only products tagged as 'FESTIVAL CHOICE' or 'LIMITED EDITION'
 */
export const getLimitedOfferProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const products = await Product.find({
      isActive: true,
      tag: { $in: ['FESTIVAL CHOICE', 'LIMITED EDITION'] },
      isPreorder: { $ne: true }
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const enriched = products.map(formatProductOutput);
    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/best-sellers
 * Returns only products explicitly tagged as 'BESTSELLER'
 */
export const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    // Only return products manually tagged as BESTSELLER by admin
    const products = await Product.find({ isActive: true, tag: 'BESTSELLER', isPreorder: { $ne: true } })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const enriched = products.map(formatProductOutput);
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
    const enriched = products.map(formatProductOutput);
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
      isPreorder: { $ne: true },
      $text: { $search: q },
    })
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    const enriched = products.map(formatProductOutput);

    successResponse(res, enriched);
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

    const formatted = formatProductOutput(product);
    formatted.stock = product.stock;

    successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

// ============ ADMIN ENDPOINTS ============

/**
 * GET /api/admin/products
 * Get all products (including inactive) for admin
 */
export const getAdminProducts = async (req, res, next) => {
  try {
    const { category, tag, search, sort, page = 1, limit = 15, preorder } = req.query;
    const filter = {};

    // Category filter — accepts ObjectId directly
    if (category) {
      if (mongoose.isValidObjectId(category)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
      }
    }

    if (tag) filter.tag = tag;
    if (preorder === 'true') {
      filter.isPreorder = true;
    } else {
      filter.isPreorder = { $ne: true };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price_asc': sortOption = { price: 1 }; break;
      case 'price_desc': sortOption = { price: -1 }; break;
      case 'name_asc': sortOption = { name: 1 }; break;
      case 'name_desc': sortOption = { name: -1 }; break;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total, totalAll, totalActive, totalScheduled] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isScheduled: true }),
    ]);

    const enriched = products.map(formatProductOutput);

    res.status(200).json({
      success: true,
      data: enriched,
      stats: {
        all: totalAll,
        active: totalActive,
        scheduled: totalScheduled
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/products
 * Create a new product (Admin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;

    // Auto-generate SKU, patternCode, patternSeq, normalizedName
    const skuData = await generateSKU({
      name: productData.name,
      category: productData.category,
      fabric: productData.fabric,
    });

    // Merge SKU data into product
    const finalData = {
      ...productData,
      sku:            skuData.sku,
      patternCode:    skuData.patternCode,
      patternSeq:     skuData.patternSeq,
      normalizedName: skuData.normalizedName,
    };

    const product = await Product.create(finalData);

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

    // If name changed, regenerate SKU + pattern fields
    const nameChanged = req.body.name && req.body.name !== product.name;
    const catChanged  = req.body.category && String(req.body.category) !== String(product.category);
    const fabricChanged = req.body.fabric && req.body.fabric !== product.fabric;
    if (nameChanged || catChanged || fabricChanged) {
      const skuData = await generateSKU({
        name:     req.body.name     || product.name,
        category: req.body.category || product.category,
        fabric:   req.body.fabric   || product.fabric,
      });
      req.body.sku            = skuData.sku;
      req.body.patternCode    = skuData.patternCode;
      req.body.patternSeq     = skuData.patternSeq;
      req.body.normalizedName = skuData.normalizedName;
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

/**
 * POST /api/admin/products/bulk/import
 * Bulk import products from JSON array (parsed from CSV/Excel)
 */
export const bulkImportProducts = async (req, res, next) => {
  try {
    const rawProducts = req.body.products || (Array.isArray(req.body) ? req.body : []);
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return errorResponse(res, 'No product records provided for import', 400);
    }

    // Fetch all categories for resolution
    const categories = await Category.find({}).lean();
    const defaultCat = categories[0]?._id;

    const createdProducts = [];
    const errors = [];

    for (let i = 0; i < rawProducts.length; i++) {
      const item = rawProducts[i];
      try {
        if (!item.name || !String(item.name).trim()) {
          errors.push({ row: i + 1, message: 'Missing product name' });
          continue;
        }

        // Match category by name or slug or ID
        let catId = defaultCat;
        if (item.category) {
          const catStr = String(item.category).trim().toLowerCase();
          const matchCat = categories.find(c =>
            c._id.toString() === item.category ||
            c.name.toLowerCase() === catStr ||
            c.slug.toLowerCase() === catStr
          );
          if (matchCat) catId = matchCat._id;
        }

        const price = Number(item.price) || 0;
        const mrpPrice = Number(item.mrpPrice) || Math.round(price * 1.15);
        const stock = (item.stock !== undefined && item.stock !== '' && !isNaN(Number(item.stock))) ? Number(item.stock) : 25;

        let images = [];
        if (Array.isArray(item.images) && item.images.length > 0) {
          images = item.images;
        } else if (item.imageUrl || item.image || item.primaryImage) {
          images = [{ url: item.imageUrl || item.image || item.primaryImage, publicId: '' }];
        }

        const shortDesc = item.shortDescription || item.simpleDescription || '';
        const longDesc = item.description || item.longDescription || item.detailedDescription || '';

        const newProd = await Product.create({
          name: String(item.name).trim(),
          shortDescription: shortDesc ? String(shortDesc).trim() : '',
          description: longDesc ? String(longDesc).trim() : '',
          category: catId,
          fabric: item.fabric || 'Cotton',
          price,
          mrpPrice,
          tag: item.tag || null,
          isFeatured: Boolean(item.isFeatured),
          isActive: item.isActive !== false,
          isPreorder: Boolean(item.isPreorder),
          weight: item.weight !== undefined && item.weight !== null ? String(item.weight).trim() : '',
          pattern: item.pattern !== undefined && item.pattern !== null ? String(item.pattern).trim() : '',
          pallu: item.pallu !== undefined && item.pallu !== null ? String(item.pallu).trim() : '',
          sareeLength: item.sareeLength !== undefined && item.sareeLength !== null ? String(item.sareeLength).trim() : '',
          blouseLength: item.blouseLength !== undefined && item.blouseLength !== null ? String(item.blouseLength).trim() : '',
          blouse: item.blouse !== undefined && item.blouse !== null ? String(item.blouse).trim() : '',
          height: item.height !== undefined && item.height !== null ? String(item.height).trim() : '',
          washCare: item.washCare !== undefined && item.washCare !== null ? String(item.washCare).trim() : '',
          returnPolicy: item.returnPolicy !== undefined && item.returnPolicy !== null ? String(item.returnPolicy).trim() : '',
          note: item.note !== undefined && item.note !== null ? String(item.note).trim() : '',
          images,
        });

        // Create inventory
        await Inventory.create({
          product: newProd._id,
          totalStock: stock,
          lowStockThreshold: 5,
        });

        createdProducts.push(newProd);
      } catch (err) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    return successResponse(res, {
      importedCount: createdProducts.length,
      errorsCount: errors.length,
      errors,
    }, `Successfully imported ${createdProducts.length} products`);
  } catch (error) {
    next(error);
  }
};