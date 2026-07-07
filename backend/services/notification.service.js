/**
 * services/notification.service.js
 * Fan-out notification creation + real-time push via Socket.IO.
 * Imported by post, comment, follow, and message controllers.
 */

const Notification = require('../models/Notification.model');

let _io = null; // Set by server.js after Socket.IO init

/** Called once during bootstrap to inject the Socket.IO instance. */
const setIo = (io) => { _io = io; };

/**
 * Create a notification and push it in real-time to the receiver.
 * Silently skips self-notifications (sender === receiver).
 *
 * @param {object} opts
 * @param {string}       opts.receiverId - User who receives the notification
 * @param {string}       opts.senderId   - User who triggered it
 * @param {string}       opts.type       - Notification type enum
 * @param {string}       [opts.postId]   - Related post (optional)
 * @param {string}       [opts.commentId]- Related comment (optional)
 * @param {string}       [opts.preview]  - Short text preview
 */
const createNotification = async ({ receiverId, senderId, type, postId, commentId, preview }) => {
  // Don't notify yourself
  if (receiverId.toString() === senderId.toString()) return;

  try {
    const notification = await Notification.create({
      receiver: receiverId,
      sender:   senderId,
      type,
      post:     postId    || undefined,
      comment:  commentId || undefined,
      preview:  preview   || undefined,
    });

    // Populate sender info for real-time push
    const populated = await notification.populate('sender', 'username profilePicture');

    // Push to receiver's personal Socket.IO room if they are online
    if (_io) {
      _io.to(`user:${receiverId}`).emit('notification:new', populated);
    }

    return populated;
  } catch (err) {
    // Non-critical — log but don't crash the request
    console.error('Notification creation failed:', err.message);
  }
};

/**
 * Delete a notification (e.g., user unliked a post → remove the like notification).
 */
const removeNotification = async ({ receiverId, senderId, type, postId }) => {
  try {
    await Notification.findOneAndDelete({
      receiver: receiverId,
      sender:   senderId,
      type,
      ...(postId && { post: postId }),
    });
  } catch (err) {
    console.error('Notification removal failed:', err.message);
  }
};

module.exports = { setIo, createNotification, removeNotification };
