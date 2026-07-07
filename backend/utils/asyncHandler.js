/**
 * utils/asyncHandler.js
 * Higher-order function that wraps async route handlers,
 * forwarding any thrown errors to Express's next(err) middleware.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     // No try/catch needed
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
