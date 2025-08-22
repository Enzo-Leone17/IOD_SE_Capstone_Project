//using redis client
const redis = require("../config/redis");

module.exports = {
  isTokenBlacklisted: async (accessToken) => {
    const blacklistKey = `blacklist:${accessToken}`;
    const isBlacklisted = await redis.get(blacklistKey);
    return isBlacklisted === "true";
  },

  fetchCachedData: async (cacheKey) => {
    const cachedData = await redis.get(cacheKey);
    return cachedData;
  },

  setCacheData: async (cacheKey, data, ttl) => {
    await redis.setEx(cacheKey, ttl, data);
  },

  /**
   * Delete keys by pattern safely (using SCAN instead of KEYS)
   */
  delPattern: async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
},

};
