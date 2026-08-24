import Coupon from '../models/Coupon.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    successResponse(res, coupons);
  } catch (error) { next(error); }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    successResponse(res, coupon, 'Coupon created', 201);
  } catch (error) { next(error); }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);
    Object.assign(coupon, req.body);
    await coupon.save();
    successResponse(res, coupon, 'Coupon updated');
  } catch (error) { next(error); }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);
    successResponse(res, null, 'Coupon deleted');
  } catch (error) { next(error); }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return errorResponse(res, 'Please enter a coupon code', 400);

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) return errorResponse(res, 'Invalid coupon code', 404);

    if (!coupon.isActive) return errorResponse(res, 'This coupon is inactive', 400);
    if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
      return errorResponse(res, 'This coupon has expired', 400);
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse(res, 'Coupon usage limit has been exceeded', 400);
    }

    const orderSubtotal = Number(subtotal) || 0;
    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      return errorResponse(
        res,
        `Minimum order value of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon`,
        400
      );
    }

    const discountAmount = coupon.calculateDiscount(orderSubtotal);

    successResponse(
      res,
      {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        description: coupon.description,
      },
      'Coupon applied successfully! 🎉'
    );
  } catch (error) { next(error); }
};
