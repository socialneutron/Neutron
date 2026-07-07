const Comment = require('../models/Comment.model');
const Post = require('../models/Post.model');
const { createNotification } = require('../services/notification.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/paginate');

const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const post = await Post.findById(postId).lean();
  if (!post || post.isDeleted) {
    throw new ApiError(404, 'Post not found.');
  }

  const filter = {
    post: postId,
    parentComment: null,
    isDeleted: false,
  };

  const total = await Comment.countDocuments(filter);
  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName profilePicture isVerified')
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, paginatedResponse(comments, total, page, limit), 'Comments fetched.'));
});

const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text, parentComment } = req.body;

  const post = await Post.findById(postId);
  if (!post || post.isDeleted) {
    throw new ApiError(404, 'Post not found.');
  }

  // If replying to a comment, verify parent exists
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.isDeleted || parent.post.toString() !== postId) {
      throw new ApiError(404, 'Parent comment not found.');
    }
  }

  const comment = await Comment.create({
    author: req.user._id,
    post: postId,
    parentComment: parentComment || null,
    text,
  });

  // Update post comment count
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  // Update parent comment reply count
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, { $inc: { repliesCount: 1 } });
  }

  // Create notification
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    await createNotification({
      receiverId: parent.author,
      senderId: req.user._id,
      type: 'reply',
      postId,
      commentId: comment._id,
      preview: `${req.user.username} replied to your comment.`,
    });
  } else {
    await createNotification({
      receiverId: post.author,
      senderId: req.user._id,
      type: 'comment',
      postId,
      commentId: comment._id,
      preview: `${req.user.username} commented on your post.`,
    });
  }

  const populated = await comment.populate('author', 'username displayName profilePicture isVerified');

  res
    .status(201)
    .json(new ApiResponse(201, { comment: populated }, 'Comment added.'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment || comment.isDeleted) {
    throw new ApiError(404, 'Comment not found.');
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own comments.');
  }

  comment.isDeleted = true;
  await comment.save();

  // Decrement post comment count
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

  // Decrement parent comment reply count if this is a reply
  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } });
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Comment deleted.'));
});

const toggleLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment || comment.isDeleted) {
    throw new ApiError(404, 'Comment not found.');
  }

  const isLiked = comment.likes.some((id) => id.toString() === userId.toString());

  if (isLiked) {
    await Comment.findByIdAndUpdate(commentId, {
      $pull: { likes: userId },
      $inc: { likesCount: -1 },
    });

    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, 'Like removed.'));
  } else {
    await Comment.findByIdAndUpdate(commentId, {
      $addToSet: { likes: userId },
      $inc: { likesCount: 1 },
    });

    res
      .status(200)
      .json(new ApiResponse(200, { isLiked: true }, 'Comment liked.'));
  }
});

module.exports = {
  getComments,
  addComment,
  deleteComment,
  toggleLike,
};
