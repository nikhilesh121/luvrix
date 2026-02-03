/**
 * Enterprise Structured Logging Module
 * Sprint 5 - Observability & Monitoring
 * 
 * Provides structured JSON logging for production environments
 * Compatible with log aggregators (Datadog, Loki, CloudWatch)
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Determine if a log level should be output
 */
function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

/**
 * Format timestamp in ISO 8601
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Get request context for logging
 */
function getRequestContext(req) {
  if (!req) return {};
  
  return {
    method: req.method,
    url: req.url,
    userAgent: req.headers?.['user-agent'],
    ip: req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 
        req.headers?.['x-real-ip'] || 
        req.socket?.remoteAddress || 
        'unknown',
    requestId: req.headers?.['x-request-id'] || generateRequestId(),
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Core logging function - outputs structured JSON
 */
function log(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  const logEntry = {
    timestamp: getTimestamp(),
    level: level.toUpperCase(),
    message,
    service: 'luvrix-webapp',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    ...meta,
  };

  // Add error stack if present
  if (meta.error instanceof Error) {
    logEntry.error = {
      name: meta.error.name,
      message: meta.error.message,
      stack: meta.error.stack,
    };
    delete meta.error;
  }

  const output = JSON.stringify(logEntry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }

  return logEntry;
}

/**
 * Logger instance with level-specific methods
 */
const logger = {
  error: (message, meta = {}) => log('error', message, meta),
  warn: (message, meta = {}) => log('warn', message, meta),
  info: (message, meta = {}) => log('info', message, meta),
  http: (message, meta = {}) => log('http', message, meta),
  debug: (message, meta = {}) => log('debug', message, meta),

  /**
   * Log an API request
   */
  request: (req, res, duration) => {
    const context = getRequestContext(req);
    return log('http', 'API Request', {
      ...context,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  },

  /**
   * Log an error with request context
   */
  apiError: (error, req, meta = {}) => {
    const context = getRequestContext(req);
    return log('error', error.message || 'API Error', {
      ...context,
      error,
      ...meta,
    });
  },

  /**
   * Log a database operation
   */
  db: (operation, collection, duration, meta = {}) => {
    return log('debug', 'Database Operation', {
      operation,
      collection,
      duration: `${duration}ms`,
      ...meta,
    });
  },

  /**
   * Log authentication events
   */
  auth: (event, userId, meta = {}) => {
    return log('info', `Auth: ${event}`, {
      userId,
      event,
      ...meta,
    });
  },

  /**
   * Log security events (rate limiting, blocked requests)
   */
  security: (event, meta = {}) => {
    return log('warn', `Security: ${event}`, {
      event,
      category: 'security',
      ...meta,
    });
  },

  /**
   * Log business metrics
   */
  metric: (name, value, meta = {}) => {
    return log('info', 'Metric', {
      metric: name,
      value,
      ...meta,
    });
  },
};

/**
 * Middleware for logging API requests
 */
export function withRequestLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    // Attach request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    try {
      const result = await handler(req, res);
      
      // Log successful request
      const duration = Date.now() - startTime;
      logger.request(req, res, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.apiError(error, req, { duration: `${duration}ms` });
      throw error;
    }
  };
}

/**
 * Create a child logger with preset context
 */
export function createLogger(context = {}) {
  return {
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    http: (message, meta = {}) => logger.http(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
  };
}

export default logger;
