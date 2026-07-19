/**
 * routes/events.js
 * Event tracking: records user engagement actions for feed ranking.
 */

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../middleware/auth');
const interestService = require('../services/interest.service');
const viewTracker = require('../services/viewTracker.service');

router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const { post_id, event_type, metadata } = req.body;

  if (!post_id || !event_type) {
    return res.status(400).json({
      success: false,
      message: 'post_id and event_type are required.',
    });
  }

  if (event_type === 'view') {
    await viewTracker.recordView(req.user._id, post_id, metadata?.duration || 0);
  }

  const result = await interestService.recordAction(
    req.user._id,
    post_id,
    event_type,
    metadata || {},
  );

  res.json({ success: true, ...result });
}));

module.exports = router;
