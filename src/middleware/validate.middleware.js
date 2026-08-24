import { errorResponse } from '../utils/apiResponse.js';

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema with optional body, params, query
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = {};

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        error.details.forEach((detail) => {
          errors[detail.path.join('.')] = detail.message.replace(/"/g, '');
        });
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        error.details.forEach((detail) => {
          errors[detail.path.join('.')] = detail.message.replace(/"/g, '');
        });
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        error.details.forEach((detail) => {
          errors[detail.path.join('.')] = detail.message.replace(/"/g, '');
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    next();
  };
};

export default validate;
