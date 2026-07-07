/**
 * models/Post.model.js
 * Mongoose schema for Neutron posts.
 * Supports text, multiple images, videos, hashtags, mentions, and visibility settings.
 */

const mongoose = require('mongoose');

// ── Sub-schema: media attachment ──────────────────────────────────────
const mediaSchema = new mongoose.Schema(
  {
    url:          { type: String, required: true },
    publicId:     { type: String, required: true }, // Cloudinary public_id
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    width:        Number,
    height:       Number,
    format:       String, // jpg, png, mp4, etc.
    duration:     Number, // seconds (video only)
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    // ── Author ────────────────────────────────────────────────────
    author: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── Content ───────────────────────────────────────────────────
    caption: {
      type:      String,
      trim:      true,
      maxlength: [2200, 'Caption must be at most 2200 characters.'],
      default:   '',
    },

    media: {
      type:     [mediaSchema],
      validate: {
        validator: (v) => v.length <= 10,
        message:  'A post can have at most 10 media items.',
      },
    },

    // ── Discovery ─────────────────────────────────────────────────
    hashtags: {
      type:    [String],
      default: [],
      index:   true,
    },

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],

    location: {
      type:      String,
      trim:      true,
      maxlength: [100, 'Location must be at most 100 characters.'],
    },

    // ── Engagement ────────────────────────────────────────────────
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],

    likesCount:    { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    sharesCount:   { type: Number, default: 0, min: 0 },
    savesCount:    { type: Number, default: 0, min: 0 },

    // Trending score — updated by background job or on each interaction
    trendScore:    { type: Number, default: 0, index: -1 },

    // ── Visibility ────────────────────────────────────────────────
    visibility: {
      type:    String,
      enum:    ['public', 'followers', 'private'],
      default: 'public',
    },

    // ── Soft delete ───────────────────────────────────────────────
    isDeleted:  { type: Boolean, default: false, index: true },
    deletedAt:  Date,
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
  }
);

// ── Compound indexes ──────────────────────────────────────────────────
postSchema.index({ author: 1,  createdAt: -1 }); // User's own posts (newest first)
postSchema.index({ createdAt: -1, visibility: 1 }); // Feed
postSchema.index({ trendScore: -1, createdAt: -1 }); // Trending
postSchema.index({ hashtags: 1,  createdAt: -1 }); // Hashtag feed

// Full-text search on captions
postSchema.index(
  { caption: 'text' },
  { weights: { caption: 10 } }
);

// ── Virtual: whether current user liked this post ─────────────────────
// Populated by controller when req.user is available
postSchema.virtual('isLiked').get(function () {
  return this._isLiked || false;
});

postSchema.virtual('isSaved').get(function () {
  return this._isSaved || false;
});

// ── Pre-save: extract hashtags from caption ───────────────────────────
postSchema.pre('save', function (next) {
  if (this.isModified('caption') && this.caption) {
    const tags = this.caption.match(/#[a-zA-Z0-9_]+/g) || [];
    this.hashtags = [...new Set(tags.map((t) => t.slice(1).toLowerCase()))];
  }
  next();
});

// ── Pre-save: update trending score ──────────────────────────────────
postSchema.pre('save', function (next) {
  // Simple Wilson score-inspired formula
  // Weights: likes 2, comments 3, shares 4, recency decay implicit via index sort
  this.trendScore =
    this.likesCount * 2 + this.commentsCount * 3 + this.sharesCount * 4;
  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
