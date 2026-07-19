/**
 * models/UserInterest.model.js
 * Per-user interest scores derived from engagement events.
 * Score increases/decreases based on weighted user actions.
 */

const mongoose = require('mongoose');

const userInterestSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    category: {
      type:      String,
      required:  true,
      trim:      true,
      lowercase: true,
    },

    score: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  { timestamps: true }
);

userInterestSchema.index({ user: 1, score: -1 });
userInterestSchema.index({ user: 1, category: 1 }, { unique: true });

const UserInterest = mongoose.model('UserInterest', userInterestSchema);
module.exports = UserInterest;
