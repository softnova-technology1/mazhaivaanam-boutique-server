import LimitedOfferConfig from '../models/LimitedOfferConfig.js';
import SpinRecord from '../models/SpinRecord.js';
import Coupon from '../models/Coupon.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * GET /api/limited-offer/config & GET /api/admin/limited-offer/config
 * Fetch live Limited Offer page configuration
 */
export const getOfferConfig = async (req, res, next) => {
  try {
    let config = await LimitedOfferConfig.findOne().lean();

    if (!config) {
      config = await LimitedOfferConfig.create({});
    }

    return successResponse(res, config, 'Limited offer configuration loaded');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/limited-offer
 * Update Limited Offer page configuration
 */
export const updateOfferConfig = async (req, res, next) => {
  try {
    const config = await LimitedOfferConfig.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return successResponse(res, config, 'Limited Offer page configuration updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/limited-offer/spin
 * Protected — user must be logged in
 * 1 spin per user per day. If prize is a discount, generates a real Coupon.
 */
export const spinWheel = async (req, res, next) => {
  try {
    // 1. Load prizes from DB config
    const config = await LimitedOfferConfig.findOne().lean();
    const prizes = config?.spinningWheelSection?.prizes?.length === 6
      ? config.spinningWheelSection.prizes
      : ['Premium Saree', '10% Discount', 'Free Styling', 'Surprise Box', 'Artisan Blouse', 'Free Shipping'];

    // 2. One spin per user per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const alreadySpun = await SpinRecord.findOne({
      user: req.user._id,
      createdAt: { $gte: todayStart, $lt: tomorrowStart },
    });

    if (alreadySpun) {
      return errorResponse(
        res,
        `You have already spun today! Your prize was "${alreadySpun.prize}". Come back tomorrow 🎡`,
        429
      );
    }

    // 3. Pick a random prize
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const wonPrize = prizes[randomIndex];

    // 4. Generate a real coupon if prize is a discount
    let couponCode = null;
    const percentMatch = wonPrize.match(/(\d+)%/);
    const fixedMatch = wonPrize.match(/₹\s*(\d+)/);

    if (percentMatch || fixedMatch) {
      const code = `WHEEL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const discountType = percentMatch ? 'percentage' : 'fixed';
      const discountValue = percentMatch ? parseInt(percentMatch[1]) : parseInt(fixedMatch[1]);

      await Coupon.create({
        code,
        description: `Spinning Wheel Prize — ${wonPrize}`,
        type: discountType,
        value: discountValue,
        minOrderAmount: 0,
        maxDiscount: discountType === 'percentage' ? 2000 : null,
        usageLimit: 1,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
      });

      couponCode = code;
    }

    // 5. Save spin record
    await SpinRecord.create({
      user: req.user._id,
      prize: wonPrize,
      couponCode,
    });

    return successResponse(
      res,
      { prize: wonPrize, couponCode },
      'Congratulations! 🎉'
    );
  } catch (error) {
    next(error);
  }
};

