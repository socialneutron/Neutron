/**
 * routes/explore.js
 * Explore endpoints: trending, tags, suggested users, search.
 */

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { optionalAuth } = require('../middleware/auth');
const feedRanking = require('../services/feedRanking.service');

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const [trending, tags, suggestedUsers] = await Promise.all([
    feedRanking.getTrendingFeed(8),
    feedRanking.getTrendingTags(15),
    userId ? feedRanking.getSuggestedUsers(userId, 10) : [],
  ]);

  res.json({
    success: true,
    trending,
    tags,
    suggested_users: suggestedUsers,
  });
}));

router.get('/trending', asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const posts = await feedRanking.getTrendingFeed(parseInt(limit, 10) || 10);
  res.json({ success: true, posts });
}));

router.get('/tags', asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const tags = await feedRanking.getTrendingTags(parseInt(limit, 10) || 20);
  res.json({ success: true, tags });
}));

router.get('/suggested', optionalAuth, asyncHandler(async (req, res) => {
  const { limit } = req.query;
  if (!req.user) {
    return res.json({ success: true, users: [] });
  }
  const users = await feedRanking.getSuggestedUsers(
    req.user._id,
    parseInt(limit, 10) || 20,
  );
  res.json({ success: true, users });
}));

router.get('/search', optionalAuth, asyncHandler(async (req, res) => {
  const { q, type, limit } = req.query;
  if (!q) {
    return res.json({ success: true, posts: [], users: [] });
  }
  const results = await feedRanking.searchFeed(
    q,
    req.user?._id,
    type,
    parseInt(limit, 10) || 20,
  );
  res.json({ success: true, ...results });
}));

module.exports = router;
