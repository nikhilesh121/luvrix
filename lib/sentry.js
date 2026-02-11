/**
 * Sentry Error Monitoring Integration
 * Sprint 2 - Critical Operations Fix
 * 
 * Setup:
 * 1. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 2. Import and call initSentry() in _app.js
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || "development";
const APP_VERSION = process.env.npm_package_version || "1.0.0";

let Sentry = null;
let isInitialized = false;

/**
 * Initialize Sentry error monitoring
 * Call this in _app.js or at app startup
 */
export async function initSentry() {
  if (isInitialized) return Sentry;
  
  if (!SENTRY_DSN) {
    console.warn("[Sentry] DSN not configured. Error monitoring disabled.");
    console.warn("[Sentry] Add NEXT_PUBLIC_SENTRY_DSN to .env.local to enable.");
    return null;
  }

  try {
    // Dynamic import to avoid bundling Sentry if not used
    Sentry = await import("@sentry/nextjs");
    
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `luvrix@${APP_VERSION}`,
      
      // Performance monitoring
      tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
      
      // Session replay (optional)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Filter out known non-critical errors
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
        /Loading chunk \d+ failed/,
        /Network request failed/,
      ],
      
      // Before sending error, add extra context
      beforeSend(event, _hint) {
        // Don't send errors in development
        if (ENVIRONMENT === "development") {
          console.error("[Sentry] Would send:", event);
          return null;
        }
        return event;
      },
    });

    isInitialized = true;
    console.log("[Sentry] Error monitoring initialized");
    return Sentry;
  } catch (error) {
    console.error("[Sentry] Failed to initialize:", error);
    return null;
  }
}

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  if (Sentry && isInitialized) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("[Sentry] Not initialized. Error:", error);
  }
}

/**
 * Capture a message manually
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export function captureMessage(message, level = "info") {
  if (Sentry && isInitialized) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry] ${level}: ${message}`);
  }
}

/**
 * Set user context for error tracking
 * @param {Object} user - User object with id, email, username
 */
export function setUser(user) {
  if (Sentry && isInitialized) {
    Sentry.setUser({
      id: user.id || user.uid,
      email: user.email,
      username: user.displayName || user.name,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  if (Sentry && isInitialized) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb) {
  if (Sentry && isInitialized) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

/**
 * Create a performance transaction
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 */
export function startTransaction(name, op = "custom") {
  if (Sentry && isInitialized) {
    return Sentry.startTransaction({ name, op });
  }
  return null;
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
};
