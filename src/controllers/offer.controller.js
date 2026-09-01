import LimitedOfferConfig from '../models/LimitedOfferConfig.js';
import SpinRecord from '../models/SpinRecord.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import OfferSection from '../models/OfferSection.js';
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


// ─────────────────────────────────────────────────────────────────────────────
// TIMED OFFER PRODUCTS — Public & Admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/limited-offer/timed-products
 * Public — returns active limited-offer products grouped by section.
 * Only includes products where isActive=true AND startDate <= now (if set).
 * Expired products (endDate < now) are still returned so the frontend
 * can render the "Offer Ended" overlay — the frontend hides them from catalog.
 */
export const getTimedOfferProducts = async (req, res, next) => {
  try {
    const now = new Date();

    const products = await Product.find({
      isActive: true,
      'limitedOfferEntry.isActive': true,
      $or: [
        { 'limitedOfferEntry.startDate': null },
        { 'limitedOfferEntry.startDate': { $lte: now } },
      ],
    })
      .select('name price mrpPrice images tag discount discountActive limitedOfferEntry slug _id')
      .lean();

    const section1 = products.filter(p => p.limitedOfferEntry.section === 1);
    const section2 = products.filter(p => p.limitedOfferEntry.section === 2);

    return successResponse(res, { section1, section2 }, 'Timed offer products loaded');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/limited-offer/products
 * Admin — list ALL products currently assigned to any limited offer section
 * (including expired ones so admin can review/edit/remove them).
 */
export const getLimitedOfferAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ 'limitedOfferEntry.isActive': true })
      .select('name price mrpPrice images tag limitedOfferEntry slug _id')
      .lean();

    return successResponse(res, products, 'Admin limited offer products loaded');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/limited-offer/products/:productId
 * Admin — assign a product to a limited offer section with timing.
 * Body: { section, endDate, offerLabel?, startDate? }
 */
export const assignToLimitedOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { section = 1, endDate, offerLabel = '', startDate = null } = req.body;

    if (!endDate) {
      return errorResponse(res, 'endDate is required to assign a product to a limited offer', 400);
    }

    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return errorResponse(res, 'endDate is not a valid date', 400);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          limitedOfferEntry: {
            isActive: true,
            section: Number(section),
            offerLabel,
            startDate: startDate ? new Date(startDate) : null,
            endDate: end,
          },
        },
      },
      { new: true, select: 'name price mrpPrice images tag limitedOfferEntry slug _id' }
    );

    if (!product) return errorResponse(res, 'Product not found', 404);

    return successResponse(res, product, 'Product assigned to limited offer');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/limited-offer/products/:productId
 * Admin — update timing/label/section for an already-assigned product.
 */
export const updateLimitedOfferProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { section, endDate, offerLabel, startDate } = req.body;

    const update = {};
    if (section !== undefined) update['limitedOfferEntry.section'] = Number(section);
    if (endDate !== undefined) update['limitedOfferEntry.endDate'] = new Date(endDate);
    if (offerLabel !== undefined) update['limitedOfferEntry.offerLabel'] = offerLabel;
    if (startDate !== undefined) update['limitedOfferEntry.startDate'] = startDate ? new Date(startDate) : null;

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: update },
      { new: true, select: 'name price mrpPrice images tag limitedOfferEntry slug _id' }
    );

    if (!product) return errorResponse(res, 'Product not found', 404);

    return successResponse(res, product, 'Limited offer entry updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/limited-offer/products/:productId
 * Admin — remove a product from limited offer (sets isActive=false).
 * Product remains in catalog and DB — just unpinned from limited offer page.
 */
export const removeFromLimitedOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          'limitedOfferEntry.isActive': false,
          'limitedOfferEntry.endDate': null,
        },
      },
      { new: true, select: 'name limitedOfferEntry _id' }
    );

    if (!product) return errorResponse(res, 'Product not found', 404);

    return successResponse(res, product, 'Product removed from limited offer');
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// OFFER SECTIONS — Section-level timed offer management
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/limited-offer/sections   (Public)
 * Returns active offer sections with their products populated.
 * Only includes sections where isActive=true AND startDate <= now.
 * Sections with expired endDate are still returned so frontend can show
 * "Offer Ended" overlay — frontend decides how to render them.
 */
export const getOfferSections = async (req, res, next) => {
  try {
    const now = new Date();
    const sections = await OfferSection.find({
      isActive: true,
      $or: [
        { startDate: null },
        { startDate: { $lte: now } },
      ],
    })
      .populate({
        path: 'productIds',
        match: { isActive: true },
        select: 'name price mrpPrice images tag discount discountActive slug _id limitedOfferEntry',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Group by slot
    const slot1 = sections.filter(s => s.slot === 1);
    const slot2 = sections.filter(s => s.slot === 2);

    return successResponse(res, { slot1, slot2 }, 'Offer sections loaded');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/limited-offer/sections   (Admin)
 * Returns ALL offer sections (active + inactive + expired) for admin management.
 */
export const getAdminOfferSections = async (req, res, next) => {
  try {
    const sections = await OfferSection.find()
      .populate({
        path: 'productIds',
        select: 'name price images tag _id',
      })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, sections, 'Admin offer sections loaded');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/limited-offer/sections   (Admin)
 * Create a new offer section.
 * Body: { name, description?, slot, startDate?, endDate }
 */
export const createOfferSection = async (req, res, next) => {
  try {
    const { name, description = '', slot, startDate, endDate } = req.body;

    if (!name || !slot || !endDate) {
      return errorResponse(res, 'name, slot, and endDate are required', 400);
    }
    if (![1, 2].includes(Number(slot))) {
      return errorResponse(res, 'slot must be 1 (Grid) or 2 (Carousel)', 400);
    }

    const section = await OfferSection.create({
      name,
      description,
      slot: Number(slot),
      startDate: startDate ? new Date(startDate) : null,
      endDate: new Date(endDate),
      isActive: true,
      productIds: [],
    });

    return successResponse(res, section, 'Offer section created');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/limited-offer/sections/:sectionId   (Admin)
 * Update section name/description/dates/slot/isActive.
 */
export const updateOfferSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { name, description, slot, startDate, endDate, isActive } = req.body;

    const update = {};
    if (name !== undefined)        update.name = name;
    if (description !== undefined) update.description = description;
    if (slot !== undefined)        update.slot = Number(slot);
    if (endDate !== undefined)     update.endDate = new Date(endDate);
    if (startDate !== undefined)   update.startDate = startDate ? new Date(startDate) : null;
    if (isActive !== undefined)    update.isActive = isActive;

    const section = await OfferSection.findByIdAndUpdate(sectionId, { $set: update }, { new: true }).populate({ path: 'productIds', select: 'name price images tag _id' });
    if (!section) return errorResponse(res, 'Section not found', 404);

    return successResponse(res, section, 'Offer section updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/limited-offer/sections/:sectionId   (Admin)
 * Permanently deletes an offer section (products themselves are NOT deleted).
 */
export const deleteOfferSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const section = await OfferSection.findByIdAndDelete(sectionId);
    if (!section) return errorResponse(res, 'Section not found', 404);

    return successResponse(res, null, 'Offer section deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/limited-offer/sections/:sectionId/products   (Admin)
 * Add one or more products to a section.
 * Body: { productId }
 */
export const addProductToSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { productId } = req.body;

    if (!productId) return errorResponse(res, 'productId is required', 400);

    const section = await OfferSection.findByIdAndUpdate(
      sectionId,
      { $addToSet: { productIds: productId } },   // $addToSet prevents duplicates
      { new: true }
    ).populate({ path: 'productIds', select: 'name price images tag _id' });

    if (!section) return errorResponse(res, 'Section not found', 404);

    return successResponse(res, section, 'Product added to section');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/limited-offer/sections/:sectionId/products/:productId   (Admin)
 * Remove a product from a section.
 */
export const removeProductFromSection = async (req, res, next) => {
  try {
    const { sectionId, productId } = req.params;

    const section = await OfferSection.findByIdAndUpdate(
      sectionId,
      { $pull: { productIds: productId } },
      { new: true }
    ).populate({ path: 'productIds', select: 'name price images tag _id' });

    if (!section) return errorResponse(res, 'Section not found', 404);

    return successResponse(res, section, 'Product removed from section');
  } catch (error) {
    next(error);
  }
};
