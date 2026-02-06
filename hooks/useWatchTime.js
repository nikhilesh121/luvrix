import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

/**
 * useWatchTime - Tracks active reading/watch time per page
 * 
 * Features:
 * - Only counts time when tab is visible (document.hidden === false)
 * - Only counts one active page per session
 * - Sends heartbeat every 15 seconds with accumulated watch time
 * - Sends final time on page unload / route change
 */
export default function useWatchTime() {
  const router = useRouter();
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(0);
  const isVisibleRef = useRef(true);
  const currentPathRef = useRef('');
  const heartbeatRef = useRef(null);

  const sendWatchTime = useCallback((path, seconds) => {
    if (!path || seconds < 1) return;
    try {
      const data = JSON.stringify({ path, seconds: Math.round(seconds) });
      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/watchtime', data);
      } else {
        fetch('/api/analytics/watchtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      // silent
    }
  }, []);

  const pauseTracking = useCallback(() => {
    if (startTimeRef.current && isVisibleRef.current) {
      accumulatedRef.current += (Date.now() - startTimeRef.current) / 1000;
      startTimeRef.current = null;
    }
    isVisibleRef.current = false;
  }, []);

  const resumeTracking = useCallback(() => {
    isVisibleRef.current = true;
    startTimeRef.current = Date.now();
  }, []);

  const flushAndReset = useCallback((path) => {
    pauseTracking();
    const total = accumulatedRef.current;
    if (total >= 1) {
      sendWatchTime(path, total);
    }
    accumulatedRef.current = 0;
    startTimeRef.current = null;
  }, [pauseTracking, sendWatchTime]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pauseTracking();
      } else {
        resumeTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pauseTracking, resumeTracking]);

  // Track page changes
  useEffect(() => {
    const path = router.asPath;

    // Flush previous page time
    if (currentPathRef.current && currentPathRef.current !== path) {
      flushAndReset(currentPathRef.current);
    }

    // Start tracking new page
    currentPathRef.current = path;
    accumulatedRef.current = 0;
    isVisibleRef.current = !document.hidden;
    if (isVisibleRef.current) {
      startTimeRef.current = Date.now();
    }

    // Heartbeat every 15 seconds
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      if (isVisibleRef.current && startTimeRef.current) {
        const elapsed = accumulatedRef.current + (Date.now() - startTimeRef.current) / 1000;
        sendWatchTime(currentPathRef.current, elapsed);
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatRef.current);
    };
  }, [router.asPath, flushAndReset, sendWatchTime]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => {
      flushAndReset(currentPathRef.current);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flushAndReset]);
}
