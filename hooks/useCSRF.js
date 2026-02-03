/**
 * CSRF Token React Hook
 * Sprint 2 - Critical Security Fix
 * 
 * Usage:
 * const { csrfToken, fetchWithCSRF } = useCSRF();
 * 
 * // In forms:
 * <input type="hidden" name="_csrf" value={csrfToken} />
 * 
 * // In fetch calls:
 * fetchWithCSRF('/api/endpoint', { method: 'POST', body: data });
 */

import { useState, useEffect, useCallback } from 'react';

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch CSRF token on mount
  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/csrf-token');
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const data = await response.json();
      setCSRFToken(data.token);
      setError(null);
    } catch (err) {
      console.error('CSRF token fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Helper function for making CSRF-protected fetch requests
  const fetchWithCSRF = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'x-csrf-token': csrfToken,
    };

    // If body is an object (not FormData), stringify it
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ ...body, _csrf: csrfToken });
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // If CSRF token expired, refresh and retry once
    if (response.status === 403) {
      const errorData = await response.json();
      if (errorData.error === 'Invalid CSRF token') {
        await fetchToken();
        // Retry with new token
        return fetch(url, {
          ...options,
          headers: {
            ...headers,
            'x-csrf-token': csrfToken,
          },
          body,
        });
      }
    }

    return response;
  }, [csrfToken, fetchToken]);

  // Refresh token manually
  const refreshToken = useCallback(() => {
    return fetchToken();
  }, [fetchToken]);

  return {
    csrfToken,
    loading,
    error,
    fetchWithCSRF,
    refreshToken,
  };
}

export default useCSRF;
