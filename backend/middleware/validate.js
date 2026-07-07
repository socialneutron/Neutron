/**
 * middleware/validate.js
 * express-validator request validation chains.
 * Each exported array is [validationRules..., handleValidationErrors].
 *
 * Usage in routes:
 *   router.post('/register', validateRegister, authController.register);
 */

const { body, param, query, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs express-validator result check.
 * If errors exist, throws an ApiError with the full error list.
 */
const handleValidationErrors = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    throw new ApiError(422, 'Validation failed', errors);
  }
  next();
};

// ── Auth ─────────────────────────────────────────────────────────────

const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_\.]+$/).withMessage('Username may only contain letters, numbers, underscores, and dots.')
    .toLowerCase(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Display name must be at most 50 characters.'),

  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  handleValidationErrors,
];

const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),

  handleValidationErrors,
];

const validateResetPassword = [
  body('password')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain at least one number.'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match.');
      return true;
    }),

  handleValidationErrors,
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain at least one number.')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must differ from the current password.');
      }
      return true;
    }),

  handleValidationErrors,
];

// ── Posts ─────────────────────────────────────────────────────────────

const validateCreatePost = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 }).withMessage('Caption must be at most 2200 characters.'),

  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private']).withMessage('Invalid visibility value.'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location must be at most 100 characters.'),

  handleValidationErrors,
];

const validateUpdatePost = [
  param('id').isMongoId().withMessage('Invalid post ID.'),

  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 }).withMessage('Caption must be at most 2200 characters.'),

  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private']).withMessage('Invalid visibility value.'),

  handleValidationErrors,
];

// ── Comments ──────────────────────────────────────────────────────────

const validateCreateComment = [
  param('postId').isMongoId().withMessage('Invalid post ID.'),

  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required.')
    .isLength({ max: 1000 }).withMessage('Comment must be at most 1000 characters.'),

  handleValidationErrors,
];

// ── Messages ──────────────────────────────────────────────────────────

const validateSendMessage = [
  body('receiverId').isMongoId().withMessage('Invalid receiver ID.'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Message must be at most 2000 characters.'),

  handleValidationErrors,
];

// ── Profile ───────────────────────────────────────────────────────────

const validateUpdateProfile = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Display name must be at most 50 characters.'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Bio must be at most 150 characters.'),

  body('website')
    .optional()
    .trim()
    .isURL({ require_protocol: true }).withMessage('Website must be a valid URL.'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location must be at most 100 characters.'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_\.]+$/).withMessage('Invalid username characters.')
    .toLowerCase(),

  handleValidationErrors,
];

// ── Search ────────────────────────────────────────────────────────────

const validateSearch = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query (q) is required.')
    .isLength({ min: 1, max: 100 }).withMessage('Query must be 1–100 characters.'),

  query('type')
    .optional()
    .isIn(['users', 'posts', 'hashtags', 'all']).withMessage('Invalid search type.'),

  handleValidationErrors,
];

// ── MongoId param ─────────────────────────────────────────────────────

const validateMongoId = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}.`),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateCreatePost,
  validateUpdatePost,
  validateCreateComment,
  validateSendMessage,
  validateUpdateProfile,
  validateSearch,
  validateMongoId,
};
