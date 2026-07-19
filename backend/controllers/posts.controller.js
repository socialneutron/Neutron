const Post = require('../models/Post.model');
const User = require('../models/User.model');
const { uploadToCloudinary } = require('../config/cloudinary');
const { createNotification, removeNotification } = require('../services/notification.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/paginate');

const createPost = asyncHandler(async (req, res) => {
  const { caption, title, body, location, visibility, images, category, categoryColor, tags } = req.body;

  const postData = {
    author: req.user._id,
    caption: caption || title || '',
    location,
    visibility,
  };

  if (category) postData.hashtags = tags || [];
  if (category) postData.category = category;

  const post = await Post.create(postData);

  // Upload media if files present (Cloudinary path)
  if (req.files && req.files.length > 0) {
    const mediaUploads = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, 'neutron/posts');
        return {
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          width: result.width,
          height: result.height,
          format: result.format,
          duration: result.duration,
        };
      })
    );
    post.media = mediaUploads;
    await post.save({ validateModifiedOnly: true });
  }

  // Accept images array from frontend (base64 data URLs)
  if (images && Array.isArray(images) && images.length > 0 && (!post.media || post.media.length === 0)) {
    post.media = images.map((url, idx) => ({
      url,
      publicId: `local-${Date.now()}-${idx}`,
      resourceType: 'image',
    }));
    await post.save({ validateModifiedOnly: true });
  }

  // Increment user's posts count
  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

  const populated = await post.populate('author', 'username displayName profilePicture isVerified');

  res
    .status(201)
    .json(new ApiResponse(201, { post: populated }, 'Post created.'));
});

const getFeed = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const user = await User.findById(req.user._id).lean();

  const followedIds = [...user.following, req.user._id];

  const filter = {
    author: { $in: followedIds },
    isDeleted: false,
    $or: [
      { visibility: 'public' },
      { visibility: 'followers', author: { $in: user.following } },
      { author: req.user._id },
    ],
  };

  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName profilePicture isVerified')
    .lean();

  // Set isLiked/isSaved/isReposted for each post
  const postsWithFlags = posts.map((post) => ({
    ...post,
    isLiked: post.likes.some((id) => id.toString() === req.user._id.toString()),
    isSaved: user.savedPosts.some((id) => id.toString() === post._id.toString()),
    isReposted: user.repostedPosts.some((id) => id.toString() === post._id.toString()),
  }));

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(postsWithFlags, total, page, limit), 'Feed fetched.'));
});

const getTrending = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { isDeleted: false, visibility: 'public' };

  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .sort({ trendScore: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName profilePicture isVerified')
    .lean();

  const postsWithFlags = posts.map((post) => ({
    ...post,
    isLiked: post.likes.some((id) => id.toString() === req.user?._id?.toString()),
    isSaved: false,
    isReposted: false,
  }));

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(postsWithFlags, total, page, limit), 'Trending fetched.'));
});

const getByHashtag = asyncHandler(async (req, res) => {
  const { hashtag } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {
    hashtags: hashtag.toLowerCase(),
    isDeleted: false,
    visibility: 'public',
  };

  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName profilePicture isVerified')
    .lean();

  const postsWithFlags = posts.map((post) => ({
    ...post,
    isLiked: post.likes.some((id) => id.toString() === req.user?._id?.toString()),
    isSaved: false,
    isReposted: false,
  }));

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(postsWithFlags, total, page, limit), 'Posts by hashtag fetched.'));
});

const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId)
    .populate('author', 'username displayName profilePicture isVerified')
    .lean();

  if (!post || post.isDeleted) {
    throw new ApiError(404, 'Post not found.');
  }

  // Visibility check
  if (post.visibility === 'private' && post.author._id.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'This post is private.');
  }

  if (post.visibility === 'followers') {
    const author = await User.findById(post.author._id).lean();
    if (
      !req.user ||
      (req.user._id.toString() !== author._id.toString() &&
        !author.followers.some((id) => id.toString() === req.user._id.toString()))
    ) {
      throw new ApiError(403, 'This post is only visible to followers.');
    }
  }

  let isLiked = false;
  let isSaved = false;
  let isReposted = false;
  if (req.user) {
    isLiked = post.likes.some((id) => id.toString() === req.user._id.toString());
    const currentUser = await User.findById(req.user._id).lean();
    isSaved = currentUser.savedPosts.some((id) => id.toString() === postId);
    isReposted = currentUser.repostedPosts.some((id) => id.toString() === postId);
  }

  res
    .status(200)
    .json(new ApiResponse(200, { post: { ...post, isLiked, isSaved, isReposted } }, 'Post fetched.'));
});

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { caption, visibility } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own posts.');
  }

  if (caption !== undefined) post.caption = caption;
  if (visibility !== undefined) post.visibility = visibility;

  await post.save();

  const populated = await post.populate('author', 'username displayName profilePicture isVerified');

  res
    .status(200)
    .json(new ApiResponse(200, { post: populated }, 'Post updated.'));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own posts.');
  }

  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();

  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });

  // Clean up saved/reposted references from all users
  await User.updateMany({ savedPosts: postId }, { $pull: { savedPosts: postId } });
  await User.updateMany({ repostedPosts: postId }, { $pull: { repostedPosts: postId } });

  const Notification = require('../models/Notification.model');
  await Notification.deleteMany({ post: postId });

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Post deleted.'));
});

const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post || post.isDeleted) {
    throw new ApiError(404, 'Post not found.');
  }

  const isLiked = post.likes.some((id) => id.toString() === userId.toString());

  if (isLiked) {
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: userId },
      $inc: { likesCount: -1 },
    });

    await removeNotification({
      receiverId: post.author,
      senderId: userId,
      type: 'like',
      postId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, 'Like removed.'));
  } else {
    await Post.findByIdAndUpdate(postId, {
      $addToSet: { likes: userId },
      $inc: { likesCount: 1 },
    });

    await createNotification({
      receiverId: post.author,
      senderId: userId,
      type: 'like',
      postId,
      preview: `${req.user.username} liked your post.`,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: true }, 'Post liked.'));
  }
});

const toggleSave = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post || post.isDeleted) {
    throw new ApiError(404, 'Post not found.');
  }

  const user = await User.findById(userId);
  const isSaved = user.savedPosts.some((id) => id.toString() === postId);

  if (isSaved) {
    await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } });
    await Post.findByIdAndUpdate(postId, { $inc: { savesCount: -1 } });

    res
      .status(200)
      .json(new ApiResponse(200, { isSaved: false }, 'Post unsaved.'));
  } else {
    await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postId } });
    await Post.findByIdAndUpdate(postId, { $inc: { savesCount: 1 } });

    res
      .status(200)
      .json(new ApiResponse(200, { isSaved: true }, 'Post saved.'));
  }
});

const toggleRepost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post || post.isDeleted) {
    throw new ApiError(404, 'Post not found.');
  }

  if (post.author.toString() === userId.toString()) {
    throw new ApiError(400, 'You cannot repost your own post.');
  }

  const user = await User.findById(userId);
  const isReposted = user.repostedPosts.some((id) => id.toString() === postId);

  if (isReposted) {
    await User.findByIdAndUpdate(userId, { $pull: { repostedPosts: postId } });
    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: -1 } });

    await removeNotification({
      receiverId: post.author,
      senderId: userId,
      type: 'post_share',
      postId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { reposted: false }, 'Repost removed.'));
  } else {
    await User.findByIdAndUpdate(userId, { $addToSet: { repostedPosts: postId } });
    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });

    await createNotification({
      receiverId: post.author,
      senderId: userId,
      type: 'post_share',
      postId,
      preview: `${req.user.username} reposted your post.`,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { reposted: true }, 'Post reposted.'));
  }
});

module.exports = {
  createPost,
  getFeed,
  getTrending,
  getByHashtag,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave,
  toggleRepost,
};
