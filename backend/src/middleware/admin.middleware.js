import { errorResponse } from '../utils/apiResponse.js';

/**
 * Admin role check — must be used AFTER protect middleware
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return errorResponse(res, 'Access denied — admin privileges required', 403);
};
