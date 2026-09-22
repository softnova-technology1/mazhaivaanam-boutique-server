import Joi from 'joi';

export const createAddressValidator = {
  body: Joi.object({
    fullName: Joi.string().trim().required(),
    addressLine: Joi.string().trim().required(),
    landmark: Joi.string().trim().allow('').optional(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().allow('').optional(),
    stateName: Joi.string().trim().allow('').optional(),
    pinCode: Joi.string().trim().required(),
    country: Joi.string().trim().default('India'),
    phone: Joi.string().trim().required(),
    isDefault: Joi.boolean().default(false),
  }).unknown(true),
};

export const updateAddressValidator = {
  body: Joi.object({
    fullName: Joi.string().trim().optional(),
    addressLine: Joi.string().trim().optional(),
    landmark: Joi.string().trim().allow('').optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().allow('').optional(),
    stateName: Joi.string().trim().allow('').optional(),
    pinCode: Joi.string().trim().optional(),
    country: Joi.string().trim().optional(),
    phone: Joi.string().trim().optional(),
    isDefault: Joi.boolean().optional(),
  }).unknown(true),
};
