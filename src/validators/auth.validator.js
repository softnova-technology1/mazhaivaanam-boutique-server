import Joi from 'joi';

export const registerValidator = {
  body: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().max(50).allow('').optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().allow('').optional(),
    password: Joi.string().min(6).max(128).required(),
  }),
};

export const loginValidator = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const updateProfileValidator = {
  body: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).optional(),
    lastName: Joi.string().trim().max(50).allow('').optional(),
    phone: Joi.string().trim().allow('').optional(),
    birthday: Joi.date().allow(null).optional(),
    anniversary: Joi.date().allow(null).optional(),
  }),
};

export const changePasswordValidator = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),
};

export const forgotPasswordValidator = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

export const resetPasswordValidator = {
  body: Joi.object({
    password: Joi.string().min(6).max(128).required(),
  }),
};
