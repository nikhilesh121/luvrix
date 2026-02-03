// Rate limiting utility for API routes
// Uses in-memory store (consider Redis for production scaling)

const rateLimit = (options = {}) => {
  const {
    interval = 60 * 1000, // 1 minute
    uniqueTokenPerInterval = 500,
    limit = 10, // requests per interval
  } = options;

  const tokenCache = new Map();
  
  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenCache.entries()) {
      if (now - value.timestamp > interval) {
        tokenCache.delete(key);
      }
    }
  }, interval);

  return {
    check: (req, limitOverride) => {
      return new Promise((resolve, reject) => {
        const token = getClientToken(req);
        const tokenCount = tokenCache.get(token) || { count: 0, timestamp: Date.now() };
        const currentLimit = limitOverride || limit;

        // Reset if interval has passed
        if (Date.now() - tokenCount.timestamp > interval) {
          tokenCount.count = 0;
          tokenCount.timestamp = Date.now();
        }

        tokenCount.count += 1;
        tokenCache.set(token, tokenCount);

        const currentUsage = tokenCount.count;
        const isRateLimited = currentUsage > currentLimit;

        // Manage cache size
        if (tokenCache.size > uniqueTokenPerInterval) {
          const oldestKey = tokenCache.keys().next().value;
          tokenCache.delete(oldestKey);
        }

        resolve({
          isRateLimited,
          limit: currentLimit,
          remaining: Math.max(0, currentLimit - currentUsage),
          reset: tokenCount.timestamp + interval,
        });
      });
    },
  };
};

// Get unique identifier for the client
const getClientToken = (req) => {
  // Try to get real IP from various headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  
  const ip = cfConnectingIp || 
             (forwarded ? forwarded.split(',')[0].trim() : null) || 
             realIp || 
             req.socket?.remoteAddress || 
             'unknown';
  
  return ip;
};

// Pre-configured rate limiters for different use cases
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
});

export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
});

export const strictLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per minute
});

// Middleware wrapper for API routes
export const withRateLimit = (handler, limiter = apiLimiter, customLimit = null) => {
  return async (req, res) => {
    try {
      const result = await limiter.check(req, customLimit);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset);

      if (result.isRateLimited) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Rate limit error:', error);
      return handler(req, res); // Fail open
    }
  };
};

export default rateLimit;
