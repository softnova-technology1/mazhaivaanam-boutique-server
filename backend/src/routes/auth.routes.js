import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', validate(forgotPasswordValidator), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidator), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, validate(updateProfileValidator), updateProfile);
router.put('/change-password', protect, validate(changePasswordValidator), changePassword);
router.post('/logout', protect, logout);

export default router;
