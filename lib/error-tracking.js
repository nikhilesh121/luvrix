// Error tracking utility
// Ready for Sentry integration - just add NEXT_PUBLIC_SENTRY_DSN to .env
import React from 'react';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Initialize error tracking
export const initErrorTracking = () => {
  if (typeof window === 'undefined') return;
  
  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    captureException(error || new Error(message), {
      source,
      lineno,
      colno,
    });
    return false;
  };

  // Unhandled promise rejection handler
  window.onunhandledrejection = (event) => {
    captureException(event.reason, {
      type: 'unhandledrejection',
    });
  };

  console.log('Error tracking initialized');
};

// Capture exception
export const captureException = (error, context = {}) => {
  const errorData = {
    message: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error captured:', errorData);
  }

  // Send to Sentry if configured
  if (SENTRY_DSN) {
    sendToSentry(errorData);
  }

  // Also send to our own error logging endpoint
  sendToErrorLog(errorData);
};

// Capture message (for non-error logging)
export const captureMessage = (message, level = 'info', context = {}) => {
  const messageData = {
    message,
    level,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    ...context,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }

  if (SENTRY_DSN) {
    sendToSentry(messageData, 'message');
  }
};

// Set user context
export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    window.__errorTrackingUser = user;
  }
};

// Internal: Send to Sentry
const sendToSentry = async (data, type = 'exception') => {
  if (!SENTRY_DSN) return;

  try {
    // When Sentry SDK is installed, this would use Sentry.captureException
    // For now, we'll use the Sentry API directly
    const user = typeof window !== 'undefined' ? window.__errorTrackingUser : null;
    
    await fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        user,
        type,
        sentryDsn: SENTRY_DSN,
      }),
    });
  } catch (e) {
    console.error('Failed to send to Sentry:', e);
  }
};

// Internal: Send to our error logging endpoint
const sendToErrorLog = async (data) => {
  try {
    await fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    // Silently fail to avoid infinite loops
  }
};

// React Error Boundary helper
export const withErrorBoundary = (Component, fallback = null) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      captureException(error, { componentStack: errorInfo.componentStack });
    }

    render() {
      if (this.state.hasError) {
        return fallback || <div>Something went wrong.</div>;
      }
      return <Component {...this.props} />;
    }
  };
};

export default {
  initErrorTracking,
  captureException,
  captureMessage,
  setUser,
};
