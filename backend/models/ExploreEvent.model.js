/**
 * models/ExploreEvent.model.js
 * User action log for personalization and ranking.
 * Records views, likes, skips, dwell times, and other engagement events.
 */

const mongoose = require('mongoose');

const exploreEventSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    post: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Post',
      required: true,
    },

    eventType: {
      type: String,
      required: true,
      enum: [
        'view',
        'dwell_3s',
        'click',
        'dwell_10s',
        'dwell_30s',
        'like',
        'watch_25',
        'watch_50',
        'watch_75',
        'watch_complete',
        'save',
        'share',
        'repost',
        'comment',
        'skip',
        'unlike',
        'unsave',
      ],
    },

    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

exploreEventSchema.index({ user: 1, post: 1, eventType: 1 });
exploreEventSchema.index({ user: 1, createdAt: -1 });
exploreEventSchema.index({ post: 1, eventType: 1 });

const ExploreEvent = mongoose.model('ExploreEvent', exploreEventSchema);
module.exports = ExploreEvent;
