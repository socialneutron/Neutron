/**
 * models/PostTag.model.js
 * Content labels extracted from posts for ranking.
 * Each tag has a relevance score (0-1) and a source (ai/hashtag/manual).
 */

const mongoose = require('mongoose');

const postTagSchema = new mongoose.Schema(
  {
    post: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Post',
      required: true,
      index:    true,
    },

    tag: {
      type:      String,
      required:  true,
      trim:      true,
      lowercase: true,
    },

    score: {
      type:    Number,
      default: 0.5,
      min:     0,
      max:     1,
    },

    source: {
      type:    String,
      enum:    ['ai', 'hashtag', 'manual'],
      default: 'ai',
    },
  },
  { timestamps: true }
);

postTagSchema.index({ tag: 1, score: -1 });
postTagSchema.index({ post: 1, tag: 1 }, { unique: true });

const PostTag = mongoose.model('PostTag', postTagSchema);
module.exports = PostTag;
