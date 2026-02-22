import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { sanitizeBlogContent, sanitizeText, sanitizeURL } from "./sanitize";
import { autoIndex, autoDeindex } from "./auto-index";

// Initialize Firebase Admin if not already initialized
let db;

const getDb = () => {
  if (db) return db;
  
  if (admin.apps.length === 0) {
    // For server-side, use service account
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), "serviceAccountKey.json");
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "singlestore-14943",
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "singlestore-14943",
      });
    } else {
      admin.initializeApp({ projectId: "singlestore-14943" });
    }
  }
  
  db = admin.firestore();
  return db;
};

// Helper to get server timestamp
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();
const increment = (n) => admin.firestore.FieldValue.increment(n);
const arrayUnion = (...elements) => admin.firestore.FieldValue.arrayUnion(...elements);
const arrayRemove = (...elements) => admin.firestore.FieldValue.arrayRemove(...elements);

// Helper to serialize Firestore document
const serializeDoc = (doc) => {
  if (!doc || !doc.exists) return null;
  const data = doc.data();
  // Convert Timestamps to Date objects
  const serialized = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value && value.toDate) {
      serialized[key] = value.toDate();
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
};

// Helper to serialize query snapshot
const serializeDocs = (snapshot) => {
  return snapshot.docs.map(doc => serializeDoc(doc));
};

// ============================================
// USER FUNCTIONS
// ============================================

export const generateUserId = async () => {
  const db = getDb();
  const today = new Date();
  const datePrefix = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  
  const snapshot = await db.collection("users")
    .where("uniqueId", ">=", datePrefix)
    .where("uniqueId", "<", datePrefix + "\uf8ff")
    .get();
  
  let maxSeq = 0;
  snapshot.forEach(doc => {
    const user = doc.data();
    if (user.uniqueId && user.uniqueId.startsWith(datePrefix)) {
      const seq = parseInt(user.uniqueId.slice(-4));
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return datePrefix + nextSeq;
};

export const createUser = async (id, data) => {
  const db = getDb();
  const uniqueId = await generateUserId();
  
  const userData = {
    ...data,
    uniqueId,
    role: data.role || "USER",
    blocked: false,
    freePostsUsed: 0,
    extraPosts: 0,
    photoURL: data.photoURL || "",
    createdAt: new Date(),
  };
  
  await db.collection("users").doc(id).set(userData);
  return { uniqueId, id, ...userData };
};

export const getUser = async (id) => {
  const db = getDb();
  const doc = await db.collection("users").doc(id).get();
  return serializeDoc(doc);
};

export const getUserByUniqueId = async (uniqueId) => {
  const db = getDb();
  const snapshot = await db.collection("users").where("uniqueId", "==", uniqueId).limit(1).get();
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const getUserByEmail = async (email) => {
  const db = getDb();
  const snapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const getUserByUsername = async (username) => {
  const db = getDb();
  const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const updateUser = async (id, data) => {
  const db = getDb();
  await db.collection("users").doc(id).update({ ...data, updatedAt: new Date() });
};

export const deleteUser = async (id) => {
  const db = getDb();
  await db.collection("users").doc(id).delete();
};

export const getBlockedUserIds = async () => {
  const db = getDb();
  const snapshot = await db.collection("users").where("blocked", "==", true).get();
  return snapshot.docs.map(doc => doc.id);
};

export const hideUserPosts = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("blogs").where("authorId", "==", userId).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: "hidden" });
  });
  await batch.commit();
  return { success: true, count: snapshot.size };
};

export const unhideUserPosts = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("blogs")
    .where("authorId", "==", userId)
    .where("status", "==", "hidden")
    .get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: "approved" });
  });
  await batch.commit();
  return { success: true, count: snapshot.size };
};

export const getAllUsers = async () => {
  const db = getDb();
  const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
  return serializeDocs(snapshot);
};

// ============================================
// BLOG FUNCTIONS
// ============================================

export const createBlog = async (data) => {
  const db = getDb();
  
  const sanitizedData = {
    ...data,
    title: data.title ? sanitizeText(data.title) : data.title,
    content: data.content ? sanitizeBlogContent(data.content) : data.content,
    excerpt: data.excerpt ? sanitizeText(data.excerpt) : data.excerpt,
    coverImage: data.coverImage ? sanitizeURL(data.coverImage) : data.coverImage,
    authorName: data.authorName ? sanitizeText(data.authorName) : data.authorName,
  };
  
  const docRef = await db.collection("blogs").add({
    ...sanitizedData,
    status: sanitizedData.status || "pending",
    views: 0,
    likes: 0,
    shares: 0,
    monthlyViews: 0,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getBlog = async (id) => {
  const db = getDb();
  const doc = await db.collection("blogs").doc(id).get();
  return serializeDoc(doc);
};

export const getBlogBySlug = async (slug) => {
  const db = getDb();
  const snapshot = await db.collection("blogs").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const getAllBlogs = async (statusFilter = null, excludeBlockedUsers = true, limitCount = 50) => {
  const db = getDb();
  // Fetch all blogs and filter/sort in memory to avoid composite index requirements
  const snapshot = await db.collection("blogs").get();
  let blogs = serializeDocs(snapshot);
  
  // Filter by status if specified
  if (statusFilter) {
    blogs = blogs.filter(blog => blog.status === statusFilter);
  }
  
  // Sort by createdAt descending
  blogs.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  if (excludeBlockedUsers) {
    const blockedIds = await getBlockedUserIds();
    if (blockedIds.length > 0) {
      blogs = blogs.filter(blog => !blockedIds.includes(blog.authorId));
    }
  }
  
  // Apply limit
  return blogs.slice(0, limitCount);
};

export const updateBlog = async (id, data) => {
  const db = getDb();
  try {
    await db.collection("blogs").doc(id).update({ ...data, updatedAt: new Date() });
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteBlog = async (id) => {
  const db = getDb();
  const blog = await getBlog(id);
  await db.collection("blogs").doc(id).delete();
  
  if (blog?.slug) {
    await deleteSitemapByUrl(`/blog/${blog.slug}`);
    autoDeindex(`/blog/${blog.slug}/`, "blog").catch(err =>
      console.error("[deleteBlog] Auto-deindex failed:", err.message)
    );
  }
};

export const approveBlog = async (id) => {
  const blog = await getBlog(id);
  await updateBlog(id, { status: "approved", publishedAt: new Date() });
  
  if (blog?.slug) {
    await addSitemapUrl({
      url: `/blog/${blog.slug}`,
      title: blog.title,
      type: "blog",
      changefreq: "weekly",
      priority: "0.7",
    });
    autoIndex(`/blog/${blog.slug}`, "blog").catch(err =>
      console.error("[approveBlog] Auto-index failed:", err.message)
    );
  }
};

export const rejectBlog = async (id) => {
  await updateBlog(id, { status: "rejected" });
};

export const getUserBlogs = async (userId, status = null) => {
  const db = getDb();
  // Fetch user blogs and filter/sort in memory to avoid composite index requirements
  const snapshot = await db.collection("blogs").where("authorId", "==", userId).get();
  let blogs = serializeDocs(snapshot);
  
  if (status) {
    blogs = blogs.filter(blog => blog.status === status);
  }
  
  // Sort by createdAt descending
  blogs.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  return blogs;
};

// ============================================
// MANGA FUNCTIONS
// ============================================

export const createManga = async (data) => {
  const db = getDb();
  const docRef = await db.collection("manga").add({
    ...data,
    views: 0,
    favorites: 0,
    createdAt: new Date(),
  });
  
  if (data.slug) {
    await addSitemapUrl({
      url: `/manga/${data.slug}`,
      title: data.title,
      type: "manga",
      changefreq: "weekly",
      priority: "0.8",
    });
    autoIndex(`/manga/${data.slug}`, "manga").catch(err =>
      console.error("[createManga] Auto-index failed:", err.message)
    );
  }
  
  return docRef.id;
};

export const getManga = async (id) => {
  const db = getDb();
  const doc = await db.collection("manga").doc(id).get();
  return serializeDoc(doc);
};

export const getMangaBySlug = async (slug) => {
  const db = getDb();
  const snapshot = await db.collection("manga").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) {
    return await getManga(slug);
  }
  return serializeDoc(snapshot.docs[0]);
};

export const getAllManga = async () => {
  const db = getDb();
  const snapshot = await db.collection("manga").orderBy("createdAt", "desc").get();
  return serializeDocs(snapshot);
};

export const updateManga = async (id, data) => {
  const db = getDb();
  await db.collection("manga").doc(id).update({ ...data, updatedAt: new Date() });
  
  if (data.slug) {
    autoIndex(`/manga/${data.slug}`, "manga").catch(err =>
      console.error("[updateManga] Auto-index failed:", err.message)
    );
  }
};

export const deleteManga = async (id) => {
  const db = getDb();
  const manga = await getManga(id);
  await db.collection("manga").doc(id).delete();
  
  if (manga?.slug) {
    await deleteSitemapByUrl(`/manga/${manga.slug}`);
    const sitemapSnapshot = await db.collection("sitemap").where("parentSlug", "==", manga.slug).get();
    const batch = db.batch();
    sitemapSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    autoDeindex(`/manga/${manga.slug}/`, "manga").catch(err =>
      console.error("[deleteManga] Auto-deindex failed:", err.message)
    );
  }
};

export const incrementMangaViews = async (mangaId) => {
  const db = getDb();
  await db.collection("manga").doc(mangaId).update({ views: increment(1) });
};

export const incrementMangaFavorites = async (mangaId) => {
  const db = getDb();
  await db.collection("manga").doc(mangaId).update({ favorites: increment(1) });
};

export const decrementMangaFavorites = async (mangaId) => {
  const db = getDb();
  await db.collection("manga").doc(mangaId).update({ favorites: increment(-1) });
};

// ============================================
// SETTINGS FUNCTIONS
// ============================================

const getDefaultSettings = () => ({
  siteName: "Luvrix.com",
  logoUrl: "/logo.png",
  themeColor: "#ff0055",
  blogPostPrice: 49,
  adsEnabled: false,
  adsCode: "",
  analyticsEnabled: false,
  analyticsId: "",
  headerMenu: ["News", "Anime", "Manga", "Technology"],
  footerText: "© 2026 Luvrix.com",
  payuMerchantId: "",
  payuMerchantKey: "",
  payuMerchantSalt: "",
  payuTestMode: true,
});

export const getSettings = async () => {
  const db = getDb();
  const doc = await db.collection("settings").doc("main").get();
  if (!doc.exists) return getDefaultSettings();
  return doc.data();
};

export const updateSettings = async (data) => {
  const db = getDb();
  await db.collection("settings").doc("main").set(data, { merge: true });
};

// ============================================
// PAYMENT FUNCTIONS
// ============================================

export const createPayment = async (data) => {
  const db = getDb();
  const docRef = await db.collection("payments").add({
    ...data,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const updatePayment = async (txnId, data) => {
  const db = getDb();
  const snapshot = await db.collection("payments").where("txnId", "==", txnId).limit(1).get();
  if (snapshot.empty) return false;
  await snapshot.docs[0].ref.update({ ...data, updatedAt: new Date() });
  return true;
};

export const getAllPayments = async () => {
  const db = getDb();
  const snapshot = await db.collection("payments").orderBy("createdAt", "desc").get();
  return serializeDocs(snapshot);
};

export const getUserPayments = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("payments").where("userId", "==", userId).get();
  let payments = serializeDocs(snapshot);
  payments.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  return payments;
};

// ============================================
// USER POST LIMITS
// ============================================

export const incrementFreePostsUsed = async (uid) => {
  const db = getDb();
  await db.collection("users").doc(uid).update({ freePostsUsed: increment(1) });
};

export const addExtraPosts = async (uid, count) => {
  const db = getDb();
  await db.collection("users").doc(uid).update({ extraPosts: increment(count) });
};

export const decrementExtraPosts = async (uid) => {
  const db = getDb();
  await db.collection("users").doc(uid).update({ extraPosts: increment(-1) });
};

// ============================================
// BLOG VIEWS & SHARES
// ============================================

export const incrementBlogViews = async (blogId) => {
  const db = getDb();
  await db.collection("blogs").doc(blogId).update({ views: increment(1) });
};

export const incrementBlogShares = async (blogId) => {
  const db = getDb();
  await db.collection("blogs").doc(blogId).update({ shares: increment(1) });
};

export const recordBlogView = async (blogId, deviceId) => {
  const db = getDb();
  const viewKey = `${blogId}_${deviceId}`;
  const today = new Date().toISOString().split("T")[0];
  
  const snapshot = await db.collection("blogViews")
    .where("viewKey", "==", viewKey)
    .where("date", "==", today)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    await db.collection("blogViews").add({
      blogId,
      deviceId,
      viewKey,
      date: today,
      createdAt: new Date(),
    });
    
    await incrementBlogViews(blogId);
    await db.collection("blogs").doc(blogId).update({ monthlyViews: increment(1) });
    return true;
  }
  return false;
};

// ============================================
// COMMENTS
// ============================================

export const createComment = async (data) => {
  const db = getDb();
  
  const sanitizedData = {
    ...data,
    content: data.content ? sanitizeText(data.content) : data.content,
    authorName: data.authorName ? sanitizeText(data.authorName) : data.authorName,
  };
  
  const docRef = await db.collection("comments").add({
    ...sanitizedData,
    likes: 0,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getComments = async (targetId, targetType = "blog") => {
  const db = getDb();
  // Fetch and filter/sort in memory to avoid composite index requirements
  const snapshot = await db.collection("comments").where("targetId", "==", targetId).get();
  let comments = serializeDocs(snapshot);
  comments = comments.filter(c => c.targetType === targetType);
  comments.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  return comments;
};

export const deleteComment = async (commentId) => {
  const db = getDb();
  await db.collection("comments").doc(commentId).delete();
};

export const likeComment = async (commentId) => {
  const db = getDb();
  await db.collection("comments").doc(commentId).update({ likes: increment(1) });
  const doc = await db.collection("comments").doc(commentId).get();
  return serializeDoc(doc);
};

// ============================================
// ADMIN LOGS
// ============================================

export const createLog = async (data) => {
  const db = getDb();
  await db.collection("logs").add({
    ...data,
    createdAt: new Date(),
  });
};

export const getAllLogs = async () => {
  const db = getDb();
  const snapshot = await db.collection("logs")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return serializeDocs(snapshot);
};

export const getLogs = getAllLogs;

// ============================================
// LEADERBOARD
// ============================================

export const getLeaderboard = async (period = "allTime") => {
  const db = getDb();
  
  const snapshot = await db.collection("blogs").where("status", "==", "approved").get();
  const blogs = serializeDocs(snapshot);
  
  if (blogs.length === 0) return [];
  
  const authorData = {};
  for (const blog of blogs) {
    const authorId = blog.authorId;
    if (!authorId) continue;
    
    if (!authorData[authorId]) {
      authorData[authorId] = {
        id: authorId,
        name: blog.authorName || null,
        photo: blog.authorPhoto || blog.authorPhotoURL || null,
        totalViews: 0,
        monthlyViews: 0,
        blogCount: 0,
      };
    }
    
    if (!authorData[authorId].name && blog.authorName) {
      authorData[authorId].name = blog.authorName;
    }
    if (!authorData[authorId].photo && blog.authorPhoto) {
      authorData[authorId].photo = blog.authorPhoto;
    }
    
    authorData[authorId].blogCount += 1;
    authorData[authorId].totalViews += Number(blog.views) || 0;
    authorData[authorId].monthlyViews += Number(blog.monthlyViews) || 0;
  }
  
  const leaderboard = Object.values(authorData).map(author => ({
    ...author,
    userId: author.id.slice(0, 8).toUpperCase(),
    name: author.name || `Blogger ${author.id.slice(0, 6)}`,
  }));
  
  const viewsField = period === "monthly" ? "monthlyViews" : "totalViews";
  return leaderboard
    .sort((a, b) => b[viewsField] - a[viewsField] || b.blogCount - a.blogCount)
    .slice(0, 100);
};

export const getLeaderboardWithAllUsers = async () => {
  const db = getDb();
  
  const usersSnapshot = await db.collection("users").get();
  const blogsSnapshot = await db.collection("blogs").where("status", "==", "approved").get();
  
  const users = serializeDocs(usersSnapshot);
  const blogs = serializeDocs(blogsSnapshot);
  
  const userStats = {};
  for (const user of users) {
    userStats[user.id] = {
      id: user.id,
      name: user.name || user.displayName || `User ${user.id.slice(0, 6)}`,
      email: user.email || "",
      photo: user.photoURL || user.photo || null,
      userId: user.userId || user.id.slice(0, 8).toUpperCase(),
      blogCount: 0,
      totalViews: 0,
      createdAt: user.createdAt,
    };
  }
  
  for (const blog of blogs) {
    const authorId = blog.authorId;
    if (authorId && userStats[authorId]) {
      userStats[authorId].blogCount += 1;
      userStats[authorId].totalViews += Number(blog.views) || 0;
    }
  }
  
  return Object.values(userStats)
    .sort((a, b) => b.totalViews - a.totalViews || b.blogCount - a.blogCount)
    .slice(0, 100);
};

// ============================================
// REWARDS
// ============================================

export const createReward = async (data) => {
  const db = getDb();
  const docRef = await db.collection("rewards").add({
    ...data,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getAllRewards = async () => {
  const db = getDb();
  const snapshot = await db.collection("rewards").orderBy("createdAt", "desc").get();
  return serializeDocs(snapshot);
};

// ============================================
// FAVORITES
// ============================================

export const addToFavorites = async (userId, itemId, itemType = "blog") => {
  const db = getDb();
  const favId = `${userId}_${itemId}`;
  
  await db.collection("favorites").doc(favId).set({
    userId,
    itemId,
    itemType,
    addedAt: new Date(),
  });
  return { success: true };
};

export const removeFromFavorites = async (userId, itemId) => {
  const db = getDb();
  const favId = `${userId}_${itemId}`;
  await db.collection("favorites").doc(favId).delete();
  return { success: true };
};

export const getUserFavorites = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("favorites").where("userId", "==", userId).get();
  return serializeDocs(snapshot);
};

export const isItemFavorited = async (userId, itemId) => {
  const db = getDb();
  const favId = `${userId}_${itemId}`;
  const doc = await db.collection("favorites").doc(favId).get();
  return doc.exists;
};

// ============================================
// SITEMAP
// ============================================

export const addSitemapUrl = async (data) => {
  const db = getDb();
  
  const snapshot = await db.collection("sitemap").where("url", "==", data.url).limit(1).get();
  
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({ ...data, updatedAt: new Date() });
    return snapshot.docs[0].id;
  }
  
  const docRef = await db.collection("sitemap").add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getSitemapUrls = async () => {
  const db = getDb();
  const snapshot = await db.collection("sitemap").get();
  return serializeDocs(snapshot);
};

export const deleteSitemapUrl = async (id) => {
  const db = getDb();
  await db.collection("sitemap").doc(id).delete();
  return true;
};

export const deleteSitemapByUrl = async (url) => {
  const db = getDb();
  const snapshot = await db.collection("sitemap").where("url", "==", url).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return true;
};

export const registerBlogToSitemap = async (slug, title) => {
  await addSitemapUrl({
    url: `/blog/${slug}`,
    title,
    type: "blog",
    changefreq: "weekly",
    priority: "0.7",
  });
  autoIndex(`/blog/${slug}`, "blog").catch(err =>
    console.error("[registerBlogToSitemap] Auto-index failed:", err.message)
  );
};

export const registerMangaToSitemap = async (slug, title) => {
  await addSitemapUrl({
    url: `/manga/${slug}`,
    title,
    type: "manga",
    changefreq: "weekly",
    priority: "0.8",
  });
  autoIndex(`/manga/${slug}`, "manga").catch(err =>
    console.error("[registerMangaToSitemap] Auto-index failed:", err.message)
  );
};

export const removeMangaFromSitemap = async (slug) => {
  const db = getDb();
  await deleteSitemapByUrl(`/manga/${slug}`);
  const snapshot = await db.collection("sitemap").where("parentSlug", "==", slug).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  
  autoDeindex(`/manga/${slug}/`, "manga").catch(err =>
    console.error("[removeMangaFromSitemap] Auto-deindex failed:", err.message)
  );
  return true;
};

// ============================================
// SUBSCRIBERS
// ============================================

export const addSubscriber = async (email) => {
  const db = getDb();
  
  const snapshot = await db.collection("subscribers")
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    return { success: false, error: "already_subscribed" };
  }
  
  const docRef = await db.collection("subscribers").add({
    email: email.toLowerCase(),
    subscribedAt: new Date(),
    status: "active",
  });
  return { success: true, id: docRef.id };
};

export const getAllSubscribers = async () => {
  const db = getDb();
  const snapshot = await db.collection("subscribers").orderBy("subscribedAt", "desc").get();
  return serializeDocs(snapshot);
};

export const deleteSubscriber = async (id) => {
  const db = getDb();
  await db.collection("subscribers").doc(id).delete();
  return { success: true };
};

export const updateSubscriberStatus = async (id, status) => {
  const db = getDb();
  await db.collection("subscribers").doc(id).update({ status });
  return { success: true };
};

// ============================================
// FOLLOW SYSTEM
// ============================================

export const followUser = async (followerId, followingId) => {
  const db = getDb();
  const followId = `${followerId}_${followingId}`;
  
  const doc = await db.collection("follows").doc(followId).get();
  if (doc.exists) return true;
  
  await db.collection("follows").doc(followId).set({
    followerId,
    followingId,
    createdAt: new Date(),
  });
  
  await db.collection("users").doc(followerId).update({ followingCount: increment(1) });
  await db.collection("users").doc(followingId).update({ followersCount: increment(1) });
  
  return true;
};

export const unfollowUser = async (followerId, followingId) => {
  const db = getDb();
  const followId = `${followerId}_${followingId}`;
  
  const doc = await db.collection("follows").doc(followId).get();
  if (!doc.exists) return true;
  
  await db.collection("follows").doc(followId).delete();
  
  await db.collection("users").doc(followerId).update({ followingCount: increment(-1) });
  await db.collection("users").doc(followingId).update({ followersCount: increment(-1) });
  
  return true;
};

export const isFollowing = async (followerId, followingId) => {
  const db = getDb();
  const followId = `${followerId}_${followingId}`;
  const doc = await db.collection("follows").doc(followId).get();
  return doc.exists;
};

export const getFollowers = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("follows").where("followingId", "==", userId).get();
  const followerIds = snapshot.docs.map(doc => doc.data().followerId);
  const followers = await Promise.all(followerIds.map(id => getUser(id)));
  return followers.filter(Boolean);
};

export const getFollowing = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("follows").where("followerId", "==", userId).get();
  const followingIds = snapshot.docs.map(doc => doc.data().followingId);
  const following = await Promise.all(followingIds.map(id => getUser(id)));
  return following.filter(Boolean);
};

// ============================================
// BLOG LIKES
// ============================================

export const likeBlog = async (userId, blogId) => {
  const db = getDb();
  const likeId = `${userId}_${blogId}`;
  
  const doc = await db.collection("blogLikes").doc(likeId).get();
  if (doc.exists) return true;
  
  await db.collection("blogLikes").doc(likeId).set({
    userId,
    blogId,
    createdAt: new Date(),
  });
  
  await db.collection("blogs").doc(blogId).update({ likes: increment(1) });
  return true;
};

export const unlikeBlog = async (userId, blogId) => {
  const db = getDb();
  const likeId = `${userId}_${blogId}`;
  
  const doc = await db.collection("blogLikes").doc(likeId).get();
  if (!doc.exists) return true;
  
  await db.collection("blogLikes").doc(likeId).delete();
  await db.collection("blogs").doc(blogId).update({ likes: increment(-1) });
  return true;
};

export const isBlogLiked = async (userId, blogId) => {
  const db = getDb();
  const likeId = `${userId}_${blogId}`;
  const doc = await db.collection("blogLikes").doc(likeId).get();
  return doc.exists;
};

export const getBlogLikesCount = async (blogId) => {
  const db = getDb();
  const snapshot = await db.collection("blogLikes").where("blogId", "==", blogId).get();
  return snapshot.size;
};

// ============================================
// LIBRARIES
// ============================================

export const createLibrary = async (userId, data) => {
  const db = getDb();
  const docRef = await db.collection("libraries").add({
    userId,
    name: data.name,
    description: data.description || "",
    isPublic: data.isPublic !== false,
    blogs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const updateLibrary = async (libraryId, data) => {
  const db = getDb();
  await db.collection("libraries").doc(libraryId).update({ ...data, updatedAt: new Date() });
  return true;
};

export const deleteLibrary = async (libraryId) => {
  const db = getDb();
  await db.collection("libraries").doc(libraryId).delete();
  return true;
};

export const getUserLibraries = async (userId, includePrivate = false) => {
  const db = getDb();
  let query = db.collection("libraries").where("userId", "==", userId);
  
  if (!includePrivate) {
    query = query.where("isPublic", "==", true);
  }
  
  const snapshot = await query.get();
  return serializeDocs(snapshot);
};

export const addBlogToLibrary = async (libraryId, blogId) => {
  const db = getDb();
  await db.collection("libraries").doc(libraryId).update({
    blogs: arrayUnion(blogId),
    updatedAt: new Date(),
  });
  return true;
};

export const removeBlogFromLibrary = async (libraryId, blogId) => {
  const db = getDb();
  await db.collection("libraries").doc(libraryId).update({
    blogs: arrayRemove(blogId),
    updatedAt: new Date(),
  });
  return true;
};

export const getLibrary = async (libraryId) => {
  const db = getDb();
  const doc = await db.collection("libraries").doc(libraryId).get();
  return serializeDoc(doc);
};

// ============================================
// USER STATS
// ============================================

export const getUserStats = async (userId) => {
  const blogs = await getUserBlogs(userId, "approved");
  const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
  const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
  const user = await getUser(userId);
  
  return {
    totalBlogs: blogs.length,
    totalViews,
    totalLikes,
    followersCount: user?.followersCount || 0,
    followingCount: user?.followingCount || 0,
  };
};

// ============================================
// PUBLISHERS
// ============================================

export const getPublishers = async (category = null, sortBy = "followers") => {
  const db = getDb();
  
  const usersSnapshot = await db.collection("users").get();
  let publishers = serializeDocs(usersSnapshot);
  
  if (category && category !== "all") {
    publishers = publishers.filter(p => p.publisherCategory === category);
  }
  
  const blogsSnapshot = await db.collection("blogs").where("status", "==", "approved").get();
  const blogs = serializeDocs(blogsSnapshot);
  
  const blogsByAuthor = {};
  blogs.forEach(blog => {
    const authorId = blog.authorId;
    if (!blogsByAuthor[authorId]) {
      blogsByAuthor[authorId] = { count: 0, views: 0 };
    }
    blogsByAuthor[authorId].count++;
    blogsByAuthor[authorId].views += blog.views || 0;
  });
  
  publishers = publishers.map(p => ({
    ...p,
    blogCount: blogsByAuthor[p.id]?.count || 0,
    totalViews: blogsByAuthor[p.id]?.views || 0,
  })).filter(p => p.blogCount > 0);
  
  if (sortBy === "followers") {
    publishers.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
  } else if (sortBy === "views") {
    publishers.sort((a, b) => b.totalViews - a.totalViews);
  } else if (sortBy === "blogs") {
    publishers.sort((a, b) => b.blogCount - a.blogCount);
  }
  
  return publishers;
};

export const updatePublisherCategory = async (userId, category) => {
  const db = getDb();
  await db.collection("users").doc(userId).update({ publisherCategory: category });
  return true;
};

// ============================================
// ADMIN BLOG PUBLISH
// ============================================

export const adminPublishBlog = async (blogData, adminId) => {
  const db = getDb();
  
  const slug = blogData.slug || blogData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);

  const docRef = await db.collection("blogs").add({
    ...blogData,
    slug,
    authorId: adminId,
    status: "approved",
    views: 0,
    monthlyViews: 0,
    likes: 0,
    shares: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  });
  
  return docRef.id;
};

// ============================================
// BLOG DRAFTS
// ============================================

export const getBlogDrafts = async (status = "draft") => {
  const db = getDb();
  const snapshot = await db.collection("blogDrafts").get();
  let drafts = serializeDocs(snapshot);
  drafts = drafts.filter(d => d.status === status);
  drafts.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  return drafts;
};

export const getBlogDraft = async (draftId) => {
  const db = getDb();
  const doc = await db.collection("blogDrafts").doc(draftId).get();
  return serializeDoc(doc);
};

export const updateBlogDraft = async (draftId, data) => {
  const db = getDb();
  await db.collection("blogDrafts").doc(draftId).update({ ...data, updatedAt: new Date() });
  return true;
};

export const createBlogDraft = async (data) => {
  const db = getDb();
  const docRef = await db.collection("blogDrafts").add({
    ...data,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const deleteBlogDraft = async (draftId) => {
  const db = getDb();
  await db.collection("blogDrafts").doc(draftId).delete();
  return true;
};

export const publishBlogDraft = async (draftId, adminId, authorName, authorPhoto) => {
  const draft = await getBlogDraft(draftId);
  if (!draft) throw new Error("Draft not found");
  
  const blogId = await adminPublishBlog({
    title: draft.title,
    content: draft.content,
    excerpt: draft.excerpt,
    featuredImage: draft.featuredImage,
    category: draft.category,
    tags: draft.tags,
    authorName,
    authorPhoto,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
  }, adminId);
  
  await updateBlogDraft(draftId, { status: "published", publishedBlogId: blogId });
  return { success: true, blogId };
};

// ============================================
// ADS FUNCTIONS
// ============================================

export const getAds = async () => {
  const db = getDb();
  const snapshot = await db.collection("ads").get();
  return serializeDocs(snapshot);
};

export const createAd = async (data) => {
  const db = getDb();
  const docRef = await db.collection("ads").add({
    ...data,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const updateAd = async (adId, data) => {
  const db = getDb();
  await db.collection("ads").doc(adId).update({ ...data, updatedAt: new Date() });
  return true;
};

export const deleteAd = async (adId) => {
  const db = getDb();
  await db.collection("ads").doc(adId).delete();
  return true;
};

// ============================================
// REFERRAL FUNCTIONS
// ============================================

export const generateReferralCode = async (userId) => {
  const db = getDb();
  const code = `LUV${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  await db.collection("users").doc(userId).update({ referralCode: code });
  return code;
};

export const getReferralByCode = async (code) => {
  const db = getDb();
  const snapshot = await db.collection("users").where("referralCode", "==", code).limit(1).get();
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const createReferral = async (referrerId, referredId) => {
  const db = getDb();
  
  const snapshot = await db.collection("referrals").where("referredId", "==", referredId).limit(1).get();
  if (!snapshot.empty) return null;
  
  const docRef = await db.collection("referrals").add({
    referrerId,
    referredId,
    status: "pending",
    rewardClaimed: false,
    createdAt: new Date(),
  });
  
  return docRef.id;
};

export const getUserReferrals = async (userId) => {
  const db = getDb();
  const snapshot = await db.collection("referrals").where("referrerId", "==", userId).get();
  let referrals = serializeDocs(snapshot);
  referrals.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  const enrichedReferrals = await Promise.all(
    referrals.map(async (ref) => {
      const user = await getUser(ref.referredId);
      return {
        ...ref,
        referredUser: user ? { name: user.name, email: user.email, createdAt: user.createdAt } : null,
      };
    })
  );
  
  return enrichedReferrals;
};

export const completeReferral = async (referredId) => {
  const db = getDb();
  
  const snapshot = await db.collection("referrals")
    .where("referredId", "==", referredId)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  
  if (snapshot.empty) return false;
  
  const referral = snapshot.docs[0];
  await referral.ref.update({ status: "completed", completedAt: new Date() });
  
  const settings = await getReferralSettings();
  const rewardPosts = settings?.rewardPosts || 1;
  
  await db.collection("users").doc(referral.data().referrerId).update({
    extraPosts: increment(rewardPosts),
  });
  
  return true;
};

export const getReferralStats = async (userId) => {
  const db = getDb();
  
  const totalSnapshot = await db.collection("referrals").where("referrerId", "==", userId).get();
  const completedSnapshot = await db.collection("referrals")
    .where("referrerId", "==", userId)
    .where("status", "==", "completed")
    .get();
  const pendingSnapshot = await db.collection("referrals")
    .where("referrerId", "==", userId)
    .where("status", "==", "pending")
    .get();
  
  return {
    total: totalSnapshot.size,
    completed: completedSnapshot.size,
    pending: pendingSnapshot.size,
  };
};

export const getReferralSettings = async () => {
  const db = getDb();
  const doc = await db.collection("settings").doc("referral").get();
  if (!doc.exists) return { enabled: true, rewardPosts: 1 };
  return doc.data();
};

export const updateReferralSettings = async (data) => {
  const db = getDb();
  await db.collection("settings").doc("referral").set({
    ...data,
    type: "referral",
    updatedAt: new Date(),
  }, { merge: true });
  return true;
};

// Note: These functions need external API
export const getTrendingTopics = async (geo = "IN") => {
  const response = await fetch(`/api/trending-topics?geo=${geo}`);
  const data = await response.json();
  return data.topics || [];
};

export const generateBlogDraft = async (topic, adminId, category = "General", tone = "informative and engaging") => {
  const response = await fetch("/api/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, adminId, category, tone }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
};
