// API Configuration for Frontend-Backend Separation
// Frontend: Hostinger (static)
// Backend API: This server

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Helper to get full API URL
export function getApiUrl(endpoint) {
  // If API_BASE_URL is set, use it (for static export on Hostinger)
  // Otherwise, use relative URLs (for SSR on same server)
  if (API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return endpoint;
}

// Fetch wrapper with API base URL
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  
  // Add credentials for cross-origin requests
  const fetchOptions = {
    ...options,
    credentials: API_BASE_URL ? 'include' : 'same-origin',
  };
  
  return fetch(url, fetchOptions);
}

export default API_BASE_URL;
