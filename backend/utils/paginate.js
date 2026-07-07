/**
 * utils/paginate.js
 * Pagination helpers for consistent cursor/page-based APIs.
 *
 * Two strategies:
 *   1. Page-based  (page + limit) — simple, used for feeds
 *   2. Cursor-based (before/after ID) — used for real-time message history
 */

/**
 * Parse page-based pagination parameters from query string.
 * Clamps values to sane ranges.
 *
 * @param {object} query      - req.query
 * @param {number} [maxLimit] - Maximum allowed limit (default 50)
 * @returns {{ page, limit, skip }}
 */
const parsePagination = (query, maxLimit = 50) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build a standard paginated response envelope.
 *
 * @param {Array}  docs       - Array of result documents
 * @param {number} total      - Total count of matching documents
 * @param {number} page       - Current page
 * @param {number} limit      - Items per page
 * @returns {object}          - Paginated response object
 */
const paginatedResponse = (docs, total, page, limit) => ({
  docs,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

module.exports = { parsePagination, paginatedResponse };
