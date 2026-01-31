// Device-based view tracking utility
// Tracks unique views per device per blog per day

const STORAGE_KEY = 'luvrix_blog_views';
const VIEW_EXPIRY_HOURS = 24;

// Generate a unique device ID
export const getDeviceId = () => {
  if (typeof window === 'undefined') return null;
  
  let deviceId = localStorage.getItem('luvrix_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('luvrix_device_id', deviceId);
  }
  return deviceId;
};

// Get stored views data
const getStoredViews = () => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save views data
const saveViews = (views) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
};

// Clean up expired views
const cleanExpiredViews = (views) => {
  const now = Date.now();
  const expiryMs = VIEW_EXPIRY_HOURS * 60 * 60 * 1000;
  
  const cleaned = {};
  Object.entries(views).forEach(([blogId, timestamp]) => {
    if (now - timestamp < expiryMs) {
      cleaned[blogId] = timestamp;
    }
  });
  
  return cleaned;
};

// Check if a view should be counted for a blog
export const shouldCountView = (blogId) => {
  if (typeof window === 'undefined') return false;
  
  const views = cleanExpiredViews(getStoredViews());
  saveViews(views);
  
  return !views[blogId];
};

// Record a view for a blog
export const recordView = (blogId) => {
  if (typeof window === 'undefined') return;
  
  const views = cleanExpiredViews(getStoredViews());
  views[blogId] = Date.now();
  saveViews(views);
};

// Check and record view in one operation
export const trackView = (blogId) => {
  if (shouldCountView(blogId)) {
    recordView(blogId);
    return true; // View should be counted
  }
  return false; // View already counted today
};

// Get user ID generator for leaderboard
export const generateUserId = () => {
  return 'LX' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

export default {
  getDeviceId,
  shouldCountView,
  recordView,
  trackView,
  generateUserId,
};
