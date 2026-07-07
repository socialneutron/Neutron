/**
 * middleware/auth.js
 * JWT verification middleware.
 *
 * verifyToken    — requires a valid access token (cookie OR Authorization header)
 * optionalAuth   — attaches user if token present, continues without error if not
 * requireAdmin   — extends verifyToken, rejects non-admin users
 */

const jwt          = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const User         = require('../models/User.model');

/**
 * Extract token from:
 *  1. HTTP-only cookie  (preferred — XSS-safe)
 *  2. Authorization: Bearer <token> header (for mobile / Postman)
 */
const extractToken = (req) =>
  req.cookies?.accessToken ||
  (req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null);

/**
 * verifyToken
 * Validates the access JWT and attaches req.user (lean projection).
 * Rejects with 401 if token is missing/invalid/expired.
 */
const verifyToken = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired. Please refresh your session.');
    }
    throw new ApiError(401, 'Invalid access token.');
  }

  // Fetch fresh user from DB (ensures banned accounts are rejected immediately)
  const user = await User.findById(decoded.id)
    .select('-password -refreshToken -emailVerifyToken -passwordResetToken')
    .lean();

  if (!user) {
    throw new ApiError(401, 'User no longer exists.');
  }

  if (user.isBanned) {
    throw new ApiError(403, 'Your account has been suspended. Contact support.');
  }

  req.user = user; // Available to all downstream handlers
  next();
});

/**
 * optionalAuth
 * Same as verifyToken but non-blocking — no error if token missing.
 * Useful for public endpoints that can show extra data to logged-in users.
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user    = await User.findById(decoded.id)
      .select('-password -refreshToken -emailVerifyToken -passwordResetToken')
      .lean();
    if (user && !user.isBanned) req.user = user;
  } catch (_) {
    // Silently ignore invalid/expired token
  }

  next();
});

/**
 * requireAdmin
 * Must be used AFTER verifyToken.
 * Rejects with 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Admin access required.');
  }
  next();
};

module.exports = { verifyToken, optionalAuth, requireAdmin };
