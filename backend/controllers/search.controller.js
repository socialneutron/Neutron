const User = require('../models/User.model');
const Post = require('../models/Post.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    throw new ApiError(400, 'Search query is required.');
  }

  const query = q.trim();

  const [users, posts] = await Promise.all([
    User.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .select('username displayName profilePicture isVerified bio')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean(),

    Post.find(
      { $text: { $search: query }, isDeleted: false, visibility: 'public' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('author', 'username displayName profilePicture isVerified')
      .lean(),
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, { users, posts }, 'Search results fetched.')
    );
});

module.exports = {
  search,
};
