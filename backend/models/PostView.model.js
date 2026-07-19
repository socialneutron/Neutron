/**
 * models/PostView.model.js
 * View tracking for ranking signals.
 * Records view duration and dwell time for feed ranking.
 */

const mongoose = require('mongoose');

const postViewSchema = new mongoose.Schema(
  {
    post: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Post',
      required: true,
      index:    true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    duration: {
      type:    Number,
      default: 0,
      min:     0,
    },

    completed: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

postViewSchema.index({ post: 1, createdAt: -1 });
postViewSchema.index({ user: 1, post: 1 });

const PostView = mongoose.model('PostView', postViewSchema);
module.exports = PostView;
