/**
 * models/Comment.model.js
 * Mongoose schema for post comments (with nested replies).
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    post: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Post',
      required: true,
      index:    true,
    },

    // null if this is a top-level comment; set if this is a reply
    parentComment: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Comment',
      default: null,
      index:   true,
    },

    text: {
      type:      String,
      required:  [true, 'Comment text is required.'],
      trim:      true,
      maxlength: [1000, 'Comment must be at most 1000 characters.'],
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0, min: 0 },

    repliesCount: { type: Number, default: 0, min: 0 },

    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Soft delete
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for efficient post-level comment fetch
commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ post: 1, likesCount: -1 }); // Top comments

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
