const Notification = require('../models/Notification.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/paginate');

const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { receiver: req.user._id };

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username displayName profilePicture isVerified')
    .populate('post', 'caption media')
    .populate('comment', 'text')
    .lean();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginatedResponse(notifications, total, page, limit),
        'Notifications fetched.'
      )
    );
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { receiver: req.user._id, read: false },
    { read: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, 'All notifications marked as read.'));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found.');
  }

  if (notification.receiver.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own notifications.');
  }

  await Notification.findByIdAndDelete(notificationId);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Notification deleted.'));
});

module.exports = {
  getNotifications,
  markAllRead,
  deleteNotification,
};
