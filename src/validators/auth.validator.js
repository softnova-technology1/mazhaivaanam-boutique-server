import Joi from 'joi';

export const registerValidator = {
  body: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().max(50).allow('').optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().allow('').optional(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long.',
        'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&# etc.).',
      }),
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
