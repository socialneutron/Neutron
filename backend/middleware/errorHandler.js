/**
 * middleware/errorHandler.js
 * Centralised error-handling middleware (must have 4 arguments for Express to recognise it).
 * Catches ApiErrors, Mongoose validation/cast errors, JWT errors, and unexpected bugs.
 * Always returns a consistent JSON shape.
 *
 * Response shape:
 * {
 *   success: false,
 *   message: "Human-readable description",
 *   errors: [],          // Validation field errors (optional)
 *   stack: "..."         // Stack trace in development only
 * }
 */

const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || [];

  // ── Mongoose CastError (invalid ObjectId in URL param) ─────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose ValidationError (schema-level validation failed) ───
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message    = 'Validation failed';
    errors     = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  // ── MongoDB duplicate key (E11000) ──────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    message    = `${field} '${value}' is already taken.`;
  }

  // ── JWT errors ──────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token has expired.';
  }

  // ── Multer / payload-too-large ──────────────────────────────────
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message    = 'Request entity too large.';
  }

  // ── Log unexpected (non-operational) errors ─────────────────────
  if (!err.isOperational) {
    console.error('💥  Unexpected error:', err);
  }

  // ── Send response ────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    errors:  errors.length ? errors : undefined,
    // Include stack only in development — never expose in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler — placed AFTER all routes.
 * Turns any unmatched request into a clean ApiError.
 */
const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
