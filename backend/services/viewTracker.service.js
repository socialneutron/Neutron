/**
 * services/viewTracker.service.js
 * Records view duration and dwell time for feed ranking signals.
 */

const PostView = require('../models/PostView.model');
const Post = require('../models/Post.model');

async function recordView(userId, postId, duration = 0) {
  const completed = duration >= 30;

  await PostView.create({
    post: postId,
    user: userId || undefined,
    duration,
    completed,
  });

  await Post.findByIdAndUpdate(postId, {
    $inc: { viewsCount: 1 },
  });

  return { recorded: true };
}

async function getViewStats(postId) {
  const stats = await PostView.aggregate([
    { $match: { post: postId } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        completedViews: { $sum: { $cond: ['$completed', 1, 0] } },
      },
    },
  ]);

  return stats[0] || { totalViews: 0, avgDuration: 0, completedViews: 0 };
}

module.exports = { recordView, getViewStats };
