/**
 * services/feedRanking.service.js
 * Multi-signal feed ranking for "For You" and "Following" feeds.
 * Ported from PostgreSQL server/src/services/exploreService.ts
 */

const Post = require('../models/Post.model');
const User = require('../models/User.model');
const PostTag = require('../models/PostTag.model');
const CreatorScore = require('../models/CreatorScore.model');
const { getTopInterests, findSimilarUsers } = require('./interest.service');

const CANDIDATE_LIMIT = 500;
const FILTERED_LIMIT = 200;
const RANKED_LIMIT = 100;

const SCORE_WEIGHTS = {
  engagement: 0.30,
  interestMatch: 0.25,
  freshness: 0.20,
  socialProximity: 0.15,
  quality: 0.10,
};

const ENGAGEMENT_WEIGHTS = {
  likes: 2,
  comments: 3,
  shares: 4,
  saves: 5,
};

function computeEngagementScore(post) {
  const total =
    (post.likesCount || 0) * ENGAGEMENT_WEIGHTS.likes +
    (post.commentsCount || 0) * ENGAGEMENT_WEIGHTS.comments +
    (post.sharesCount || 0) * ENGAGEMENT_WEIGHTS.shares +
    (post.savesCount || 0) * ENGAGEMENT_WEIGHTS.saves;
  return Math.min(total / 100, 1);
}

function computeInterestBoost(postTags, interests) {
  if (!postTags || postTags.length === 0) return 0;
  const interestMap = new Map(interests.map(i => [i.category, i.score]));
  let boost = 0;
  for (const tag of postTags) {
    const score = interestMap.get(tag.toLowerCase()) || 0;
    boost += score * 0.01;
  }
  return Math.min(boost, 50);
}

function computeFreshnessScore(createdAt) {
  const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
  if (ageMinutes < 10) return 1;
  if (ageMinutes < 30) return 0.6;
  if (ageMinutes < 60) return 0.3;
  if (ageMinutes < 120) return 0.1;
  return 0;
}

function computeQualityMultiplier(qualityScore) {
  if (qualityScore === null || qualityScore === undefined) return 0.7;
  if (qualityScore >= 80) return 1.2;
  if (qualityScore >= 60) return 1.0;
  if (qualityScore >= 40) return 0.8;
  return 0.5;
}

function computeScore(post, interests, creatorScore, socialProximity) {
  const engagement = computeEngagementScore(post);
  const interestMatch = computeInterestBoost(post.hashtags || [], interests);
  const freshness = computeFreshnessScore(post.createdAt);
  const quality = computeQualityMultiplier(creatorScore?.qualityScore);

  const score =
    (engagement * SCORE_WEIGHTS.engagement +
      interestMatch * SCORE_WEIGHTS.interestMatch +
      freshness * SCORE_WEIGHTS.freshness +
      socialProximity * SCORE_WEIGHTS.socialProximity +
      quality * SCORE_WEIGHTS.quality) *
    100;

  return Math.max(0, score);
}

async function getForYouFeed(userId, cursor, limit = 20) {
  const interests = await getTopInterests(userId, 30);
  const similarUserIds = await findSimilarUsers(userId, 50);
  const user = await User.findById(userId).select('following blockedUsers mutedUsers').lean();
  const followingIds = (user?.following || []).map(String);

  const query = {
    isDeleted: false,
    visibility: 'public',
    author: { $nin: [...(user?.blockedUsers || []), ...(user?.mutedUsers || [])] },
  };

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  let candidates = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_LIMIT)
    .lean();

  const creatorScores = await CreatorScore.find({
    user: { $in: candidates.map(c => String(c.author)) },
  }).lean();
  const creatorScoreMap = new Map(creatorScores.map(cs => [String(cs.user), cs]));

  const scored = candidates.map(post => {
    const authorId = String(post.author);
    const isFollowing = followingIds.includes(authorId);
    const isSimilar = similarUserIds.map(String).includes(authorId);
    const socialProximity = isFollowing ? 1.0 : isSimilar ? 0.5 : 0.1;
    const creatorScore = creatorScoreMap.get(authorId);
    const score = computeScore(post, interests, creatorScore, socialProximity);

    return { ...post, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  const diversified = applyDiversity(scored);
  const final = diversified.slice(0, RANKED_LIMIT);

  const page = cursor
    ? final.filter(p => new Date(p.createdAt) < new Date(cursor))
    : final;
  const paginated = page.slice(0, limit);

  return {
    posts: paginated.map(p => ({
      ...p,
      _score: undefined,
      isFollowing: followingIds.includes(String(p.author)),
    })),
    next_cursor: paginated.length === limit
      ? paginated[paginated.length - 1].createdAt.toISOString()
      : null,
    has_more: paginated.length === limit,
  };
}

async function getFollowingFeed(userId, cursor, limit = 20) {
  const user = await User.findById(userId).select('following').lean();
  const followingIds = user?.following || [];

  if (followingIds.length === 0) {
    return { posts: [], next_cursor: null, has_more: false };
  }

  const query = {
    author: { $in: followingIds },
    isDeleted: false,
  };

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = posts.length > limit;
  const paginated = hasMore ? posts.slice(0, limit) : posts;

  return {
    posts: paginated,
    next_cursor: hasMore ? paginated[paginated.length - 1].createdAt.toISOString() : null,
    has_more: hasMore,
  };
}

async function getTrendingFeed(limit = 10) {
  const posts = await Post.find({ isDeleted: false, visibility: 'public' })
    .sort({
      trendScore: -1,
      createdAt: -1,
    })
    .limit(limit)
    .lean();

  return posts;
}

async function getTrendingTags(limit = 20) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const tags = await PostTag.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: 'post',
        foreignField: '_id',
        as: 'postData',
      },
    },
    { $unwind: '$postData' },
    {
      $match: {
        'postData.visibility': 'public',
        'postData.isDeleted': false,
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    { $group: { _id: '$tag', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  return tags.map(t => ({
    tag: t._id,
    count: t.count,
    post_count: t.count,
  }));
}

async function getSuggestedUsers(userId, limit = 20) {
  const user = await User.findById(userId).select('following').lean();
  const followingIds = user?.following || [];

  const users = await User.find({
    _id: { $ne: userId, $nin: followingIds },
    isBanned: false,
  })
    .select('username displayName profilePicture.bio isVerified followersCount')
    .sort({ followersCount: -1 })
    .limit(limit)
    .lean();

  return users.map(u => ({
    id: u._id,
    username: u.username,
    display_name: u.displayName || u.username,
    avatar_url: u.profilePicture?.url || '',
    bio: u.bio || '',
    is_verified: u.isVerified || false,
    followers_count: u.followersCount || 0,
  }));
}

async function searchFeed(queryText, userId, type, limit = 20) {
  const results = { posts: [], users: [] };
  const escapedRegex = queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cleanHashtag = queryText.toLowerCase().replace(/^#/, '');

  if (!type || type === 'posts' || type === 'all') {
    // Privacy: exclude private posts, and for 'followers' visibility, only show if searcher is followed
    const visibilityFilter = userId
      ? { $or: [{ visibility: 'public' }, { visibility: 'followers', author: { $in: (await User.findById(userId).select('following').lean())?.following || [] } }] }
      : { visibility: 'public' };

    // Rank: exact hashtag match first, then title match, then caption match
    const exactHashtagMatch = await Post.find({
      isDeleted: false,
      ...visibilityFilter,
      hashtags: { $in: [cleanHashtag] },
    })
      .populate('author', 'username displayName profilePicture isVerified')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const titleMatch = await Post.find({
      isDeleted: false,
      ...visibilityFilter,
      caption: { $regex: escapedRegex, $options: 'i' },
      hashtags: { $nin: [cleanHashtag] },
    })
      .populate('author', 'username displayName profilePicture isVerified')
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Deduplicate and merge
    const seenIds = new Set();
    const merged = [];
    for (const p of [...exactHashtagMatch, ...titleMatch]) {
      const id = String(p._id);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        merged.push(p);
      }
    }
    results.posts = merged.slice(0, limit);
  }

  if (!type || type === 'users' || type === 'all') {
    // Rank: exact username match > starts with > contains in display name > contains in bio
    const exactMatch = await User.find({
      _id: { $ne: userId },
      isBanned: false,
      username: { $regex: `^${escapedRegex}$`, $options: 'i' },
    })
      .select('username displayName profilePicture.bio isVerified followersCount')
      .limit(limit)
      .lean();

    const prefixMatch = await User.find({
      _id: { $ne: userId },
      isBanned: false,
      username: { $regex: `^${escapedRegex}`, $options: 'i' },
      ...(exactMatch.length > 0 ? { _id: { $nin: exactMatch.map(u => u._id) } } : {}),
    })
      .select('username displayName profilePicture.bio isVerified followersCount')
      .sort({ followersCount: -1 })
      .limit(limit)
      .lean();

    const displayOrBioMatch = await User.find({
      _id: { $ne: userId },
      isBanned: false,
      $or: [
        { displayName: { $regex: escapedRegex, $options: 'i' } },
        { bio: { $regex: escapedRegex, $options: 'i' } },
      ],
      _id: { $nin: [...exactMatch.map(u => u._id), ...prefixMatch.map(u => u._id)] },
    })
      .select('username displayName profilePicture.bio isVerified followersCount')
      .sort({ followersCount: -1 })
      .limit(limit)
      .lean();

    results.users = [...exactMatch, ...prefixMatch, ...displayOrBioMatch].slice(0, limit);
  }

  return results;
}

function applyDiversity(ranked) {
  if (ranked.length === 0) return ranked;

  const result = [];
  const authorCounts = {};
  const tagCounts = {};

  for (const post of ranked) {
    const authorId = String(post.author);
    const primaryTag = post.hashtags?.[0] || 'general';

    if ((authorCounts[authorId] || 0) >= 2) continue;
    if ((tagCounts[primaryTag] || 0) >= 3 && result.length < 20) continue;

    result.push(post);
    authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
    tagCounts[primaryTag] = (tagCounts[primaryTag] || 0) + 1;
  }

  return result;
}

module.exports = {
  getForYouFeed,
  getFollowingFeed,
  getTrendingFeed,
  getTrendingTags,
  getSuggestedUsers,
  searchFeed,
};
