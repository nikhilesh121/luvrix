import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  setDoc,
} from "firebase/firestore";

// Helper to serialize Firestore document
const serializeDoc = (doc) => {
  if (!doc.exists()) return null;
  const data = doc.data();
  const serialized = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value && value.toDate) {
      serialized[key] = value.toDate().toISOString();
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
};

// Helper to serialize query snapshot
const serializeDocs = (snapshot) => {
  return snapshot.docs.map((doc) => serializeDoc(doc));
};

// ============================================
// USER FUNCTIONS
// ============================================

export const getUser = async (id) => {
  if (!id) return null;
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  return serializeDoc(docSnap);
};

export const getUserByEmail = async (email) => {
  const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  let users = serializeDocs(snapshot);
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return users;
};

export const updateUser = async (id, data) => {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
};

// ============================================
// BLOG FUNCTIONS
// ============================================

export const getBlog = async (id) => {
  if (!id) return null;
  const docRef = doc(db, "blogs", id);
  const docSnap = await getDoc(docRef);
  return serializeDoc(docSnap);
};

export const getBlogBySlug = async (slug) => {
  const q = query(collection(db, "blogs"), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const getAllBlogs = async (statusFilter = null, limitCount = 50) => {
  const snapshot = await getDocs(collection(db, "blogs"));
  let blogs = serializeDocs(snapshot);
  
  if (statusFilter) {
    blogs = blogs.filter((blog) => blog.status === statusFilter);
  }
  
  blogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return blogs.slice(0, limitCount);
};

export const getUserBlogs = async (userId, status = null) => {
  const q = query(collection(db, "blogs"), where("authorId", "==", userId));
  const snapshot = await getDocs(q);
  let blogs = serializeDocs(snapshot);
  
  if (status) {
    blogs = blogs.filter((blog) => blog.status === status);
  }
  
  blogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return blogs;
};

export const createBlog = async (data) => {
  const docRef = await addDoc(collection(db, "blogs"), {
    ...data,
    status: data.status || "pending",
    views: 0,
    likes: 0,
    shares: 0,
    monthlyViews: 0,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const updateBlog = async (id, data) => {
  const docRef = doc(db, "blogs", id);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
  return true;
};

export const deleteBlog = async (id) => {
  const docRef = doc(db, "blogs", id);
  await deleteDoc(docRef);
  return true;
};

export const incrementBlogViews = async (blogId) => {
  const docRef = doc(db, "blogs", blogId);
  await updateDoc(docRef, { views: increment(1) });
};

export const incrementBlogShares = async (blogId) => {
  const docRef = doc(db, "blogs", blogId);
  await updateDoc(docRef, { shares: increment(1) });
};

// ============================================
// MANGA FUNCTIONS
// ============================================

export const getManga = async (id) => {
  if (!id) return null;
  const docRef = doc(db, "manga", id);
  const docSnap = await getDoc(docRef);
  return serializeDoc(docSnap);
};

export const getMangaBySlug = async (slug) => {
  const q = query(collection(db, "manga"), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return await getManga(slug);
  }
  return serializeDoc(snapshot.docs[0]);
};

export const getAllManga = async () => {
  const snapshot = await getDocs(collection(db, "manga"));
  let manga = serializeDocs(snapshot);
  manga.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return manga;
};

export const incrementMangaViews = async (mangaId) => {
  const docRef = doc(db, "manga", mangaId);
  await updateDoc(docRef, { views: increment(1) });
};

// ============================================
// SETTINGS FUNCTIONS
// ============================================

export const getSettings = async () => {
  const docRef = doc(db, "settings", "main");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return {
      siteName: "Luvrix.com",
      logoUrl: "/logo.png",
      themeColor: "#ff0055",
      blogPostPrice: 49,
      adsEnabled: false,
      headerMenu: ["News", "Anime", "Manga", "Technology"],
      footerText: "© 2026 Luvrix.com",
    };
  }
  return docSnap.data();
};

// ============================================
// COMMENTS
// ============================================

export const getComments = async (targetId, targetType = "blog") => {
  const q = query(collection(db, "comments"), where("targetId", "==", targetId));
  const snapshot = await getDocs(q);
  let comments = serializeDocs(snapshot);
  comments = comments.filter((c) => c.targetType === targetType);
  comments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return comments;
};

export const createComment = async (data) => {
  const docRef = await addDoc(collection(db, "comments"), {
    ...data,
    likes: 0,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const deleteComment = async (commentId) => {
  const docRef = doc(db, "comments", commentId);
  await deleteDoc(docRef);
};

export const likeComment = async (commentId) => {
  const docRef = doc(db, "comments", commentId);
  await updateDoc(docRef, { likes: increment(1) });
};

// ============================================
// FAVORITES
// ============================================

export const addToFavorites = async (userId, itemId, itemType = "blog") => {
  const favId = `${userId}_${itemId}`;
  const docRef = doc(db, "favorites", favId);
  await setDoc(docRef, {
    userId,
    itemId,
    itemType,
    addedAt: new Date(),
  });
  return { success: true };
};

export const removeFromFavorites = async (userId, itemId) => {
  const favId = `${userId}_${itemId}`;
  const docRef = doc(db, "favorites", favId);
  await deleteDoc(docRef);
  return { success: true };
};

export const getUserFavorites = async (userId) => {
  const q = query(collection(db, "favorites"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return serializeDocs(snapshot);
};

export const isItemFavorited = async (userId, itemId) => {
  const favId = `${userId}_${itemId}`;
  const docRef = doc(db, "favorites", favId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

// ============================================
// FOLLOW SYSTEM
// ============================================

export const followUser = async (followerId, followingId) => {
  const followId = `${followerId}_${followingId}`;
  const docRef = doc(db, "follows", followId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return true;
  
  await setDoc(docRef, {
    followerId,
    followingId,
    createdAt: new Date(),
  });
  
  await updateDoc(doc(db, "users", followerId), { followingCount: increment(1) });
  await updateDoc(doc(db, "users", followingId), { followersCount: increment(1) });
  return true;
};

export const unfollowUser = async (followerId, followingId) => {
  const followId = `${followerId}_${followingId}`;
  const docRef = doc(db, "follows", followId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return true;
  
  await deleteDoc(docRef);
  await updateDoc(doc(db, "users", followerId), { followingCount: increment(-1) });
  await updateDoc(doc(db, "users", followingId), { followersCount: increment(-1) });
  return true;
};

export const isFollowing = async (followerId, followingId) => {
  const followId = `${followerId}_${followingId}`;
  const docRef = doc(db, "follows", followId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

export const getFollowers = async (userId) => {
  const q = query(collection(db, "follows"), where("followingId", "==", userId));
  const snapshot = await getDocs(q);
  const followerIds = snapshot.docs.map((doc) => doc.data().followerId);
  const followers = await Promise.all(followerIds.map((id) => getUser(id)));
  return followers.filter(Boolean);
};

export const getFollowing = async (userId) => {
  const q = query(collection(db, "follows"), where("followerId", "==", userId));
  const snapshot = await getDocs(q);
  const followingIds = snapshot.docs.map((doc) => doc.data().followingId);
  const following = await Promise.all(followingIds.map((id) => getUser(id)));
  return following.filter(Boolean);
};

// ============================================
// BLOG LIKES
// ============================================

export const likeBlog = async (userId, blogId) => {
  const likeId = `${userId}_${blogId}`;
  const docRef = doc(db, "blogLikes", likeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return true;
  
  await setDoc(docRef, {
    userId,
    blogId,
    createdAt: new Date(),
  });
  
  await updateDoc(doc(db, "blogs", blogId), { likes: increment(1) });
  return true;
};

export const unlikeBlog = async (userId, blogId) => {
  const likeId = `${userId}_${blogId}`;
  const docRef = doc(db, "blogLikes", likeId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return true;
  
  await deleteDoc(docRef);
  await updateDoc(doc(db, "blogs", blogId), { likes: increment(-1) });
  return true;
};

export const isBlogLiked = async (userId, blogId) => {
  const likeId = `${userId}_${blogId}`;
  const docRef = doc(db, "blogLikes", likeId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

// ============================================
// LEADERBOARD
// ============================================

export const getLeaderboard = async (period = "allTime") => {
  const snapshot = await getDocs(collection(db, "blogs"));
  const blogs = serializeDocs(snapshot).filter((b) => b.status === "approved");
  
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
  
  const leaderboard = Object.values(authorData).map((author) => ({
    ...author,
    userId: author.id.slice(0, 8).toUpperCase(),
    name: author.name || `Blogger ${author.id.slice(0, 6)}`,
  }));
  
  const viewsField = period === "monthly" ? "monthlyViews" : "totalViews";
  return leaderboard
    .sort((a, b) => b[viewsField] - a[viewsField] || b.blogCount - a.blogCount)
    .slice(0, 100);
};

// ============================================
// PUBLISHERS
// ============================================

export const getPublishers = async (category = null, sortBy = "followers") => {
  const usersSnapshot = await getDocs(collection(db, "users"));
  let publishers = serializeDocs(usersSnapshot);
  
  if (category && category !== "all") {
    publishers = publishers.filter((p) => p.publisherCategory === category);
  }
  
  const blogsSnapshot = await getDocs(collection(db, "blogs"));
  const blogs = serializeDocs(blogsSnapshot).filter((b) => b.status === "approved");
  
  const blogsByAuthor = {};
  blogs.forEach((blog) => {
    const authorId = blog.authorId;
    if (!blogsByAuthor[authorId]) {
      blogsByAuthor[authorId] = { count: 0, views: 0 };
    }
    blogsByAuthor[authorId].count++;
    blogsByAuthor[authorId].views += blog.views || 0;
  });
  
  publishers = publishers
    .map((p) => ({
      ...p,
      blogCount: blogsByAuthor[p.id]?.count || 0,
      totalViews: blogsByAuthor[p.id]?.views || 0,
    }))
    .filter((p) => p.blogCount > 0);
  
  if (sortBy === "followers") {
    publishers.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
  } else if (sortBy === "views") {
    publishers.sort((a, b) => b.totalViews - a.totalViews);
  } else if (sortBy === "blogs") {
    publishers.sort((a, b) => b.blogCount - a.blogCount);
  }
  
  return publishers;
};

// ============================================
// GIVEAWAYS
// ============================================

export const getActiveGiveaways = async () => {
  const snapshot = await getDocs(collection(db, "giveaways"));
  let giveaways = serializeDocs(snapshot);
  const now = new Date();
  giveaways = giveaways.filter((g) => {
    const endDate = g.endDate ? new Date(g.endDate) : null;
    return g.status === "active" && (!endDate || endDate > now);
  });
  giveaways.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return giveaways;
};

export const getGiveaway = async (id) => {
  if (!id) return null;
  const docRef = doc(db, "giveaways", id);
  const docSnap = await getDoc(docRef);
  return serializeDoc(docSnap);
};

export const getGiveawayBySlug = async (slug) => {
  const q = query(collection(db, "giveaways"), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

// ============================================
// SUBSCRIBERS
// ============================================

export const addSubscriber = async (email) => {
  const q = query(collection(db, "subscribers"), where("email", "==", email.toLowerCase()), limit(1));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    return { success: false, error: "already_subscribed" };
  }
  
  const docRef = await addDoc(collection(db, "subscribers"), {
    email: email.toLowerCase(),
    subscribedAt: new Date(),
    status: "active",
  });
  return { success: true, id: docRef.id };
};

// ============================================
// SITEMAP
// ============================================

export const getSitemapUrls = async () => {
  const snapshot = await getDocs(collection(db, "sitemap"));
  return serializeDocs(snapshot);
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
// ADDITIONAL FUNCTIONS FOR PROFILE/USER PAGES
// ============================================

export const getUserByUniqueId = async (uniqueId) => {
  const q = query(collection(db, "users"), where("uniqueId", "==", uniqueId), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
};

export const getUserPayments = async (userId) => {
  const q = query(collection(db, "payments"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const payments = serializeDocs(snapshot);
  payments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return payments;
};

export const getUserLibraries = async (userId, includePrivate = false) => {
  const q = query(collection(db, "libraries"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  let libraries = serializeDocs(snapshot);
  if (!includePrivate) {
    libraries = libraries.filter((lib) => lib.isPublic === true);
  }
  return libraries;
};

export const getUserReferrals = async (userId) => {
  const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
  const snapshot = await getDocs(q);
  const referrals = serializeDocs(snapshot);
  referrals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return referrals;
};

export const getReferralStats = async (userId) => {
  const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
  const snapshot = await getDocs(q);
  const referrals = serializeDocs(snapshot);
  return {
    total: referrals.length,
    completed: referrals.filter((r) => r.status === "completed").length,
    pending: referrals.filter((r) => r.status === "pending").length,
  };
};

export const getMyGiveaways = async (userId) => {
  const q = query(collection(db, "giveaway_participants"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return serializeDocs(snapshot);
};

export const createLibrary = async (userId, data) => {
  const docRef = await addDoc(collection(db, "libraries"), {
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
  const docRef = doc(db, "libraries", libraryId);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
  return true;
};

export const deleteLibrary = async (libraryId) => {
  const docRef = doc(db, "libraries", libraryId);
  await deleteDoc(docRef);
  return true;
};

export const addBlogToLibrary = async (libraryId, blogId) => {
  const docRef = doc(db, "libraries", libraryId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return false;
  const data = docSnap.data();
  const blogs = data.blogs || [];
  if (!blogs.includes(blogId)) {
    blogs.push(blogId);
    await updateDoc(docRef, { blogs, updatedAt: new Date() });
  }
  return true;
};

export const removeBlogFromLibrary = async (libraryId, blogId) => {
  const docRef = doc(db, "libraries", libraryId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return false;
  const data = docSnap.data();
  const blogs = (data.blogs || []).filter((id) => id !== blogId);
  await updateDoc(docRef, { blogs, updatedAt: new Date() });
  return true;
};

export const generateReferralCode = async (userId) => {
  const code = `LUV${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, { referralCode: code });
  return code;
};
