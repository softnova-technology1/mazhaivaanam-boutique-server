import mongoose from 'mongoose';
import Address from '../models/Address.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    successResponse(res, addresses);
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  try {
    const state = (req.body.state || req.body.stateName || '').trim();
    const addressData = {
      ...req.body,
      ...(state ? { state } : {})
    };

    // If this is set as default, unset others
    if (addressData.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    // If this is the first address, make it default
    const count = await Address.countDocuments({ user: req.user._id });
    if (count === 0) addressData.isDefault = true;

    const address = await Address.create({ ...addressData, user: req.user._id });
    successResponse(res, address, 'Address added', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 'Valid address ID is required', 400);
    }
    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) return errorResponse(res, 'Address not found', 404);

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const updateData = { ...req.body };
    if (req.body.stateName && !req.body.state) {
      updateData.state = req.body.stateName;
    }

    Object.assign(address, updateData);
    await address.save();
    successResponse(res, address, 'Address updated');
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 'Valid address ID is required', 400);
    }
    const address = await Address.findOneAndDelete({ _id: addressId, user: req.user._id });
    if (!address) return errorResponse(res, 'Address not found', 404);

    // If deleted address was default, make the first remaining address default
    if (address.isDefault) {
      const first = await Address.findOne({ user: req.user._id });
      if (first) {
        first.isDefault = true;
        await first.save();
      }
    }

    successResponse(res, null, 'Address deleted');
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 'Valid address ID is required', 400);
    }
    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    const address = await Address.findOneAndUpdate(
      { _id: addressId, user: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!address) return errorResponse(res, 'Address not found', 404);

    successResponse(res, address, 'Default address set');
  } catch (error) {
    next(error);
  }
};
