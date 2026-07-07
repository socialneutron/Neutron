/**
 * utils/ApiResponse.js
 * Standardised JSON response helper.
 * All controllers should use this to ensure consistent response shape.
 *
 * Success shape:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "...",
 *   data: { ... }
 * }
 */

class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {*}      data       - Response payload (object, array, null)
   * @param {string} message    - Human-readable status message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data       = data;
    this.message    = message;
    this.success    = statusCode < 400;
  }
}

module.exports = ApiResponse;
