/**
 * config/redis.js
 * ioredis client configuration with graceful fallback.
 * If Redis is not available (no REDIS_URL), caching is silently skipped.
 */

const Redis = require('ioredis');

let redis = null;

const connectRedis = () => {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn('⚠️   REDIS_URL not set — caching disabled.');
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      // Exponential backoff for reconnects
      retryStrategy: (times) => {
        if (times > 5) return null; // Give up after 5 retries
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('connect', () => console.log('✅  Redis connected.'));
    redis.on('error', (err) => console.warn('⚠️   Redis error:', err.message));
    redis.on('close', () => console.warn('⚠️   Redis connection closed.'));

    return redis;
  } catch (err) {
    console.warn('⚠️   Redis init failed — caching disabled:', err.message);
    return null;
  }
};

/**
 * Set a JSON value in Redis with optional TTL (seconds).
 */
const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (_) {}
};

/**
 * Get a JSON value from Redis. Returns null on miss or error.
 */
const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Delete one or more keys from Redis.
 */
const cacheDel = async (...keys) => {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch (_) {}
};

module.exports = { connectRedis, cacheSet, cacheGet, cacheDel, getRedis: () => redis };
