const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const {
  signEmailToken,
  issueTokens,
  clearTokenCookies,
  rotateRefreshToken,
} = require('../services/token.service');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { username, displayName, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, existingUser.email === email
      ? 'Email already registered.'
      : 'Username already taken.');
  }

  const user = await User.create({ username, displayName, email, password });

  const tokens = await issueTokens(user, res);

  // Attempt to send verification email — don't block registration
  try {
    const verifyToken = signEmailToken(
      { id: user._id.toString(), purpose: 'verify' },
      '24h'
    );
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateModifiedOnly: true });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    await sendVerificationEmail(user, verifyUrl);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
  }

  res
    .status(201)
    .json(new ApiResponse(201, { user, ...tokens }, 'Registration successful.'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.isBanned) {
    throw new ApiError(403, 'Your account has been banned.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const tokens = await issueTokens(user, res);

  res
    .status(200)
    .json(new ApiResponse(200, { user, ...tokens }, 'Login successful.'));
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  clearTokenCookies(res);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Logged out successfully.'));
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token not found.');
  }

  const { user, accessToken, newRefreshToken } = await rotateRefreshToken(refreshToken, res);

  res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken, refreshToken: newRefreshToken }, 'Token refreshed.'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether the email exists
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If the email exists, a reset link has been sent.'));
  }

  const resetToken = signEmailToken(
    { id: user._id.toString(), purpose: 'reset' },
    '1h'
  );
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  await user.save({ validateModifiedOnly: true });

  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user, resetUrl);
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });
    throw new ApiError(500, 'Failed to send reset email. Please try again.');
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, 'If the email exists, a reset link has been sent.'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(400, 'Reset token is required.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) { // eslint-disable-line no-unused-vars
    throw new ApiError(400, 'Invalid or expired reset token.');
  }

  if (decoded.purpose !== 'reset') {
    throw new ApiError(400, 'Invalid token purpose.');
  }

  const user = await User.findById(decoded.id).select('+passwordResetToken +passwordResetExpires');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (
    !user.passwordResetToken ||
    user.passwordResetToken !== token ||
    user.passwordResetExpires < Date.now()
  ) {
    throw new ApiError(400, 'Invalid or expired reset token.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  clearTokenCookies(res);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Password reset successful.'));
});

const getMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, 'User fetched.'));
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
};
