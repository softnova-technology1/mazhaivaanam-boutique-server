import StoreConfig from '../models/StoreConfig.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * GET /api/store/config
 * Public — Client fetch பண்ண (fees only)
 */
export const getStoreConfig = async (req, res, next) => {
  try {
    const config = await StoreConfig.getConfig();
    successResponse(res, {
      convenienceFee: config.convenienceFee,
      giftWrapPrice:  config.giftWrapPrice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/store/config
 * Admin only — Fee settings update
 */
export const updateStoreConfig = async (req, res, next) => {
  try {
    const { convenienceFee, giftWrapPrice } = req.body;

    let config = await StoreConfig.findOne({ key: 'main' });
    if (!config) config = new StoreConfig({ key: 'main' });

    if (convenienceFee !== undefined) config.convenienceFee = convenienceFee;
    if (giftWrapPrice  !== undefined) config.giftWrapPrice  = giftWrapPrice;

    await config.save();
    successResponse(res, config, 'Store settings updated successfully');
  } catch (error) {
    next(error);
  }
};
