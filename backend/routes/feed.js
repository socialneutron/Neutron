/**
 * routes/feed.js
 * Feed endpoints: ranked "For You" feed and chronological "Following" feed.
 */

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../middleware/auth');
const feedRanking = require('../services/feedRanking.service');

router.get('/home', verifyToken, asyncHandler(async (req, res) => {
  const { cursor, limit } = req.query;
  const result = await feedRanking.getForYouFeed(
    req.user._id,
    cursor,
    parseInt(limit, 10) || 20,
  );
  res.json({ success: true, ...result });
}));

router.get('/following', verifyToken, asyncHandler(async (req, res) => {
  const { cursor, limit } = req.query;
  const result = await feedRanking.getFollowingFeed(
    req.user._id,
    cursor,
    parseInt(limit, 10) || 20,
  );
  res.json({ success: true, ...result });
}));

module.exports = router;
