import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";
import { sanitizeBlogContent, sanitizeText, sanitizeURL } from "./sanitize";
import { autoIndex, autoDeindex } from "./auto-index";

// Helper to convert string ID to ObjectId if needed
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id) && id.length === 24) {
    return new ObjectId(id);
  }
  return id; // Return as-is for custom string IDs
};

// Helper to serialize a document - removes _id and adds id field
const serializeDoc = (doc, convertIdToString = true) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  const id = convertIdToString && _id?.toString ? _id.toString() : _id;
  return { id, ...rest };
};

// Helper to serialize an array of documents
const serializeDocs = (docs, convertIdToString = true) => {
  return docs.map(doc => serializeDoc(doc, convertIdToString));
};

// ============================================
// USER FUNCTIONS
// ============================================

export const generateUserId = async () => {
  const db = await getDb();
  const today = new Date();
  const datePrefix = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  
  const users = await db.collection("users")
    .find({ uniqueId: { $regex: `^${datePrefix}` } })
    .toArray();
  
  let maxSeq = 0;
  users.forEach(user => {
    if (user.uniqueId && user.uniqueId.startsWith(datePrefix)) {
      const seq = parseInt(user.uniqueId.slice(-4));
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return datePrefix + nextSeq;
};

export const createUser = async (id, data) => {
  const db = await getDb();
  const uniqueId = await generateUserId();
  
  const userData = {
    _id: id,
    ...data,
    uniqueId,
    role: data.role || "USER",
    blocked: false,
    freePostsUsed: 0,
    extraPosts: 0,
    photoURL: data.photoURL || "",
    createdAt: new Date(),
  };
  
  await db.collection("users").insertOne(userData);
  return { uniqueId, ...userData };
};

export const getUser = async (id) => {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: id });
  if (!user) return null;
  const { _id, ...rest } = user;
  return { id: _id, ...rest };
};

export const getUserByUniqueId = async (uniqueId) => {
  const db = await getDb();
  const user = await db.collection("users").findOne({ uniqueId });
  if (!user) return null;
  const { _id, ...rest } = user;
  return { id: _id, ...rest };
};

export const getUserByEmail = async (email) => {
  const db = await getDb();
  const user = await db.collection("users").findOne({ email: email.toLowerCase() });
  if (!user) return null;
  const { _id, ...rest } = user;
  return { id: _id, ...rest };
};

export const getUserByUsername = async (username) => {
  const db = await getDb();
  const user = await db.collection("users").findOne({ username });
  if (!user) return null;
  const { _id, ...rest } = user;
  return { id: _id, ...rest };
};

export const updateUser = async (id, data) => {
  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: id },
    { $set: { ...data, updatedAt: new Date() } }
  );
};

export const deleteUser = async (id) => {
  const db = await getDb();
  await db.collection("users").deleteOne({ _id: id });
};

export const getBlockedUserIds = async () => {
  const db = await getDb();
  const users = await db.collection("users").find({ blocked: true }).toArray();
  return users.map(u => u._id);
};

export const hideUserPosts = async (userId) => {
  const db = await getDb();
  const result = await db.collection("blogs").updateMany(
    { authorId: userId },
    { $set: { status: "hidden" } }
  );
  return { success: true, count: result.modifiedCount };
};

export const unhideUserPosts = async (userId) => {
  const db = await getDb();
  const result = await db.collection("blogs").updateMany(
    { authorId: userId, status: "hidden" },
    { $set: { status: "approved" } }
  );
  return { success: true, count: result.modifiedCount };
};

export const getAllUsers = async () => {
  const db = await getDb();
  const users = await db.collection("users")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return users.map(u => {
    const { _id, ...rest } = u;
    return { id: _id, ...rest };
  });
};

// ============================================
// BLOG FUNCTIONS
// ============================================

export const createBlog = async (data) => {
  const db = await getDb();
  
  // Sanitize user input before storing
  const sanitizedData = {
    ...data,
    title: data.title ? sanitizeText(data.title) : data.title,
    content: data.content ? sanitizeBlogContent(data.content) : data.content,
    excerpt: data.excerpt ? sanitizeText(data.excerpt) : data.excerpt,
    coverImage: data.coverImage ? sanitizeURL(data.coverImage) : data.coverImage,
    authorName: data.authorName ? sanitizeText(data.authorName) : data.authorName,
  };
  
  const result = await db.collection("blogs").insertOne({
    ...sanitizedData,
    status: sanitizedData.status || "pending",
    views: 0,
    likes: 0,
    shares: 0,
    monthlyViews: 0,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
};

export const getBlog = async (id) => {
  const db = await getDb();
  let blog = await db.collection("blogs").findOne({ _id: id });
  if (!blog) {
    // Try with ObjectId
    const objId = toObjectId(id);
    if (objId !== id) {
      blog = await db.collection("blogs").findOne({ _id: objId });
    }
  }
  if (!blog) return null;
  const { _id, ...rest } = blog;
  return { id: _id.toString(), ...rest };
};

export const getBlogBySlug = async (slug) => {
  const db = await getDb();
  const blog = await db.collection("blogs").findOne({ slug });
  if (!blog) return null;
  const { _id, ...rest } = blog;
  return { id: _id.toString(), ...rest };
};

export const getAllBlogs = async (statusFilter = null, excludeBlockedUsers = true, limitCount = 50) => {
  const db = await getDb();
  const query = statusFilter ? { status: statusFilter } : {};
  
  let blogs = await db.collection("blogs")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limitCount)
    .toArray();
  
  if (excludeBlockedUsers) {
    const blockedIds = await getBlockedUserIds();
    if (blockedIds.length > 0) {
      blogs = blogs.filter(blog => !blockedIds.includes(blog.authorId));
    }
  }
  
  return blogs.map(b => {
    const { _id, ...rest } = b;
    return { id: _id.toString(), ...rest };
  });
};

export const updateBlog = async (id, data) => {
  const db = await getDb();
  const objId = toObjectId(id);
  
  // Try with ObjectId first, then with string ID
  let result = await db.collection("blogs").updateOne(
    { _id: objId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  
  // If no match, try with string ID directly
  if (result.matchedCount === 0 && objId !== id) {
    result = await db.collection("blogs").updateOne(
      { _id: id },
      { $set: { ...data, updatedAt: new Date() } }
    );
  }
  
  return result.matchedCount > 0;
};

export const deleteBlog = async (id) => {
  const db = await getDb();
  const blog = await getBlog(id);
  const objId = toObjectId(id);
  await db.collection("blogs").deleteOne({ _id: objId });
  
  if (blog?.slug) {
    await deleteSitemapByUrl(`/blog/${blog.slug}`);

    // Notify search engines to de-index the deleted blog URL
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

    // Auto-index: notify search engines about the new blog
    autoIndex(`/blog/${blog.slug}`, "blog").catch(err =>
      console.error("[approveBlog] Auto-index failed:", err.message)
    );
  }
};

export const rejectBlog = async (id) => {
  await updateBlog(id, { status: "rejected" });
};

export const getUserBlogs = async (userId, status = null) => {
  const db = await getDb();
  const query = status 
    ? { authorId: userId, status }
    : { authorId: userId };
  
  const blogs = await db.collection("blogs")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  
  return blogs.map(b => {
    const { _id, ...rest } = b;
    return { id: _id.toString(), ...rest };
  });
};

// ============================================
// MANGA FUNCTIONS
// ============================================

export const createManga = async (data) => {
  const db = await getDb();
  const result = await db.collection("manga").insertOne({
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

    // Auto-index: notify search engines about the new manga
    autoIndex(`/manga/${data.slug}`, "manga").catch(err =>
      console.error("[createManga] Auto-index failed:", err.message)
    );
  }
  
  return result.insertedId.toString();
};

export const getManga = async (id) => {
  const db = await getDb();
  const objId = toObjectId(id);
  const manga = await db.collection("manga").findOne({ _id: objId });
  return serializeDoc(manga);
};

export const getMangaBySlug = async (slug) => {
  const db = await getDb();
  const manga = await db.collection("manga").findOne({ slug });
  if (!manga) {
    return await getManga(slug);
  }
  return serializeDoc(manga);
};

export const getAllManga = async () => {
  const db = await getDb();
  const manga = await db.collection("manga")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return serializeDocs(manga);
};

export const updateManga = async (id, data) => {
  const db = await getDb();
  const objId = toObjectId(id);
  
  await db.collection("manga").updateOne(
    { _id: objId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  
  // Auto-index manga page when it is updated
  if (data.slug) {
    autoIndex(`/manga/${data.slug}`, "manga").catch(err =>
      console.error("[updateManga] Auto-index failed:", err.message)
    );
  }
};

export const deleteManga = async (id) => {
  const db = await getDb();
  const manga = await getManga(id);
  const objId = toObjectId(id);
  
  await db.collection("manga").deleteOne({ _id: objId });
  
  if (manga?.slug) {
    await deleteSitemapByUrl(`/manga/${manga.slug}`);
    await db.collection("sitemap").deleteMany({ parentSlug: manga.slug });

    // Notify search engines to de-index the deleted manga URL
    autoDeindex(`/manga/${manga.slug}/`, "manga").catch(err =>
      console.error("[deleteManga] Auto-deindex failed:", err.message)
    );
  }
};

export const incrementMangaViews = async (mangaId) => {
  const db = await getDb();
  const objId = toObjectId(mangaId);
  await db.collection("manga").updateOne(
    { _id: objId },
    { $inc: { views: 1 } }
  );
};

export const incrementMangaFavorites = async (mangaId) => {
  const db = await getDb();
  const objId = toObjectId(mangaId);
  await db.collection("manga").updateOne(
    { _id: objId },
    { $inc: { favorites: 1 } }
  );
};

export const decrementMangaFavorites = async (mangaId) => {
  const db = await getDb();
  const objId = toObjectId(mangaId);
  await db.collection("manga").updateOne(
    { _id: objId },
    { $inc: { favorites: -1 } }
  );
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
  const db = await getDb();
  const settings = await db.collection("settings").findOne({ _id: "main" });
  if (!settings) return getDefaultSettings();
  const { _id: _mongoId, ...rest } = settings;
  return rest;
};

export const updateSettings = async (data) => {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "main" },
    { $set: data },
    { upsert: true }
  );
};

// ============================================
// PAYMENT FUNCTIONS
// ============================================

export const createPayment = async (data) => {
  const db = await getDb();
  const result = await db.collection("payments").insertOne({
    ...data,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
};

export const updatePayment = async (txnId, data) => {
  const db = await getDb();
  const result = await db.collection("payments").updateOne(
    { txnId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};

export const getAllPayments = async () => {
  const db = await getDb();
  const payments = await db.collection("payments")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return serializeDocs(payments);
};

export const getUserPayments = async (userId) => {
  const db = await getDb();
  const payments = await db.collection("payments")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return serializeDocs(payments);
};

// ============================================
// USER POST LIMITS
// ============================================

export const incrementFreePostsUsed = async (uid) => {
  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: uid },
    { $inc: { freePostsUsed: 1 } }
  );
};

export const addExtraPosts = async (uid, count) => {
  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: uid },
    { $inc: { extraPosts: count } }
  );
};

export const decrementExtraPosts = async (uid) => {
  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: uid },
    { $inc: { extraPosts: -1 } }
  );
};

// ============================================
// BLOG VIEWS & SHARES
// ============================================

export const incrementBlogViews = async (blogId) => {
  const db = await getDb();
  const objId = toObjectId(blogId);
  await db.collection("blogs").updateOne(
    { _id: objId },
    { $inc: { views: 1 } }
  );
};

export const incrementBlogShares = async (blogId) => {
  const db = await getDb();
  const objId = toObjectId(blogId);
  await db.collection("blogs").updateOne(
    { _id: objId },
    { $inc: { shares: 1 } }
  );
};

export const recordBlogView = async (blogId, deviceId) => {
  const db = await getDb();
  const viewKey = `${blogId}_${deviceId}`;
  const today = new Date().toISOString().split("T")[0];
  
  const existing = await db.collection("blogViews").findOne({ viewKey, date: today });
  
  if (!existing) {
    await db.collection("blogViews").insertOne({
      blogId,
      deviceId,
      viewKey,
      date: today,
      createdAt: new Date(),
    });
    
    await incrementBlogViews(blogId);
    
    const objId = toObjectId(blogId);
    await db.collection("blogs").updateOne(
      { _id: objId },
      { $inc: { monthlyViews: 1 } }
    );
    
    return true;
  }
  return false;
};

// ============================================
// COMMENTS
// ============================================

export const createComment = async (data) => {
  const db = await getDb();
  
  // Sanitize user input before storing
  const sanitizedData = {
    ...data,
    content: data.content ? sanitizeText(data.content) : data.content,
    authorName: data.authorName ? sanitizeText(data.authorName) : data.authorName,
  };
  
  const result = await db.collection("comments").insertOne({
    ...sanitizedData,
    likes: 0,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
};

export const getComments = async (targetId, targetType = "blog") => {
  const db = await getDb();
  const comments = await db.collection("comments")
    .find({ targetId, targetType })
    .sort({ createdAt: -1 })
    .toArray();
  return serializeDocs(comments);
};

export const deleteComment = async (commentId) => {
  const db = await getDb();
  const objId = toObjectId(commentId);
  await db.collection("comments").deleteOne({ _id: objId });
};

export const likeComment = async (commentId) => {
  const db = await getDb();
  const objId = toObjectId(commentId);
  const result = await db.collection("comments").findOneAndUpdate(
    { _id: objId },
    { $inc: { likes: 1 } },
    { returnDocument: "after" }
  );
  return result.value || result;
};

// ============================================
// ADMIN LOGS
// ============================================

export const createLog = async (data) => {
  const db = await getDb();
  await db.collection("logs").insertOne({
    ...data,
    createdAt: new Date(),
  });
};

export const getAllLogs = async () => {
  const db = await getDb();
  const logs = await db.collection("logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return serializeDocs(logs);
};

// Alias for getLogs
export const getLogs = getAllLogs;

// ============================================
// LEADERBOARD
// ============================================

export const getLeaderboard = async (period = "allTime") => {
  const db = await getDb();
  
  const blogs = await db.collection("blogs")
    .find({ status: "approved" })
    .toArray();
  
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
  const db = await getDb();
  
  const users = await db.collection("users").find({}).toArray();
  const blogs = await db.collection("blogs").find({ status: "approved" }).toArray();
  
  const userStats = {};
  for (const user of users) {
    userStats[user._id] = {
      id: user._id,
      name: user.name || user.displayName || `User ${user._id.slice(0, 6)}`,
      email: user.email || "",
      photo: user.photoURL || user.photo || null,
      userId: user.userId || user._id.slice(0, 8).toUpperCase(),
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
  const db = await getDb();
  const result = await db.collection("rewards").insertOne({
    ...data,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
};

export const getAllRewards = async () => {
  const db = await getDb();
  const rewards = await db.collection("rewards")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return serializeDocs(rewards);
};

// ============================================
// FAVORITES
// ============================================

export const addToFavorites = async (userId, itemId, itemType = "blog") => {
  const db = await getDb();
  const favId = `${userId}_${itemId}`;
  
  await db.collection("favorites").updateOne(
    { _id: favId },
    { 
      $set: { 
        userId,
        itemId,
        itemType,
        addedAt: new Date(),
      }
    },
    { upsert: true }
  );
  return { success: true };
};

export const removeFromFavorites = async (userId, itemId) => {
  const db = await getDb();
  const favId = `${userId}_${itemId}`;
  await db.collection("favorites").deleteOne({ _id: favId });
  return { success: true };
};

export const getUserFavorites = async (userId) => {
  const db = await getDb();
  const favorites = await db.collection("favorites")
    .find({ userId })
    .toArray();
  return serializeDocs(favorites, false);
};

export const isItemFavorited = async (userId, itemId) => {
  const db = await getDb();
  const favId = `${userId}_${itemId}`;
  const fav = await db.collection("favorites").findOne({ _id: favId });
  return !!fav;
};

// ============================================
// SITEMAP
// ============================================

export const addSitemapUrl = async (data) => {
  const db = await getDb();
  
  const existing = await db.collection("sitemap").findOne({ url: data.url });
  
  if (existing) {
    await db.collection("sitemap").updateOne(
      { url: data.url },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return existing._id.toString();
  }
  
  const result = await db.collection("sitemap").insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
};

export const getSitemapUrls = async () => {
  const db = await getDb();
  const urls = await db.collection("sitemap").find({}).toArray();
  return serializeDocs(urls);
};

export const deleteSitemapUrl = async (id) => {
  const db = await getDb();
  const objId = toObjectId(id);
  await db.collection("sitemap").deleteOne({ _id: objId });
  return true;
};

export const deleteSitemapByUrl = async (url) => {
  const db = await getDb();
  await db.collection("sitemap").deleteOne({ url });
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

  // Auto-index the blog page
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

  // Auto-index the manga page
  autoIndex(`/manga/${slug}`, "manga").catch(err =>
    console.error("[registerMangaToSitemap] Auto-index failed:", err.message)
  );
};

export const removeMangaFromSitemap = async (slug) => {
  const db = await getDb();
  await deleteSitemapByUrl(`/manga/${slug}`);
  await db.collection("sitemap").deleteMany({ parentSlug: slug });

  // Notify search engines to de-index removed manga
  autoDeindex(`/manga/${slug}/`, "manga").catch(err =>
    console.error("[removeMangaFromSitemap] Auto-deindex failed:", err.message)
  );
  return true;
};

// ============================================
// SUBSCRIBERS
// ============================================

export const addSubscriber = async (email) => {
  const db = await getDb();
  
  const existing = await db.collection("subscribers").findOne({ email: email.toLowerCase() });
  if (existing) {
    return { success: false, error: "already_subscribed" };
  }
  
  const result = await db.collection("subscribers").insertOne({
    email: email.toLowerCase(),
    subscribedAt: new Date(),
    status: "active",
  });
  return { success: true, id: result.insertedId.toString() };
};

export const getAllSubscribers = async () => {
  const db = await getDb();
  const subscribers = await db.collection("subscribers")
    .find({})
    .sort({ subscribedAt: -1 })
    .toArray();
  return serializeDocs(subscribers);
};

export const deleteSubscriber = async (id) => {
  const db = await getDb();
  const objId = toObjectId(id);
  await db.collection("subscribers").deleteOne({ _id: objId });
  return { success: true };
};

export const updateSubscriberStatus = async (id, status) => {
  const db = await getDb();
  const objId = toObjectId(id);
  await db.collection("subscribers").updateOne(
    { _id: objId },
    { $set: { status } }
  );
  return { success: true };
};

// ============================================
// FOLLOW SYSTEM
// ============================================

export const followUser = async (followerId, followingId) => {
  const db = await getDb();
  const followId = `${followerId}_${followingId}`;
  
  // Check if already following - don't double-increment
  const existing = await db.collection("follows").findOne({ _id: followId });
  if (existing) return true; // Already following, skip
  
  await db.collection("follows").insertOne({
    _id: followId,
    followerId,
    followingId,
    createdAt: new Date(),
  });
  
  await db.collection("users").updateOne(
    { _id: followerId },
    { $inc: { followingCount: 1 } }
  );
  await db.collection("users").updateOne(
    { _id: followingId },
    { $inc: { followersCount: 1 } }
  );
  
  return true;
};

export const unfollowUser = async (followerId, followingId) => {
  const db = await getDb();
  const followId = `${followerId}_${followingId}`;
  
  // Only decrement if the follow actually exists
  const result = await db.collection("follows").deleteOne({ _id: followId });
  if (result.deletedCount === 0) return true; // Wasn't following, skip
  
  // Decrement but never go below 0
  await db.collection("users").updateOne(
    { _id: followerId, followingCount: { $gt: 0 } },
    { $inc: { followingCount: -1 } }
  );
  await db.collection("users").updateOne(
    { _id: followingId, followersCount: { $gt: 0 } },
    { $inc: { followersCount: -1 } }
  );
  
  return true;
};

export const isFollowing = async (followerId, followingId) => {
  const db = await getDb();
  const followId = `${followerId}_${followingId}`;
  const follow = await db.collection("follows").findOne({ _id: followId });
  return !!follow;
};

export const getFollowers = async (userId) => {
  const db = await getDb();
  const follows = await db.collection("follows").find({ followingId: userId }).toArray();
  const followerIds = follows.map(f => f.followerId);
  const followers = await Promise.all(followerIds.map(id => getUser(id)));
  return followers.filter(Boolean);
};

export const getFollowing = async (userId) => {
  const db = await getDb();
  const follows = await db.collection("follows").find({ followerId: userId }).toArray();
  const followingIds = follows.map(f => f.followingId);
  const following = await Promise.all(followingIds.map(id => getUser(id)));
  return following.filter(Boolean);
};

// ============================================
// BLOG LIKES
// ============================================

export const likeBlog = async (userId, blogId) => {
  const db = await getDb();
  const likeId = `${userId}_${blogId}`;
  
  // Check if already liked - don't double-increment
  const existing = await db.collection("blogLikes").findOne({ _id: likeId });
  if (existing) return true; // Already liked, skip
  
  await db.collection("blogLikes").insertOne({
    _id: likeId,
    userId,
    blogId,
    createdAt: new Date(),
  });
  
  const objId = toObjectId(blogId);
  await db.collection("blogs").updateOne(
    { _id: objId },
    { $inc: { likes: 1 } }
  );
  
  return true;
};

export const unlikeBlog = async (userId, blogId) => {
  const db = await getDb();
  const likeId = `${userId}_${blogId}`;
  
  // Only decrement if the like actually exists
  const result = await db.collection("blogLikes").deleteOne({ _id: likeId });
  if (result.deletedCount === 0) return true; // Wasn't liked, skip
  
  const objId = toObjectId(blogId);
  // Decrement but never go below 0
  await db.collection("blogs").updateOne(
    { _id: objId, likes: { $gt: 0 } },
    { $inc: { likes: -1 } }
  );
  
  return true;
};

export const isBlogLiked = async (userId, blogId) => {
  const db = await getDb();
  const likeId = `${userId}_${blogId}`;
  const like = await db.collection("blogLikes").findOne({ _id: likeId });
  return !!like;
};

export const getBlogLikesCount = async (blogId) => {
  const db = await getDb();
  return await db.collection("blogLikes").countDocuments({ blogId });
};

// ============================================
// LIBRARIES
// ============================================

export const createLibrary = async (userId, data) => {
  const db = await getDb();
  const result = await db.collection("libraries").insertOne({
    userId,
    name: data.name,
    description: data.description || "",
    isPublic: data.isPublic !== false,
    blogs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
};

export const updateLibrary = async (libraryId, data) => {
  const db = await getDb();
  const objId = toObjectId(libraryId);
  await db.collection("libraries").updateOne(
    { _id: objId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return true;
};

export const deleteLibrary = async (libraryId) => {
  const db = await getDb();
  const objId = toObjectId(libraryId);
  await db.collection("libraries").deleteOne({ _id: objId });
  return true;
};

export const getUserLibraries = async (userId, includePrivate = false) => {
  const db = await getDb();
  const query = includePrivate 
    ? { userId }
    : { userId, isPublic: true };
  
  const libraries = await db.collection("libraries").find(query).toArray();
  return serializeDocs(libraries);
};

export const addBlogToLibrary = async (libraryId, blogId) => {
  const db = await getDb();
  const objId = toObjectId(libraryId);
  await db.collection("libraries").updateOne(
    { _id: objId },
    { 
      $addToSet: { blogs: blogId },
      $set: { updatedAt: new Date() }
    }
  );
  return true;
};

export const removeBlogFromLibrary = async (libraryId, blogId) => {
  const db = await getDb();
  const objId = toObjectId(libraryId);
  await db.collection("libraries").updateOne(
    { _id: objId },
    { 
      $pull: { blogs: blogId },
      $set: { updatedAt: new Date() }
    }
  );
  return true;
};

export const getLibrary = async (libraryId) => {
  const db = await getDb();
  const objId = toObjectId(libraryId);
  const library = await db.collection("libraries").findOne({ _id: objId });
  return serializeDoc(library);
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
  const db = await getDb();
  
  let publishers = await db.collection("users").find({}).toArray();
  
  if (category && category !== "all") {
    publishers = publishers.filter(p => p.publisherCategory === category);
  }
  
  const blogs = await db.collection("blogs").find({ status: "approved" }).toArray();
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
    id: p._id,
    ...p,
    blogCount: blogsByAuthor[p._id]?.count || 0,
    totalViews: blogsByAuthor[p._id]?.views || 0,
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
  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: userId },
    { $set: { publisherCategory: category } }
  );
  return true;
};

// ============================================
// ADMIN BLOG PUBLISH
// ============================================

export const adminPublishBlog = async (blogData, adminId) => {
  const db = await getDb();
  
  const slug = blogData.slug || blogData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);

  const result = await db.collection("blogs").insertOne({
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
  
  return result.insertedId.toString();
};

// ============================================
// BLOG DRAFTS (Local Implementation)
// ============================================

export const getBlogDrafts = async (status = "draft") => {
  const db = await getDb();
  const drafts = await db.collection("blogDrafts")
    .find({ status })
    .sort({ createdAt: -1 })
    .toArray();
  return serializeDocs(drafts);
};

export const getBlogDraft = async (draftId) => {
  const db = await getDb();
  const objId = toObjectId(draftId);
  const draft = await db.collection("blogDrafts").findOne({ _id: objId });
  return serializeDoc(draft);
};

export const updateBlogDraft = async (draftId, data) => {
  const db = await getDb();
  const objId = toObjectId(draftId);
  await db.collection("blogDrafts").updateOne(
    { _id: objId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return true;
};

export const createBlogDraft = async (data) => {
  const db = await getDb();
  const result = await db.collection("blogDrafts").insertOne({
    ...data,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
};

export const deleteBlogDraft = async (draftId) => {
  const db = await getDb();
  const objId = toObjectId(draftId);
  await db.collection("blogDrafts").deleteOne({ _id: objId });
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
  const db = await getDb();
  const ads = await db.collection("ads").find({}).toArray();
  return ads;
};

export const createAd = async (data) => {
  const db = await getDb();
  const result = await db.collection("ads").insertOne({
    ...data,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
};

export const updateAd = async (adId, data) => {
  const db = await getDb();
  const objId = toObjectId(adId);
  await db.collection("ads").updateOne(
    { _id: objId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return true;
};

export const deleteAd = async (adId) => {
  const db = await getDb();
  const objId = toObjectId(adId);
  await db.collection("ads").deleteOne({ _id: objId });
  return true;
};

// ============================================
// REFERRAL FUNCTIONS
// ============================================

export const generateReferralCode = async (userId) => {
  const db = await getDb();
  const code = `LUV${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  await db.collection("users").updateOne(
    { _id: userId },
    { $set: { referralCode: code } }
  );
  
  return code;
};

export const getReferralByCode = async (code) => {
  const db = await getDb();
  const user = await db.collection("users").findOne({ referralCode: code });
  return serializeDoc(user, false);
};

export const createReferral = async (referrerId, referredId) => {
  const db = await getDb();
  
  // Check if referral already exists
  const existing = await db.collection("referrals").findOne({ referredId });
  if (existing) return null;
  
  const result = await db.collection("referrals").insertOne({
    referrerId,
    referredId,
    status: "pending",
    rewardClaimed: false,
    createdAt: new Date()
  });
  
  return result.insertedId.toString();
};

export const getUserReferrals = async (userId) => {
  const db = await getDb();
  const referrals = await db.collection("referrals")
    .find({ referrerId: userId })
    .sort({ createdAt: -1 })
    .toArray();
  
  // Get referred user details
  const enrichedReferrals = await Promise.all(
    referrals.map(async (ref) => {
      const user = await db.collection("users").findOne({ _id: ref.referredId });
      return {
        id: ref._id.toString(),
        ...ref,
        referredUser: user ? { name: user.name, email: user.email, createdAt: user.createdAt } : null
      };
    })
  );
  
  return enrichedReferrals;
};

export const completeReferral = async (referredId) => {
  const db = await getDb();
  
  // Update referral status to completed
  const referral = await db.collection("referrals").findOneAndUpdate(
    { referredId, status: "pending" },
    { $set: { status: "completed", completedAt: new Date() } },
    { returnDocument: "after" }
  );
  
  if (referral?.value) {
    // Get referral settings
    const settings = await db.collection("settings").findOne({ type: "referral" });
    const rewardPosts = settings?.rewardPosts || 1;
    
    // Award bonus posts to referrer
    await db.collection("users").updateOne(
      { _id: referral.value.referrerId },
      { $inc: { extraPosts: rewardPosts } }
    );
    
    return true;
  }
  
  return false;
};

export const getReferralStats = async (userId) => {
  const db = await getDb();
  
  const total = await db.collection("referrals").countDocuments({ referrerId: userId });
  const completed = await db.collection("referrals").countDocuments({ referrerId: userId, status: "completed" });
  const pending = await db.collection("referrals").countDocuments({ referrerId: userId, status: "pending" });
  
  return { total, completed, pending };
};

export const getReferralSettings = async () => {
  const db = await getDb();
  const settings = await db.collection("settings").findOne({ type: "referral" });
  return settings || { enabled: true, rewardPosts: 1 };
};

export const updateReferralSettings = async (data) => {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { type: "referral" },
    { $set: { ...data, type: "referral", updatedAt: new Date() } },
    { upsert: true }
  );
  return true;
};

// Note: getTrendingTopics and generateBlogDraft functions need external API
// These can be implemented via local API routes or third-party services
export const getTrendingTopics = async (geo = "IN") => {
  // This will be handled by a local API route
  const response = await fetch(`/api/trending-topics?geo=${geo}`);
  const data = await response.json();
  return data.topics || [];
};

export const generateBlogDraft = async (topic, adminId, category = "General", tone = "informative and engaging") => {
  // This will be handled by a local API route
  const response = await fetch("/api/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, adminId, category, tone }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
};
