const User = require('../models/User.model');
const Post = require('../models/Post.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { createNotification, removeNotification } = require('../services/notification.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/paginate');

const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Check if the requesting user is blocked by this profile owner
  if (
    req.user &&
    user.blockedUsers.some((id) => id.toString() === req.user._id.toString())
  ) {
    throw new ApiError(403, 'You are blocked by this user.');
  }

  // Determine follow status
  let isFollowing = false;
  if (req.user) {
    isFollowing = user.followers.some(
      (id) => id.toString() === req.user._id.toString()
    );
  }

  res.status(200).json(
    new ApiResponse(200, { user, isFollowing }, 'Profile fetched.')
  );
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['displayName', 'bio', 'website', 'location', 'username'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No valid fields to update.');
  }

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { user }, 'Profile updated.'));
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'Username already taken.');
    }
    throw err;
  }
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Avatar image is required.');
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar from cloudinary
  if (user.profilePicture?.publicId) {
    await deleteFromCloudinary(user.profilePicture.publicId, 'image');
  }

  const result = await uploadToCloudinary(req.file.buffer, 'neutron/avatars');

  user.profilePicture = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save({ validateModifiedOnly: true });

  res
    .status(200)
    .json(new ApiResponse(200, { user }, 'Avatar updated.'));
});

const updateCover = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Cover photo is required.');
  }

  const user = await User.findById(req.user._id);

  // Delete old cover from cloudinary
  if (user.coverPhoto?.publicId) {
    await deleteFromCloudinary(user.coverPhoto.publicId, 'image');
  }

  const result = await uploadToCloudinary(req.file.buffer, 'neutron/covers');

  user.coverPhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save({ validateModifiedOnly: true });

  res
    .status(200)
    .json(new ApiResponse(200, { user }, 'Cover photo updated.'));
});

const toggleFollow = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user._id;

  if (followerId.toString() === userId) {
    throw new ApiError(400, 'You cannot follow yourself.');
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found.');
  }

  const isFollowing = targetUser.followers.some(
    (id) => id.toString() === followerId.toString()
  );

  if (isFollowing) {
    // Unfollow
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: followerId },
      $inc: { followersCount: -1 },
    });
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: userId },
      $inc: { followingCount: -1 },
    });

    await removeNotification({
      receiverId: userId,
      senderId: followerId,
      type: 'follow',
    });

    res
      .status(200)
      .json(new ApiResponse(200, { isFollowing: false }, 'Unfollowed.'));
  } else {
    // Follow
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: followerId },
      $inc: { followersCount: 1 },
    });
    await User.findByIdAndUpdate(followerId, {
      $addToSet: { following: userId },
      $inc: { followingCount: 1 },
    });

    await createNotification({
      receiverId: userId,
      senderId: followerId,
      type: 'follow',
      preview: `${req.user.username} started following you.`,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { isFollowing: true }, 'Followed.'));
  }
});

const getFollowers = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const user = await User.findOne({ username }).lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const total = user.followersCount;
  const followers = await User.find({ _id: { $in: user.followers } })
    .select('username displayName profilePicture isVerified')
    .skip(skip)
    .limit(limit)
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(followers, total, page, limit), 'Followers fetched.'));
});

const getFollowing = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const user = await User.findOne({ username }).lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const total = user.followingCount;
  const following = await User.find({ _id: { $in: user.following } })
    .select('username displayName profilePicture isVerified')
    .skip(skip)
    .limit(limit)
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(following, total, page, limit), 'Following fetched.'));
});

const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const filter = {
    author: userId,
    isDeleted: false,
  };

  // Visibility check
  if (!req.user || req.user._id.toString() !== userId) {
    if (req.user && user.followers.includes(req.user._id)) {
      filter.visibility = { $in: ['public', 'followers'] };
    } else {
      filter.visibility = 'public';
    }
  }

  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName profilePicture isVerified')
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(posts, total, page, limit), 'Posts fetched.'));
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  toggleFollow,
  getFollowers,
  getFollowing,
  getUserPosts,
};
