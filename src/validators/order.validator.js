import Joi from 'joi';

export const createOrderValidator = {
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      }).unknown(true)
    ).min(1).required(),
    shippingAddress: Joi.object({
      fullName: Joi.string().trim().required(),
      addressLine: Joi.string().trim().allow('').optional(),
      landmark: Joi.string().trim().allow('').optional(),
      city: Joi.string().trim().allow('').optional(),
      state: Joi.string().trim().allow('').optional(),
      pinCode: Joi.string().trim().allow('').optional(),
      phone: Joi.string().trim().required(),
    }).required(),
    deliveryMode: Joi.string().valid('express', 'standard', 'pickup').default('standard'),
    giftPackaging: Joi.boolean().default(false),
    giftMessage: Joi.string().max(500).allow('').optional(),
    paymentMethod: Joi.string().allow('').optional(),
    couponCode: Joi.string().trim().uppercase().allow('').optional(),
  }),
};

export const updateOrderStatusValidator = {
  body: Joi.object({
    status: Joi.string().valid(
      'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'
    ).required().messages({
      'any.only': 'Status must be one of [CONFIRMED, PACKING, SHIPPING, DELIVERED, CANCELLED]'
    }),
    location: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
    trackingNumber: Joi.string().allow('').optional(),
    courier: Joi.string().allow('').optional(),
  }),
};
