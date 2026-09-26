import Joi from 'joi';

export const createProductValidator = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150).optional(),
    shortDescription: Joi.string().allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    category: Joi.string().allow('', null).optional(),
    collection: Joi.string().allow(null, '').optional(),
    fabric: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).optional(),
    mrpPrice: Joi.number().min(0).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().allow('', null).optional(),
        publicId: Joi.string().allow('', null).optional(),
      })
    ).optional(),
    stock: Joi.number().min(0).optional(),
    tag: Joi.string().allow('', null).optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    isScheduled: Joi.boolean().optional(),
    scheduledAt: Joi.date().allow(null, '').optional(),
    isPreorder: Joi.boolean().optional(),
    preorderDeposit: Joi.number().min(0).optional(),
    preorderProgress: Joi.number().min(0).max(100).optional(),
    preorderWeaver: Joi.string().allow('').optional(),
    preorderEstimatedDays: Joi.string().allow('').optional(),
    preorderDiscount: Joi.string().allow('').optional(),
    specs: Joi.object({
      fabricType: Joi.string().allow('', null).optional(),
      weave: Joi.string().allow('', null).optional(),
      zari: Joi.string().allow('', null).optional(),
      origin: Joi.string().allow('', null).optional(),
      weight: Joi.string().allow('', null).optional(),
      blousePiece: Joi.string().allow('', null).optional(),
      length: Joi.string().allow('', null).optional(),
      width: Joi.string().allow('', null).optional(),
      washCare: Joi.string().allow('', null).optional(),
      height: Joi.string().allow('', null).optional(),
      sareeLength: Joi.string().allow('', null).optional(),
      blouseLength: Joi.string().allow('', null).optional(),
      pattern: Joi.string().allow('', null).optional(),
      pallu: Joi.string().allow('', null).optional(),
      blouse: Joi.string().allow('', null).optional(),
      returnPolicy: Joi.string().allow('', null).optional(),
      note: Joi.string().allow('', null).optional(),
    }).unknown(true).optional(),
    weight: Joi.string().allow('', null).optional(),
    pattern: Joi.string().allow('', null).optional(),
    border: Joi.string().allow('', null).optional(),
    pallu: Joi.string().allow('', null).optional(),
    sareeLength: Joi.string().allow('', null).optional(),
    blouseLength: Joi.string().allow('', null).optional(),
    blouse: Joi.string().allow('', null).optional(),
    height: Joi.string().allow('', null).optional(),
    washCare: Joi.string().allow('', null).optional(),
    returnPolicy: Joi.string().allow('', null).optional(),
    note: Joi.string().allow('', null).optional(),
    // SKU & Pattern — server-generated, but allowed in body
    sku:            Joi.string().allow('', null).optional(),
    patternCode:    Joi.string().allow('', null).optional(),
    patternSeq:     Joi.number().min(0).optional(),
    normalizedName: Joi.string().allow('', null).optional(),
  }).unknown(true),
};

export const updateProductValidator = {
  body: createProductValidator.body.fork(
    ['name', 'description', 'category', 'fabric', 'price'],
    (schema) => schema.optional()
  ),
};
