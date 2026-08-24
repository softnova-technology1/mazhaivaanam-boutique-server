import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// ============ CATEGORIES ============

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    category.productCount = productCount;

    successResponse(res, category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    successResponse(res, category, 'Category created', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }
    Object.assign(category, req.body);
    await category.save();
    successResponse(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Check if products exist under this category
    const count = await Product.countDocuments({ category: category._id, isActive: true });
    if (count > 0) {
      return errorResponse(res, `Cannot delete — ${count} products belong to this category`, 400);
    }

    category.isActive = false;
    await category.save();
    successResponse(res, null, 'Category deleted');
  } catch (error) {
    next(error);
  }
};

// ============ COLLECTIONS ============

export const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    successResponse(res, collections);
  } catch (error) {
    next(error);
  }
};

export const getCollectionBySlug = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!collection) {
      return errorResponse(res, 'Collection not found', 404);
    }

    const products = await Product.find({ collection: collection._id, isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    collection.products = products;
    successResponse(res, collection);
  } catch (error) {
    next(error);
  }
};

export const createCollection = async (req, res, next) => {
  try {
    const collection = await Collection.create(req.body);
    successResponse(res, collection, 'Collection created', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return errorResponse(res, 'Collection not found', 404);
    }
    Object.assign(collection, req.body);
    await collection.save();
    successResponse(res, collection, 'Collection updated');
  } catch (error) {
    next(error);
  }
};

export const deleteCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return errorResponse(res, 'Collection not found', 404);
    }
    collection.isActive = false;
    await collection.save();
    successResponse(res, null, 'Collection deleted');
  } catch (error) {
    next(error);
  }
};
