const Message = require('../models/Message.model');
const User = require('../models/User.model');
const { createNotification } = require('../services/notification.service');
const { emitToUser, isUserOnline } = require('../config/socket');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/paginate');

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, message: text } = req.body;

  if (!receiverId) {
    throw new ApiError(400, 'Receiver ID is required.');
  }

  if (!text && !req.file) {
    throw new ApiError(400, 'Message text or media is required.');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ApiError(404, 'Receiver not found.');
  }

  // Check if blocked
  if (receiver.blockedUsers.some((id) => id.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'You are blocked by this user.');
  }

  const { encryptedEnvelope, isEncrypted } = req.body;

  const msgData = {
    sender: req.user._id,
    receiver: receiverId,
    message: text || '',
    isEncrypted: !!isEncrypted,
    encryptedEnvelope: isEncrypted ? encryptedEnvelope : undefined,
  };

  // Handle media upload
  if (req.file) {
    const { uploadToCloudinary } = require('../config/cloudinary');
    const result = await uploadToCloudinary(req.file.buffer, 'neutron/messages');
    msgData.media = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    };
  }

  const msg = await Message.create(msgData);

  // Mark as delivered if receiver is online
  if (isUserOnline(receiverId)) {
    msg.delivered = true;
    await msg.save();

    // Emit via socket if available
    try {
      const io = require('../config/socket').io;
      if (io) {
        emitToUser(io, receiverId, 'message:new', msg);
      }
    } catch {
      // Socket not initialized yet — non-critical
    }
  }

  // Send notification
  await createNotification({
    receiverId,
    senderId: req.user._id,
    type: 'message',
    preview: text ? text.substring(0, 100) : 'Sent a media message.',
  });

  res
    .status(201)
    .json(new ApiResponse(201, { message: msg }, 'Message sent.'));
});

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get unique conversation partners with last message
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: userId, deletedBySender: false },
          { receiver: userId, deletedByReceiver: false },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userId] },
            '$receiver',
            '$sender',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', userId] },
                  { $eq: ['$read', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          { $project: { username: 1, displayName: 1, profilePicture: 1, isOnline: 1 } },
        ],
      },
    },
    { $unwind: '$user' },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, { conversations }, 'Conversations fetched.'));
});

const getConversation = asyncHandler(async (req, res) => {
  const { userId: otherUserId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);
  const currentUserId = req.user._id;

  const otherUser = await User.findById(otherUserId).lean();
  if (!otherUser) {
    throw new ApiError(404, 'User not found.');
  }

  const filter = {
    $or: [
      { sender: currentUserId, receiver: otherUserId, deletedBySender: false },
      { sender: otherUserId, receiver: currentUserId, deletedByReceiver: false },
    ],
  };

  const total = await Message.countDocuments(filter);
  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username displayName profilePicture')
    .populate('receiver', 'username displayName profilePicture')
    .lean();

  // Mark undelivered messages as delivered
  await Message.updateMany(
    {
      sender: otherUserId,
      receiver: currentUserId,
      delivered: false,
    },
    { delivered: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(messages.reverse(), total, page, limit), 'Messages fetched.'));
});

const markRead = asyncHandler(async (req, res) => {
  const { userId: senderId } = req.params;

  await Message.updateMany(
    {
      sender: senderId,
      receiver: req.user._id,
      read: false,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Messages marked as read.'));
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found.');
  }

  const userId = req.user._id.toString();

  if (message.sender.toString() === userId) {
    message.deletedBySender = true;
  } else if (message.receiver.toString() === userId) {
    message.deletedByReceiver = true;
  } else {
    throw new ApiError(403, 'You can only delete your own messages.');
  }

  await message.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Message deleted.'));
});

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  markRead,
  deleteMessage,
};
