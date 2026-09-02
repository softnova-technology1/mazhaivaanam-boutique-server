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
      storeName: config.storeName,
      email: config.email,
      phone: config.phone,
      whatsapp: config.whatsapp,
      address: config.address,
      facebookUrl: config.facebookUrl,
      instagramUrl: config.instagramUrl,
      youtubeUrl: config.youtubeUrl,
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
    const { 
      storeName, email, phone, whatsapp, address, 
      facebookUrl, instagramUrl, youtubeUrl,
      convenienceFee, giftWrapPrice 
    } = req.body;

    let config = await StoreConfig.findOne({ key: 'main' });
    if (!config) config = new StoreConfig({ key: 'main' });

    if (storeName !== undefined) config.storeName = storeName;
    if (email !== undefined) config.email = email;
    if (phone !== undefined) config.phone = phone;
    if (whatsapp !== undefined) config.whatsapp = whatsapp;
    if (address !== undefined) config.address = address;
    
    if (facebookUrl !== undefined) config.facebookUrl = facebookUrl;
    if (instagramUrl !== undefined) config.instagramUrl = instagramUrl;
    if (youtubeUrl !== undefined) config.youtubeUrl = youtubeUrl;

    if (convenienceFee !== undefined) config.convenienceFee = convenienceFee;
    if (giftWrapPrice  !== undefined) config.giftWrapPrice  = giftWrapPrice;

    await config.save();
    successResponse(res, config, 'Store settings updated successfully');
  } catch (error) {
    next(error);
  }
};
