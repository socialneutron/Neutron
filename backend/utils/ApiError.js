/**
 * utils/ApiError.js
 * Custom error class that carries HTTP status + structured message.
 * Thrown by controllers; caught by the global error middleware.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 422, 500…)
   * @param {string} message    - Human-readable error description
   * @param {Array}  [errors]   - Validation error details array
   * @param {string} [stack]    - Optional custom stack trace
   */
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);

    this.statusCode = statusCode;
    this.message    = message;
    this.success    = false;
    this.errors     = errors;
    this.isOperational = true; // Distinguishes known errors from bugs

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
