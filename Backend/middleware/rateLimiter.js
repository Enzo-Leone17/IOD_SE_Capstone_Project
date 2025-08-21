//using redis client
const redisClient = require("../config/redis");

/**
 * rate limiter using redis client. limit request per x seconds. Default is 10 requests per 60 seconds
 * @param {*} limit request limit
 * @param {*} windowSeconds per seconds
 * @returns error status 429 if exceeded, otherwise proceeds
 */
const rateLimiter = (limit = 10, windowSeconds = 60) => {
  console.log(`Rate limiter set to ${limit} requests per ${windowSeconds} seconds`);
  return async (req, res, next) => {
    try {
      const ip = req.ip;
      const key = `rate:${ip}`;

      const current = await redisClient.get(key);

      if (current && parseInt(current) >= limit) {
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
        });
      }

      if (current) {
        await redisClient.incr(key);
      } else {
        await redisClient.set(key, 1, { EX: windowSeconds });
      }

      next();
    } catch (err) {
      console.error("Rate limiter error:", err);
      next();
    }
  };
};

module.exports = rateLimiter;
