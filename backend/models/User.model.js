/**
 * models/User.model.js
 * Full Mongoose schema for Neutron users.
 * Includes: auth, profile, social graph, privacy, and admin fields.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────
    username: {
      type:      String,
      required:  [true, 'Username is required.'],
      unique:    true,
      trim:      true,
      lowercase: true,
      minlength: [3,  'Username must be at least 3 characters.'],
      maxlength: [30, 'Username must be at most 30 characters.'],
      match: [
        /^[a-zA-Z0-9_\.]+$/,
        'Username may only contain letters, numbers, underscores, and dots.',
      ],
    },

    displayName: {
      type:      String,
      trim:      true,
      maxlength: [50, 'Display name must be at most 50 characters.'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required.'],
      unique:    true,
      trim:      true,
      lowercase: true,
      match:     [/\S+@\S+\.\S+/, 'Invalid email address.'],
    },

    password: {
      type:     String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select:   false, // Never returned in queries unless explicitly selected
    },

    // ── Profile ───────────────────────────────────────────────────
    bio: {
      type:      String,
      trim:      true,
      maxlength: [150, 'Bio must be at most 150 characters.'],
      default:   '',
    },

    profilePicture: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' }, // Cloudinary public_id for deletion
    },

    coverPhoto: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    website: {
      type:  String,
      trim:  true,
      match: [/^https?:\/\/.+/, 'Website must start with http:// or https://.'],
    },

    location: {
      type:      String,
      trim:      true,
      maxlength: [100, 'Location must be at most 100 characters.'],
    },

    // ── Verification ──────────────────────────────────────────────
    isVerified: {
      type:    Boolean,
      default: false, // Twitter-style verified badge (admin grants)
    },

    emailVerified: {
      type:    Boolean,
      default: false,
    },

    emailVerifyToken:   { type: String, select: false },
    emailVerifyExpires: { type: Date,   select: false },

    // ── Social graph ──────────────────────────────────────────────
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postsCount:     { type: Number, default: 0, min: 0 },

    // ── Saved posts ───────────────────────────────────────────────
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

    // ── Reposted posts ────────────────────────────────────────────
    repostedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

    // ── Privacy / blocking ────────────────────────────────────────
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mutedUsers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Auth tokens ───────────────────────────────────────────────
    refreshToken:         { type: String, select: false },
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    // ── Admin / moderation ────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },

    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },

    // ── E2E Encryption Keys ───────────────────────────────────────
    publicKey:     { type: String, default: '' },
    fingerprint:   { type: String, default: '' },
    keyUploadedAt: { type: Date },

    // ── Presence ──────────────────────────────────────────────────
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date,    default: Date.now },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Remove sensitive fields from any .toJSON() output
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerifyToken;
        delete ret.emailVerifyExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────
userSchema.index({ username: 1 });       // Profile lookups
userSchema.index({ email: 1 });          // Login / email verification
userSchema.index({ createdAt: -1 });     // Admin user list
userSchema.index(
  { username: 'text', displayName: 'text', bio: 'text' },
  { weights: { username: 10, displayName: 5, bio: 1 } }
);                                       // Full-text user search

// ── Pre-save hook: Hash password ──────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (avoids re-hashing on profile updates)
  if (!this.isModified('password')) return next();

  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// ── Instance method: Compare password ────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Virtual: Full profile picture URL with fallback ───────────────────
userSchema.virtual('avatarUrl').get(function () {
  return this.profilePicture?.url || `https://api.dicebear.com/8.x/initials/svg?seed=${this.username}`;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
