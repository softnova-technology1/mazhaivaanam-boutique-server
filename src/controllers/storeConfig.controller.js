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
      announcementText1: config.announcementText1 || config.announcementText,
      announcementText2: config.announcementText2 || config.announcementText,
      announcementText3: config.announcementText3 || config.announcementText,
      announcementText: config.announcementText || config.announcementText1,
      announcementBgColor: config.announcementBgColor,
      announcementTextColor: config.announcementTextColor,
      announcementEnabled: config.announcementEnabled,
      convenienceFee: config.convenienceFee,
      giftWrapPrice:  config.giftWrapPrice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/store/config
 * Admin only — Fee & Announcement Bar settings update
 */
export const updateStoreConfig = async (req, res, next) => {
  try {
    const { 
      storeName, email, phone, whatsapp, address, 
      facebookUrl, instagramUrl, youtubeUrl,
      announcementText1, announcementText2, announcementText3, announcementText, announcementBgColor, announcementTextColor, announcementEnabled,
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

    if (announcementText1 !== undefined) config.announcementText1 = announcementText1;
    if (announcementText2 !== undefined) config.announcementText2 = announcementText2;
    if (announcementText3 !== undefined) config.announcementText3 = announcementText3;
    if (announcementText !== undefined) config.announcementText = announcementText;
    if (announcementBgColor !== undefined) config.announcementBgColor = announcementBgColor;
    if (announcementTextColor !== undefined) config.announcementTextColor = announcementTextColor;
    if (announcementEnabled !== undefined) config.announcementEnabled = Boolean(announcementEnabled);

    if (convenienceFee !== undefined) config.convenienceFee = convenienceFee;
    if (giftWrapPrice  !== undefined) config.giftWrapPrice  = giftWrapPrice;

    await config.save();
    successResponse(res, config, 'Store settings updated successfully');
  } catch (error) {
    next(error);
  }
};
