/**
 * services/token.service.js
 * JWT access token + refresh token utilities.
 *
 * Access token  — short-lived (15 min), stored in HTTP-only cookie
 * Refresh token — long-lived  (7 days), stored in HTTP-only cookie + DB
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

const ACCESS_COOKIE  = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

/** Base cookie options — always HTTP-only to prevent XSS */
const cookieOpts = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

/**
 * Generate a signed JWT access token.
 * @param {object} payload  - Must include { id, role }
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

/**
 * Generate a signed JWT refresh token.
 * @param {object} payload  - Must include { id }
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

/**
 * Generate a one-time token for email verification / password reset.
 * @param {object} payload   - { id, purpose }
 * @param {string} expiresIn - e.g. '24h' or '1h'
 */
const signEmailToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn });

/**
 * Issue both tokens for a user and set them as HTTP-only cookies.
 * Also persists the refresh token hash in the DB.
 *
 * @param {object} user - Mongoose user document (must have _id, role)
 * @param {object} res  - Express response object
 * @returns {{ accessToken, refreshToken }}
 */
const issueTokens = async (user, res) => {
  const payload = { id: user._id.toString(), role: user.role };

  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user._id.toString() });

  // Persist refresh token in DB (allows server-side revocation)
  await User.findByIdAndUpdate(user._id, { refreshToken });

  // Set cookies
  const accessExpMs  = 15 * 60 * 1000;          // 15 minutes
  const refreshExpMs = 7  * 24 * 60 * 60 * 1000; // 7 days

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieOpts,
    maxAge: accessExpMs,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOpts,
    maxAge: refreshExpMs,
    path:   '/api/auth/refresh', // Refresh cookie only sent to this path
  });

  return { accessToken, refreshToken };
};

/**
 * Clear both auth cookies.
 * @param {object} res - Express response object
 */
const clearTokenCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE,  { ...cookieOpts, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOpts, path: '/api/auth/refresh' });
};

/**
 * Verify a refresh token and rotate both tokens.
 * Throws a JWT error if the token is invalid/expired.
 *
 * @param {string} refreshToken - Raw refresh token string
 * @param {object} res          - Express response object
 * @returns {{ user, accessToken, newRefreshToken }}
 */
const rotateRefreshToken = async (refreshToken, res) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new Error('Refresh token reuse detected or session expired.');
  }

  const tokens = await issueTokens(user, res);
  return { user, ...tokens };
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  issueTokens,
  clearTokenCookies,
  rotateRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
};
