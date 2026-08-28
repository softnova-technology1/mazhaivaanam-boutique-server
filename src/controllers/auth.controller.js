import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateTokenPair } from '../utils/generateToken.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * POST /api/auth/register
 * Register a new customer
 */
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user);

    successResponse(
      res,
      {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if account is active
    if (user.isActive === false) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    successResponse(res, {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    // Find user with matching refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new token pair
    const tokens = generateTokenPair(user._id);

    // Update stored refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    successResponse(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getMe = async (req, res) => {
  successResponse(res, { user: req.user });
};

/**
 * PUT /api/auth/me
 * Update current user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, birthday, anniversary } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (birthday !== undefined) user.birthday = birthday;
    if (anniversary !== undefined) user.anniversary = anniversary;

    await user.save();

    successResponse(res, { user: user.toJSON() }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 * Change password for logged-in user
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    // Generate fresh tokens
    const tokens = generateTokenPair(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    successResponse(res, tokens, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      // Don't reveal if email exists or not
      return successResponse(res, null, 'If an account with that email exists, a reset link has been sent.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send email
    await sendPasswordResetEmail(user, resetToken);

    successResponse(res, null, 'If an account with that email exists, a reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Reset password using token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate fresh tokens
    const tokens = generateTokenPair(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    successResponse(res, tokens, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clear refresh token
 */
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
