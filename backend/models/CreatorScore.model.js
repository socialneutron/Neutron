/**
 * models/CreatorScore.model.js
 * Per-creator quality metrics derived from engagement events.
 * Updated in real-time as users interact with the creator's posts.
 */

const mongoose = require('mongoose');

const creatorScoreSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },

    qualityScore: {
      type:    Number,
      default: 50,
      min:     0,
      max:     100,
    },

    totalViews:    { type: Number, default: 0, min: 0 },
    totalLikes:    { type: Number, default: 0, min: 0 },
    totalShares:   { type: Number, default: 0, min: 0 },
    totalComments: { type: Number, default: 0, min: 0 },
    totalSaves:    { type: Number, default: 0, min: 0 },

    avgEngagementRate: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

creatorScoreSchema.index({ qualityScore: -1 });

const CreatorScore = mongoose.model('CreatorScore', creatorScoreSchema);
module.exports = CreatorScore;
