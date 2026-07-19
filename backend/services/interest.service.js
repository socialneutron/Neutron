/**
 * services/interest.service.js
 * Tracks user engagement events, updates interest scores, and finds similar users.
 * Ported from PostgreSQL server/src/services/interestService.ts
 */

const PostTag = require('../models/PostTag.model');
const UserInterest = require('../models/UserInterest.model');
const ExploreEvent = require('../models/ExploreEvent.model');
const CreatorScore = require('../models/CreatorScore.model');
const Post = require('../models/Post.model');

const ACTION_SCORES = {
  view: 1,
  dwell_3s: 3,
  click: 3,
  dwell_10s: 5,
  dwell_30s: 8,
  like: 10,
  watch_25: 4,
  watch_50: 8,
  watch_75: 12,
  watch_complete: 15,
  save: 20,
  share: 25,
  repost: 20,
  comment: 15,
  skip: -8,
  unlike: -10,
  unsave: -20,
};

async function recordAction(userId, postId, eventType, metadata = {}) {
  await ExploreEvent.create({
    user: userId,
    post: postId,
    eventType,
    metadata,
  });

  const scoreChange = ACTION_SCORES[eventType] || 0;

  if (scoreChange !== 0) {
    const tags = await PostTag.find({ post: postId }).lean();

    for (const t of tags) {
      const weightedChange = Math.round(scoreChange * t.score);
      if (weightedChange === 0) continue;

      await UserInterest.findOneAndUpdate(
        { user: userId, category: t.tag },
        {
          $inc: { score: Math.max(0, weightedChange) },
          $setOnInsert: { user: userId, category: t.tag },
        },
        { upsert: true }
      );
    }
  }

  if (eventType === 'skip') {
    const tags = await PostTag.find({ post: postId }).lean();
    for (const t of tags) {
      await UserInterest.findOneAndUpdate(
        { user: userId, category: t.tag },
        {
          $inc: { score: Math.max(0, -5) },
          $setOnInsert: { user: userId, category: t.tag },
        },
        { upsert: true }
      );
    }
  }

  if (['like', 'save', 'share', 'watch_complete', 'repost', 'comment'].includes(eventType)) {
    const post = await Post.findById(postId).select('author').lean();
    if (post) {
      const updateField =
        eventType === 'share' || eventType === 'repost'
          ? 'totalShares'
          : eventType === 'comment'
            ? 'totalComments'
            : 'totalLikes';

      await CreatorScore.findOneAndUpdate(
        { user: post.author },
        { $inc: { [updateField]: 1 } },
        { upsert: true }
      );
    }
  }

  return { recorded: true, score_change: scoreChange };
}

async function getInterestProfile(userId) {
  const interests = await UserInterest.find({ user: userId })
    .sort({ score: -1 })
    .lean();

  const tagEvents = await ExploreEvent.aggregate([
    { $match: { user: userId, eventType: { $in: ['like', 'save', 'share', 'watch_complete'] } } },
    { $lookup: { from: 'posttags', localField: 'post', foreignField: 'post', as: 'tags' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags.tag', action_count: { $sum: 1 } } },
    { $sort: { action_count: -1 } },
    { $limit: 20 },
  ]);

  return {
    interests,
    recent_tags: tagEvents.map(t => ({ tag: t._id, action_count: t.action_count })),
  };
}

async function getTopInterests(userId, limit = 10) {
  const rows = await UserInterest.find({ user: userId })
    .sort({ score: -1 })
    .limit(limit)
    .lean();
  return rows.map(r => ({ category: r.category, score: r.score }));
}

async function findSimilarUsers(userId, limit = 50) {
  const myInterests = await getTopInterests(userId, 20);
  if (myInterests.length === 0) return [];

  const myCategories = myInterests.map(i => i.category);

  const similar = await UserInterest.aggregate([
    { $match: { category: { $in: myCategories }, user: { $ne: userId } } },
    { $group: { _id: '$user', similarity: { $sum: '$score' } } },
    { $sort: { similarity: -1 } },
    { $limit: limit },
  ]);

  return similar.map(s => s._id);
}

async function extractTagsFromPost(postId, caption = '', hashtags = []) {
  const tags = [];

  for (const h of hashtags) {
    tags.push({ tag: h.toLowerCase().replace(/^#/, ''), score: 1.0, source: 'hashtag' });
  }

  const words = (caption || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [word, count] of sorted) {
    const score = Math.min(count / (words.length || 1), 1);
    if (!tags.find(t => t.tag === word)) {
      tags.push({ tag: word, score, source: 'ai' });
    }
  }

  if (tags.length > 0) {
    for (const t of tags) {
      await PostTag.findOneAndUpdate(
        { post: postId, tag: t.tag },
        { $set: { score: Math.min(Math.max(t.score, 0), 1), source: t.source } },
        { upsert: true }
      );
    }
  }

  return tags;
}

async function updateCreatorScore(userId, eventType) {
  const fieldMap = {
    like: 'totalLikes',
    share: 'totalShares',
    repost: 'totalShares',
    comment: 'totalComments',
    save: 'totalSaves',
    view: 'totalViews',
  };

  const field = fieldMap[eventType];
  if (!field) return;

  await CreatorScore.findOneAndUpdate(
    { user: userId },
    { $inc: { [field]: 1 } },
    { upsert: true }
  );

  const score = await CreatorScore.findOne({ user: userId }).lean();
  if (score) {
    const total = score.totalViews || 1;
    const engagement = (score.totalLikes + score.totalShares * 2 + score.totalComments * 1.5 + score.totalSaves * 2.5) / total;
    const quality = Math.min(100, Math.round(engagement * 100 + Math.log(total + 1) * 10));
    await CreatorScore.findOneAndUpdate({ user: userId }, { qualityScore: quality });
  }
}

module.exports = {
  recordAction,
  getInterestProfile,
  getTopInterests,
  findSimilarUsers,
  extractTagsFromPost,
  updateCreatorScore,
  ACTION_SCORES,
};
