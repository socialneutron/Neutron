/**
 * models/Notification.model.js
 * Schema for in-app notifications (likes, comments, follows, mentions, messages).
 * Notifications are fan-out on write to each receiver.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    receiver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    type: {
      type:     String,
      required: true,
      enum: [
        'like',        // User liked your post
        'comment',     // User commented on your post
        'reply',       // User replied to your comment
        'mention',     // User mentioned you
        'follow',      // User started following you
        'message',     // User sent you a DM (fallback if socket missed)
        'post_share',  // User shared your post
      ],
    },

    // Referenced document (post or comment that triggered the notification)
    post:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },

    // Short preview text shown in notification list
    preview: { type: String, maxlength: 120 },

    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true, // createdAt = when notification was generated
  }
);

// Fetch all notifications for a user, newest first
notificationSchema.index({ receiver: 1, createdAt: -1 });
// Unread count query
notificationSchema.index({ receiver: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
