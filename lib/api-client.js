// Client-side API wrapper for database operations
// This file should be used by client-side components instead of lib/db.js

const API_BASE = "/api";
const MUTATING_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

let _csrfToken = null;
let _csrfPromise = null;

async function getCSRFToken() {
  if (_csrfToken) return _csrfToken;
  if (_csrfPromise) return _csrfPromise;
  _csrfPromise = fetch("/api/csrf-token")
    .then(r => r.json())
    .then(d => { _csrfToken = d.token; _csrfPromise = null; return _csrfToken; })
    .catch(() => { _csrfPromise = null; return ""; });
  return _csrfPromise;
}

function clearCSRFToken() { _csrfToken = null; }

async function fetchAPI(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (MUTATING_METHODS.includes(method)) {
    const token = await getCSRFToken();
    if (token) headers["x-csrf-token"] = token;
  }

  // Attach JWT auth token for authenticated requests
  if (typeof window !== "undefined") {
    const authToken = localStorage.getItem("luvrix_auth_token");
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Ensure trailing slash to match trailingSlash:true in next.config.js
  // Without this, PUT/POST/DELETE get 308-redirected and lose their body
  const normalizedEndpoint = endpoint.includes("?")
    ? (endpoint.split("?")[0].endsWith("/") ? endpoint : endpoint.replace("?", "/?"))
    : (endpoint.endsWith("/") ? endpoint : endpoint + "/");

  const res = await fetch(`${API_BASE}${normalizedEndpoint}`, { ...options, headers });
  
  const text = await res.text();
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse response:", text);
    data = { error: "Invalid response from server" };
  }

  // If CSRF token was rejected, refresh and retry once
  if (res.status === 403 && data.error === "Invalid CSRF token") {
    clearCSRFToken();
    const freshToken = await getCSRFToken();
    if (freshToken) headers["x-csrf-token"] = freshToken;
    const retry = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const retryText = await retry.text();
    try { data = retryText ? JSON.parse(retryText) : {}; } catch { data = { error: "Invalid response from server" }; }
    if (!retry.ok) throw new Error(data.error || "Request failed");
    return data;
  }
  
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  
  return data;
}

// Blog operations
export const getAllBlogs = (status = "approved", all = false) => 
  fetchAPI(`/blogs?${all ? "all=true" : `status=${status}`}`);

export const getBlog = (id) => 
  fetchAPI(`/blogs/${id}`);

export const getBlogBySlug = (slug) => 
  fetchAPI(`/blogs/slug/${slug}`);

export const getUserBlogs = (userId, status) => 
  fetchAPI(`/blogs?userId=${userId}${status ? `&status=${status}` : ""}`);

export const createBlog = (data) => 
  fetchAPI("/blogs", { method: "POST", body: JSON.stringify(data) });

export const updateBlog = (id, data) => 
  fetchAPI(`/blogs/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteBlog = (id) => 
  fetchAPI(`/blogs/${id}`, { method: "DELETE" });

export const incrementBlogViews = (id) => 
  fetchAPI(`/blogs/${id}/views`, { method: "POST" });

export const likeBlog = (blogId, userId) => 
  fetchAPI(`/blogs/${blogId}/like`, { method: "POST", body: JSON.stringify({ userId }) });

export const unlikeBlog = (blogId, userId) => 
  fetchAPI(`/blogs/${blogId}/unlike`, { method: "POST", body: JSON.stringify({ userId }) });

// User operations
export const getUser = (id) => 
  fetchAPI(`/users/${id}`);

export const getUserByEmail = (email) => 
  fetchAPI(`/users/email/${encodeURIComponent(email)}`);

export const getUserByUniqueId = (uniqueId) => 
  fetchAPI(`/users/unique/${uniqueId}`);

export const getAllUsers = () => 
  fetchAPI("/users");

export const getPublishers = () => 
  fetchAPI("/users?publishers=true");

export const updateUser = (id, data) => 
  fetchAPI(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getUserStats = (userId) => 
  fetchAPI(`/users/${userId}/stats`);

// Settings
export const getSettings = () => 
  fetchAPI("/settings");

export const updateSettings = (data) => 
  fetchAPI("/settings", { method: "PUT", body: JSON.stringify(data) });

// Comments
export const getComments = (targetId, targetType = "blog") => 
  fetchAPI(`/comments?targetId=${targetId}&targetType=${targetType}`);

export const createComment = (data) => 
  fetchAPI("/comments", { method: "POST", body: JSON.stringify(data) });

export const deleteComment = (id) => 
  fetchAPI(`/comments/${id}`, { method: "DELETE" });

export const likeComment = (commentId, userId) => 
  fetchAPI(`/comments/${commentId}/like`, { method: "POST", body: JSON.stringify({ userId }) });

// Follow operations
export const followUser = (followerId, followingId) => 
  fetchAPI("/follow", { method: "POST", body: JSON.stringify({ followerId, followingId }) });

export const unfollowUser = (followerId, followingId) => 
  fetchAPI("/follow", { method: "DELETE", body: JSON.stringify({ followerId, followingId }) });

export const isFollowing = (followerId, followingId) => 
  fetchAPI(`/follow/check?followerId=${followerId}&followingId=${followingId}`);

export const getFollowers = (userId) => 
  fetchAPI(`/users/${userId}/followers`);

export const getFollowing = (userId) => 
  fetchAPI(`/users/${userId}/following`);

// Favorites
export const addToFavorites = (userId, itemId, itemType) => 
  fetchAPI("/favorites", { method: "POST", body: JSON.stringify({ userId, itemId, itemType }) });

export const removeFromFavorites = (favoriteId) => 
  fetchAPI(`/favorites/${favoriteId}`, { method: "DELETE" });

export const getUserFavorites = (userId) => 
  fetchAPI(`/favorites?userId=${userId}`);

export const isFavorite = (userId, itemId) => 
  fetchAPI(`/favorites/check?userId=${userId}&itemId=${itemId}`);

// Libraries
export const getUserLibraries = (userId) => 
  fetchAPI(`/libraries?userId=${userId}`);

export const createLibrary = (data) => 
  fetchAPI("/libraries", { method: "POST", body: JSON.stringify(data) });

export const updateLibrary = (id, data) => 
  fetchAPI(`/libraries/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteLibrary = (id) => 
  fetchAPI(`/libraries/${id}`, { method: "DELETE" });

export const addBlogToLibrary = (libraryId, blogId) => 
  fetchAPI(`/libraries/${libraryId}/blogs`, { method: "POST", body: JSON.stringify({ blogId }) });

export const removeBlogFromLibrary = (libraryId, blogId) => 
  fetchAPI(`/libraries/${libraryId}/blogs/${blogId}`, { method: "DELETE" });

// Manga operations
export const getAllManga = () => 
  fetchAPI("/manga");

export const getMangaBySlug = (slug) => 
  fetchAPI(`/manga/${slug}`);

// Leaderboard
export const getLeaderboardWithAllUsers = () => 
  fetchAPI("/leaderboard");

// Payments
export const getUserPayments = (userId) => 
  fetchAPI(`/payments?userId=${userId}`);

export const createPayment = (data) => 
  fetchAPI("/payments", { method: "POST", body: JSON.stringify(data) });

// Ads
export const getAds = () => 
  fetchAPI("/ads");

// Subscribers
export const addSubscriber = (email) => 
  fetchAPI("/subscribers", { method: "POST", body: JSON.stringify({ email }) });

// Post status
export const getPostStatus = (userId) => 
  fetchAPI(`/users/${userId}/post-status`);

export const consumeFreePost = (userId) => 
  fetchAPI(`/users/${userId}/consume-post`, { method: "POST" });

// Trending
export const getTrendingTopics = () => 
  fetchAPI("/trending");

// Admin operations
export const createLog = (data) => 
  fetchAPI("/admin/logs", { method: "POST", body: JSON.stringify(data) });

export const getLogs = () => 
  fetchAPI("/admin/logs");

export const approveBlog = (blogId) => 
  fetchAPI(`/blogs/${blogId}/approve`, { method: "POST" });

export const rejectBlog = (blogId, reason) => 
  fetchAPI(`/blogs/${blogId}/reject`, { method: "POST", body: JSON.stringify({ reason }) });

export const incrementBlogShares = (blogId) => 
  fetchAPI(`/blogs/${blogId}/shares`, { method: "POST" });

export const getAllPayments = () => 
  fetchAPI("/payments");

// Draft operations
export const getBlogDrafts = () => 
  fetchAPI("/drafts");

export const getBlogDraft = (id) => 
  fetchAPI(`/drafts/${id}`);

export const createBlogDraft = (data) => 
  fetchAPI("/drafts", { method: "POST", body: JSON.stringify(data) });

export const updateBlogDraft = (id, data) => 
  fetchAPI(`/drafts/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteBlogDraft = (id) => 
  fetchAPI(`/drafts/${id}`, { method: "DELETE" });

export const publishBlogDraft = (id, data) => 
  fetchAPI(`/drafts/${id}/publish`, { method: "POST", body: JSON.stringify(data) });

// Manga admin operations
export const createManga = (data) => 
  fetchAPI("/manga", { method: "POST", body: JSON.stringify(data) });

export const updateManga = (slug, data) => 
  fetchAPI(`/manga/${slug}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteManga = (slug) => 
  fetchAPI(`/manga/${slug}`, { method: "DELETE" });

export const addMangaChapter = (slug, chapter) => 
  fetchAPI(`/manga/${slug}/chapters`, { method: "POST", body: JSON.stringify(chapter) });

export const updateMangaChapter = (slug, chapterNum, data) => 
  fetchAPI(`/manga/${slug}/chapters/${chapterNum}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteMangaChapter = (slug, chapterNum) => 
  fetchAPI(`/manga/${slug}/chapters/${chapterNum}`, { method: "DELETE" });

// User admin operations
export const createUser = (userId, data) => 
  fetchAPI("/users", { method: "POST", body: JSON.stringify({ userId, ...data }) });

export const blockUser = (userId) => 
  fetchAPI(`/users/${userId}/block`, { method: "POST" });

export const unblockUser = (userId) => 
  fetchAPI(`/users/${userId}/unblock`, { method: "POST" });

// Ads admin operations
export const createAd = (data) => 
  fetchAPI("/ads", { method: "POST", body: JSON.stringify(data) });

export const updateAd = (id, data) => 
  fetchAPI(`/ads/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteAd = (id) => 
  fetchAPI(`/ads/${id}`, { method: "DELETE" });

// Subscribers admin
export const getAllSubscribers = () => 
  fetchAPI("/subscribers");

export const deleteSubscriber = (id) => 
  fetchAPI(`/subscribers/${id}`, { method: "DELETE" });

// Trending admin
export const createTrendingTopic = (data) => 
  fetchAPI("/trending", { method: "POST", body: JSON.stringify(data) });

export const updateTrendingTopic = (id, data) => 
  fetchAPI(`/trending/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteTrendingTopic = (id) => 
  fetchAPI(`/trending/${id}`, { method: "DELETE" });

// Sitemap
export const getSitemapUrls = () => 
  fetchAPI("/sitemap/urls");

export const updateSitemapUrl = (id, data) => 
  fetchAPI(`/sitemap/urls/${id}`, { method: "PUT", body: JSON.stringify(data) });

// PayU config
export const getPayuConfig = () => 
  fetchAPI("/payu/config");

export const updatePayuConfig = (data) => 
  fetchAPI("/payu/config", { method: "PUT", body: JSON.stringify(data) });

// Preview blog
export const getPreviewBlog = (id) => 
  fetchAPI(`/blogs/${id}/preview`);

// Blog likes check
export const hasLikedBlog = (blogId, visitorId) => 
  fetchAPI(`/blogs/${blogId}/liked?visitorId=${visitorId}`);

// Payment operations
export const updatePayment = (txnId, data) => 
  fetchAPI(`/payments/${txnId}`, { method: "PUT", body: JSON.stringify(data) });

export const addExtraPosts = (userId, posts) => 
  fetchAPI(`/users/${userId}/extra-posts`, { method: "POST", body: JSON.stringify({ posts }) });

// Admin user points management
export const updateUserPoints = (userId, points) => 
  fetchAPI(`/admin/users/${userId}/points`, { method: "PUT", body: JSON.stringify({ points }) });

// User management
export const deleteUser = (id) => 
  fetchAPI(`/users/${id}`, { method: "DELETE" });

export const hideUserPosts = (userId) => 
  fetchAPI(`/users/${userId}/hide-posts`, { method: "POST" });

export const unhideUserPosts = (userId) => 
  fetchAPI(`/users/${userId}/unhide-posts`, { method: "POST" });

export const incrementFreePostsUsed = (userId) => 
  fetchAPI(`/users/${userId}/increment-free-posts`, { method: "POST" });

export const decrementExtraPosts = (userId) => 
  fetchAPI(`/users/${userId}/decrement-extra-posts`, { method: "POST" });

// Blog likes check
export const isBlogLiked = (blogId, visitorId) => 
  fetchAPI(`/blogs/${blogId}/liked?visitorId=${visitorId}`);

// Subscriber operations
export const updateSubscriberStatus = (id, status) => 
  fetchAPI(`/subscribers/${id}`, { method: "PUT", body: JSON.stringify({ status }) });

// Blog draft generation
export const generateBlogDraft = (data) => 
  fetchAPI("/generate-draft", { method: "POST", body: JSON.stringify(data) });

// Manga operations
export const incrementMangaViews = (slug) => 
  fetchAPI(`/manga/${slug}/views`, { method: "POST" });

export const isItemFavorited = (itemId, userId, itemType = "manga") => 
  fetchAPI(`/favorites/check?itemId=${itemId}&userId=${userId}&itemType=${itemType}`);

export const incrementMangaFavorites = (slug) => 
  fetchAPI(`/manga/${slug}/favorites`, { method: "POST" });

export const decrementMangaFavorites = (slug) => 
  fetchAPI(`/manga/${slug}/favorites`, { method: "DELETE" });

// Referral operations
export const getUserReferrals = (userId) => 
  fetchAPI(`/referrals?userId=${userId}`);

export const getReferralStats = (userId) => 
  fetchAPI(`/referrals?userId=${userId}&stats=true`);

export const generateReferralCode = (userId) => 
  fetchAPI("/referrals", { method: "POST", body: JSON.stringify({ userId }) });

export const applyReferralCode = (code, referredId) => 
  fetchAPI("/referrals/apply", { method: "POST", body: JSON.stringify({ code, referredId }) });

export const completeReferral = (referredId) => 
  fetchAPI("/referrals/complete", { method: "POST", body: JSON.stringify({ referredId }) });

export const getReferralSettings = () => 
  fetchAPI("/referrals/settings");

export const updateReferralSettings = (data) => 
  fetchAPI("/referrals/settings", { method: "PUT", body: JSON.stringify(data) });

// Giveaway operations
export const listGiveaways = (status) =>
  fetchAPI(`/giveaways${status ? `?status=${status}` : ""}`);

export const getGiveaway = (idOrSlug) =>
  fetchAPI(`/giveaways/${idOrSlug}`);

export const createGiveaway = (data) =>
  fetchAPI("/giveaways", { method: "POST", body: JSON.stringify(data) });

export const updateGiveawayApi = (id, data) =>
  fetchAPI(`/giveaways/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteGiveaway = (id) =>
  fetchAPI(`/giveaways/${id}`, { method: "DELETE" });

export const joinGiveaway = (id) =>
  fetchAPI(`/giveaways/${id}/join`, { method: "POST" });

export const getGiveawayTasks = (id) =>
  fetchAPI(`/giveaways/${id}/tasks`);

export const addGiveawayTask = (id, data) =>
  fetchAPI(`/giveaways/${id}/tasks`, { method: "POST", body: JSON.stringify(data) });

export const removeGiveawayTask = (id, taskId) =>
  fetchAPI(`/giveaways/${id}/tasks`, { method: "DELETE", body: JSON.stringify({ taskId }) });

export const startGiveawayTask = (id, taskId) =>
  fetchAPI(`/giveaways/${id}/start-task`, { method: "POST", body: JSON.stringify({ taskId }) });

export const completeGiveawayTask = (id, taskId) =>
  fetchAPI(`/giveaways/${id}/complete-task`, { method: "POST", body: JSON.stringify({ taskId }) });

export const getGiveawayParticipants = (id, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchAPI(`/giveaways/${id}/participants${query ? `?${query}` : ""}`);
};

export const getGiveawayParticipantCount = (id) =>
  fetchAPI(`/giveaways/${id}/participants?countOnly=true`);

export const selectGiveawayWinner = (id, data) =>
  fetchAPI(`/giveaways/${id}/winner`, { method: "POST", body: JSON.stringify(data) });

export const getMyGiveawayStatus = (id) =>
  fetchAPI(`/giveaways/${id}/my-status`);

export const submitGiveawayInvite = (id, inviteCode) =>
  fetchAPI(`/giveaways/${id}/invite`, { method: "POST", body: JSON.stringify({ inviteCode }) });

export const getMyGiveaways = () =>
  fetchAPI("/giveaways/my-giveaways");

export const getGiveawayWinnerInfo = (id) =>
  fetchAPI(`/giveaways/${id}/winner-info`);

export const submitWinnerShipping = (id, data) =>
  fetchAPI(`/giveaways/${id}/shipping`, { method: "POST", body: JSON.stringify(data) });

export const getGiveawaySupportTotals = (id) =>
  fetchAPI(`/giveaways/${id}/support`);

export const recordGiveawaySupportApi = (id, amount) =>
  fetchAPI(`/giveaways/${id}/support`, { method: "POST", body: JSON.stringify({ amount }) });

// PayU operations
export const initiatePayment = (data) => 
  fetchAPI("/payu/initiate", { method: "POST", body: JSON.stringify(data) });

