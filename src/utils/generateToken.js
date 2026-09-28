import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token (short-lived)
 */
export const generateAccessToken = (userId, role = 'customer') => {
  const expiresIn = role === 'admin' 
    ? (process.env.ADMIN_JWT_EXPIRE || '15d') 
    : (process.env.CLIENT_JWT_EXPIRE || '30d');
  
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Generate JWT refresh token (long-lived)
 */
export const generateRefreshToken = (userId, role = 'customer') => {
  const expiresIn = role === 'admin'
    ? (process.env.ADMIN_JWT_REFRESH_EXPIRE || '15d')
    : (process.env.CLIENT_JWT_REFRESH_EXPIRE || '60d');

  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn,
  });
};

/**
 * Generate both tokens
 */
export const generateTokenPair = (userId, role = 'customer') => {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId, role),
  };
};
