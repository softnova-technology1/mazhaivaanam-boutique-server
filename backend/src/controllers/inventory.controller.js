import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getAllInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find()
      .populate({
        path: 'product',
        select: 'name slug images price isActive category',
        populate: { path: 'category', select: 'name slug' }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Only include active and non-deleted products
    const activeInventory = inventory.filter(inv => inv.product && inv.product.isActive !== false);

    // Add virtual fields
    const enriched = activeInventory.map((inv) => ({
      ...inv,
      availableStock: Math.max(0, inv.totalStock - inv.reserved - inv.sold),
      isLowStock: inv.totalStock - inv.reserved - inv.sold <= inv.lowStockThreshold,
      isOutOfStock: inv.totalStock - inv.reserved - inv.sold <= 0,
    }));

    successResponse(res, enriched);
  } catch (error) {
    next(error);
  }
};

export const getProductInventory = async (req, res, next) => {
  try {
    const inv = await Inventory.findOne({ product: req.params.productId })
      .populate('product', 'name slug images price')
      .lean();

    if (!inv) return errorResponse(res, 'Inventory record not found', 404);

    inv.availableStock = Math.max(0, inv.totalStock - inv.reserved - inv.sold);
    inv.isLowStock = inv.availableStock <= inv.lowStockThreshold;
    inv.isOutOfStock = inv.availableStock <= 0;

    successResponse(res, inv);
  } catch (error) {
    next(error);
  }
};

export const restockProduct = async (req, res, next) => {
  try {
    const { quantity, note } = req.body;
    if (!quantity || quantity <= 0) {
      return errorResponse(res, 'Quantity must be a positive number', 400);
    }

    const inv = await Inventory.findOne({ product: req.params.productId });
    if (!inv) return errorResponse(res, 'Inventory record not found', 404);

    inv.totalStock += quantity;
    inv.lastRestockedAt = new Date();
    inv.stockHistory.push({
      type: 'restock',
      quantity,
      note: note || `Restocked ${quantity} units`,
    });
    await inv.save();

    successResponse(res, inv, `Restocked ${quantity} units`);
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { quantity, note } = req.body;

    const inv = await Inventory.findOne({ product: req.params.productId });
    if (!inv) return errorResponse(res, 'Inventory record not found', 404);

    inv.totalStock = Math.max(0, inv.totalStock + quantity);
    inv.stockHistory.push({
      type: 'adjustment',
      quantity,
      note: note || `Manual adjustment: ${quantity > 0 ? '+' : ''}${quantity}`,
    });
    await inv.save();

    successResponse(res, inv, 'Stock adjusted');
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const allInv = await Inventory.find()
      .populate('product', 'name slug images price isActive')
      .lean();

    const lowStock = allInv.filter((inv) => {
      const available = inv.totalStock - inv.reserved - inv.sold;
      return available <= inv.lowStockThreshold && available > 0 && inv.product?.isActive;
    });

    successResponse(res, lowStock);
  } catch (error) {
    next(error);
  }
};

export const getOutOfStockProducts = async (req, res, next) => {
  try {
    const allInv = await Inventory.find()
      .populate('product', 'name slug images price isActive')
      .lean();

    const outOfStock = allInv.filter((inv) => {
      const available = inv.totalStock - inv.reserved - inv.sold;
      return available <= 0 && inv.product?.isActive;
    });

    successResponse(res, outOfStock);
  } catch (error) {
    next(error);
  }
};
