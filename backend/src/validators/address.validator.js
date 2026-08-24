import Joi from 'joi';

export const createAddressValidator = {
  body: Joi.object({
    fullName: Joi.string().trim().required(),
    addressLine: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pinCode: Joi.string().trim().required(),
    country: Joi.string().trim().default('India'),
    phone: Joi.string().trim().required(),
    isDefault: Joi.boolean().default(false),
  }),
};

export const updateAddressValidator = {
  body: createAddressValidator.body.fork(
    ['fullName', 'addressLine', 'city', 'state', 'pinCode', 'phone'],
    (schema) => schema.optional()
  ),
};
