import Joi from 'joi';

export const createProductValidator = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150).required(),
    description: Joi.string().trim().max(2000).required(),
    category: Joi.string().required(), // ObjectId
    collection: Joi.string().allow(null, '').optional(),
    fabric: Joi.string().required(),
    price: Joi.number().min(0).required(),
    mrpPrice: Joi.number().min(0).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().required(),
        publicId: Joi.string().allow('', null).optional(),
      })
    ).optional(),
    stock: Joi.number().min(0).optional(),
    tag: Joi.string().valid('BESTSELLER', 'NEW ARRIVAL', 'LIMITED EDITION', 'FESTIVAL CHOICE', '', null).allow('', null).optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    isScheduled: Joi.boolean().optional(),
    scheduledAt: Joi.date().allow(null, '').optional(),
    isPreorder: Joi.boolean().optional(),
    preorderDeposit: Joi.number().min(0).optional(),
    preorderProgress: Joi.number().min(0).max(100).optional(),
    preorderWeaver: Joi.string().allow('').optional(),
    preorderEstimatedDays: Joi.number().min(0).optional(),
    preorderDiscount: Joi.string().allow('').optional(),
    specs: Joi.object({
      fabricType: Joi.string().allow('').optional(),
      weave: Joi.string().allow('').optional(),
      zari: Joi.string().allow('').optional(),
      origin: Joi.string().allow('').optional(),
      weight: Joi.string().allow('').optional(),
      blousePiece: Joi.string().allow('').optional(),
      length: Joi.string().allow('').optional(),
      width: Joi.string().allow('').optional(),
      washCare: Joi.string().allow('').optional(),
    }).optional(),
    weight: Joi.string().allow('').optional(),
    pattern: Joi.string().allow('').optional(),
    pallu: Joi.string().allow('').optional(),
    sareeLength: Joi.string().allow('').optional(),
    blouseLength: Joi.string().allow('').optional(),
    blouse: Joi.string().allow('').optional(),
    height: Joi.string().allow('').optional(),
    washCare: Joi.string().allow('').optional(),
    returnPolicy: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
  }),
};

export const updateProductValidator = {
  body: createProductValidator.body.fork(
    ['name', 'description', 'category', 'fabric', 'price'],
    (schema) => schema.optional()
  ),
};
