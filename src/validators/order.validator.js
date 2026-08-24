import Joi from 'joi';

export const createOrderValidator = {
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
    shippingAddress: Joi.object({
      fullName: Joi.string().trim().required(),
      addressLine: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      pinCode: Joi.string().trim().required(),
      phone: Joi.string().trim().required(),
    }).required(),
    deliveryMode: Joi.string().valid('express', 'standard').default('standard'),
    giftPackaging: Joi.boolean().default(false),
    giftMessage: Joi.string().max(500).allow('').optional(),
    paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'cod').required(),
    couponCode: Joi.string().trim().uppercase().allow('').optional(),
  }),
};

export const updateOrderStatusValidator = {
  body: Joi.object({
    status: Joi.string().valid(
      'PROCESSING', 'CONFIRMED', 'SHIPPED', 'IN TRANSIT',
      'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'
    ).required(),
    location: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
    trackingNumber: Joi.string().allow('').optional(),
    courier: Joi.string().allow('').optional(),
  }),
};
