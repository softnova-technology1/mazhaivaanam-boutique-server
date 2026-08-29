import LimitedOfferConfig from '../models/LimitedOfferConfig.js';
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
