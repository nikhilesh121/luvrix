/**
 * Enterprise Rate Limiting Module
 * Sprint 5 - Security & Resilience Foundation
 * 
 * Implements Redis-based rate limiting for enterprise protection
 * Falls back to in-memory limiting for development environments
 */

import { LRUCache } from "lru-cache";

// Rate limit configurations by route type
export const RATE_LIMIT_CONFIGS = {
  // Authentication - strict limits to prevent brute force
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 500,
    limit: 5, // 5 attempts per 15 minutes
  },
  // OTP endpoints - moderate (separate from auth login)
  otp: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 200,
    limit: 5, // 5 OTP requests per hour
  },
  // Public API - moderate limits
  api: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    limit: 60, // 60 requests per minute
  },
  // Blog/Manga read endpoints - generous for readers
  content: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
    limit: 100, // 100 reads per minute
  },
  // Admin routes - moderate limits
  admin: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
    limit: 30, // 30 admin actions per minute
  },
  // Contact/Email - prevent spam
  contact: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 100,
    limit: 5, // 5 contact submissions per hour
  },
};

/**
 * Create a rate limiter instance
 * Uses LRU cache for in-memory rate limiting
 * Can be extended to use Redis for distributed environments
 */
export function createRateLimiter(options = {}) {
  const {
    interval = 60 * 1000,
    uniqueTokenPerInterval = 500,
    limit = 10,
  } = options;

  const tokenCache = new LRUCache({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    /**
     * Check if a token (IP/user) has exceeded rate limit
     * @param {string} token - Unique identifier (IP address or user ID)
     * @returns {Object} - { success, limit, remaining, reset }
     */
    check: (token) => {
      const now = Date.now();
      const tokenCount = tokenCache.get(token) || { count: 0, resetTime: now + interval };
      
      // Reset if interval has passed
      if (now > tokenCount.resetTime) {
        tokenCount.count = 0;
        tokenCount.resetTime = now + interval;
      }

      tokenCount.count += 1;
      tokenCache.set(token, tokenCount);

      const remaining = Math.max(0, limit - tokenCount.count);
      const success = tokenCount.count <= limit;

      return {
        success,
        limit,
        remaining,
        reset: tokenCount.resetTime,
        current: tokenCount.count,
      };
    },

    /**
     * Reset rate limit for a specific token
     * @param {string} token - Unique identifier to reset
     */
    reset: (token) => {
      tokenCache.delete(token);
    },
  };
}

// Pre-configured rate limiters for different route types
const rateLimiters = {
  auth: createRateLimiter(RATE_LIMIT_CONFIGS.auth),
  otp: createRateLimiter(RATE_LIMIT_CONFIGS.otp),
  api: createRateLimiter(RATE_LIMIT_CONFIGS.api),
  content: createRateLimiter(RATE_LIMIT_CONFIGS.content),
  admin: createRateLimiter(RATE_LIMIT_CONFIGS.admin),
  contact: createRateLimiter(RATE_LIMIT_CONFIGS.contact),
};

/**
 * Get client IP address from request
 * Handles proxies and various header formats
 */
function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || 
         req.socket?.remoteAddress || 
         req.connection?.remoteAddress ||
         "unknown";
}

/**
 * Rate limiting middleware for Next.js API routes
 * @param {string} type - Rate limit type: 'auth', 'otp', 'api', 'content', 'admin', 'contact'
 * @returns {Function} - Middleware function
 */
export function withRateLimit(handler, type = "api") {
  const limiter = rateLimiters[type] || rateLimiters.api;
  const config = RATE_LIMIT_CONFIGS[type] || RATE_LIMIT_CONFIGS.api;

  return async (req, res) => {
    const ip = getClientIP(req);
    // Use route-specific key so different endpoints don't share rate limit counters
    const route = req.url?.split("?")[0] || "";
    const key = `${type}:${route}:${ip}`;
    const result = limiter.check(key);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", config.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.reset);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      res.setHeader("Retry-After", retryAfter);
      
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: config.limit,
        type,
      });
    }

    return handler(req, res);
  };
}

/**
 * Combine rate limiting with other middleware
 * @param {Function} handler - Original handler
 * @param {string} rateLimitType - Rate limit type
 * @param {Function[]} middlewares - Additional middlewares to apply
 */
export function withRateLimitAndMiddleware(handler, rateLimitType, ...middlewares) {
  let wrappedHandler = handler;
  
  // Apply additional middlewares in reverse order
  for (let i = middlewares.length - 1; i >= 0; i--) {
    wrappedHandler = middlewares[i](wrappedHandler);
  }
  
  // Apply rate limiting as outermost layer
  return withRateLimit(wrappedHandler, rateLimitType);
}

export default {
  createRateLimiter,
  withRateLimit,
  withRateLimitAndMiddleware,
  RATE_LIMIT_CONFIGS,
  rateLimiters,
};
