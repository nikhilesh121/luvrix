import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { app } from "./config";

export const db = getFirestore(app);

// Generate unique user ID in format: YYYYMMDD0001
export const generateUserId = async () => {
  const today = new Date();
  const datePrefix = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  
  // Get the latest user ID for today to determine the next sequence
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("uniqueId", ">=", datePrefix + "0000"), where("uniqueId", "<=", datePrefix + "9999"));
  const snap = await getDocs(q);
  
  let maxSeq = 0;
  snap.docs.forEach(doc => {
    const userId = doc.data().uniqueId;
    if (userId && userId.startsWith(datePrefix)) {
      const seq = parseInt(userId.slice(-4));
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return datePrefix + nextSeq;
};

// User Functions
export const createUser = async (firebaseUid, data) => {
  // Generate unique user ID
  const uniqueId = await generateUserId();
  
  const userRef = doc(db, "users", firebaseUid);
  const userData = {
    ...data,
    uniqueId,
    firebaseUid,
    role: "USER",
    blocked: false,
    freePostsUsed: 0,
    extraPosts: 0,
    photoURL: data.photoURL || "",
    createdAt: serverTimestamp(),
  };
  
  await setDoc(userRef, userData);
  return { uniqueId, ...userData };
};

// Get user by Firebase UID
export const getUser = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Get user by unique ID (YYYYMMDD0001 format)
export const getUserByUniqueId = async (uniqueId) => {
  try {
    const q = query(collection(db, "users"), where("uniqueId", "==", uniqueId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching user by uniqueId:", error);
    return null;
  }
};

export const updateUser = async (uid, data) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};

export const deleteUser = async (uid) => {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
};

export const getBlockedUserIds = async () => {
  try {
    const q = query(collection(db, "users"), where("blocked", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return [];
  }
};

export const hideUserPosts = async (userId) => {
  try {
    const q = query(collection(db, "blogs"), where("authorId", "==", userId));
    const snap = await getDocs(q);
    const updates = snap.docs.map((d) => updateDoc(doc(db, "blogs", d.id), { status: "hidden" }));
    await Promise.all(updates);
    return { success: true, count: snap.docs.length };
  } catch (error) {
    console.error("Error hiding user posts:", error);
    return { success: false, error };
  }
};

export const unhideUserPosts = async (userId) => {
  try {
    const q = query(collection(db, "blogs"), where("authorId", "==", userId), where("status", "==", "hidden"));
    const snap = await getDocs(q);
    const updates = snap.docs.map((d) => updateDoc(doc(db, "blogs", d.id), { status: "approved" }));
    await Promise.all(updates);
    return { success: true, count: snap.docs.length };
  } catch (error) {
    console.error("Error unhiding user posts:", error);
    return { success: false, error };
  }
};

export const getAllUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return users.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Blog Functions
export const createBlog = async (data) => {
  const blogRef = await addDoc(collection(db, "blogs"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return blogRef.id;
};

export const getBlog = async (id) => {
  const blogRef = doc(db, "blogs", id);
  const snap = await getDoc(blogRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllBlogs = async (statusFilter = null, excludeBlockedUsers = true, limitCount = 50) => {
  try {
    let q = statusFilter
      ? query(collection(db, "blogs"), where("status", "==", statusFilter), limit(limitCount))
      : query(collection(db, "blogs"), limit(limitCount));
    const snap = await getDocs(q);
    let blogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Filter out posts from blocked users (for public pages)
    if (excludeBlockedUsers) {
      const blockedIds = await getBlockedUserIds();
      if (blockedIds.length > 0) {
        blogs = blogs.filter((blog) => !blockedIds.includes(blog.authorId));
      }
    }
    
    return blogs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
};

export const updateBlog = async (id, data) => {
  const blogRef = doc(db, "blogs", id);
  await updateDoc(blogRef, data);
};

export const deleteBlog = async (id) => {
  const blog = await getBlog(id);
  const blogRef = doc(db, "blogs", id);
  await deleteDoc(blogRef);
  // Remove from sitemap
  if (blog?.slug) {
    try {
      await deleteSitemapByUrl(`/blog/${blog.slug}`);
    } catch (e) {
      console.error("Error removing blog from sitemap:", e);
    }
  }
};

export const approveBlog = async (id) => {
  const blog = await getBlog(id);
  await updateBlog(id, { status: "approved" });
  // Auto-register to sitemap
  if (blog?.slug) {
    try {
      await addSitemapUrl({
        url: `/blog/${blog.slug}`,
        title: blog.title,
        type: "blog",
        changefreq: "weekly",
        priority: "0.7",
      });
    } catch (e) {
      console.error("Error adding blog to sitemap:", e);
    }
  }
};

export const rejectBlog = async (id) => {
  await updateBlog(id, { status: "rejected" });
};

// Manga Functions
export const createManga = async (data) => {
  const mangaRef = await addDoc(collection(db, "manga"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Auto-register to sitemap
  if (data.slug) {
    try {
      await addSitemapUrl({
        url: `/manga/${data.slug}`,
        title: data.title,
        type: "manga",
        changefreq: "weekly",
        priority: "0.8",
      });
      // Add chapter pages
      const totalChapters = data.totalChapters || 1;
      for (let i = 1; i <= totalChapters; i++) {
        await addSitemapUrl({
          url: `/manga/${data.slug}/chapter-${i}`,
          title: `${data.title} Chapter ${i}`,
          type: "chapter",
          parentSlug: data.slug,
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    } catch (e) {
      console.error("Error adding manga to sitemap:", e);
    }
  }
  return mangaRef.id;
};

export const getManga = async (id) => {
  const mangaRef = doc(db, "manga", id);
  const snap = await getDoc(mangaRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getMangaBySlug = async (slug) => {
  try {
    const q = query(collection(db, "manga"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) {
      // Fallback: try to find by ID if slug not found
      return await getManga(slug);
    }
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching manga by slug:", error);
    return null;
  }
};

export const getAllManga = async () => {
  try {
    const snap = await getDocs(collection(db, "manga"));
    const manga = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return manga.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching manga:", error);
    return [];
  }
};

export const updateManga = async (id, data) => {
  const oldManga = await getManga(id);
  const mangaRef = doc(db, "manga", id);
  await updateDoc(mangaRef, data);
  
  // Update sitemap if chapters changed
  if (data.slug && data.totalChapters && oldManga) {
    const oldChapters = oldManga.totalChapters || 1;
    const newChapters = data.totalChapters || 1;
    
    if (newChapters > oldChapters) {
      // Add new chapters to sitemap
      try {
        for (let i = oldChapters + 1; i <= newChapters; i++) {
          await addSitemapUrl({
            url: `/manga/${data.slug}/chapter-${i}`,
            title: `${data.title || oldManga.title} Chapter ${i}`,
            type: "chapter",
            parentSlug: data.slug,
            changefreq: "monthly",
            priority: "0.6",
          });
        }
      } catch (e) {
        console.error("Error adding new chapters to sitemap:", e);
      }
    }
  }
};

export const deleteManga = async (id) => {
  const manga = await getManga(id);
  const mangaRef = doc(db, "manga", id);
  await deleteDoc(mangaRef);
  // Remove from sitemap
  if (manga?.slug) {
    try {
      await deleteSitemapByUrl(`/manga/${manga.slug}`);
      // Remove all chapters
      const chapters = await getDocs(
        query(collection(db, "sitemap"), where("parentSlug", "==", manga.slug))
      );
      for (const ch of chapters.docs) {
        await deleteDoc(doc(db, "sitemap", ch.id));
      }
    } catch (e) {
      console.error("Error removing manga from sitemap:", e);
    }
  }
};

// Settings Functions
export const getSettings = async () => {
  const settingsRef = doc(db, "settings", "main");
  const snap = await getDoc(settingsRef);
  return snap.exists() ? snap.data() : getDefaultSettings();
};

export const updateSettings = async (data) => {
  const { setDoc } = await import("firebase/firestore");
  const settingsRef = doc(db, "settings", "main");
  await setDoc(settingsRef, data, { merge: true });
};

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
  // PayU Settings
  payuMerchantId: "",
  payuMerchantKey: "",
  payuMerchantSalt: "",
  payuTestMode: true,
});

// Payment Functions
export const createPayment = async (data) => {
  const paymentRef = await addDoc(collection(db, "payments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return paymentRef.id;
};

export const updatePayment = async (txnId, data) => {
  try {
    const q = query(collection(db, "payments"), where("txnId", "==", txnId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const paymentDoc = snap.docs[0];
      await updateDoc(doc(db, "payments", paymentDoc.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating payment:", error);
    return false;
  }
};

export const getAllPayments = async () => {
  try {
    const snap = await getDocs(collection(db, "payments"));
    const payments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return payments.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
};

export const getUserPayments = async (userId) => {
  try {
    const q = query(collection(db, "payments"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const payments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return payments.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    return [];
  }
};

// User Post Limits
export const incrementFreePostsUsed = async (uid) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { freePostsUsed: increment(1) });
};

export const addExtraPosts = async (uid, count) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { extraPosts: increment(count) });
};

export const decrementExtraPosts = async (uid) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { extraPosts: increment(-1) });
};

// Blog Views & Shares
export const incrementBlogViews = async (blogId) => {
  const blogRef = doc(db, "blogs", blogId);
  await updateDoc(blogRef, { views: increment(1) });
};

export const incrementBlogShares = async (blogId) => {
  const blogRef = doc(db, "blogs", blogId);
  await updateDoc(blogRef, { shares: increment(1) });
};

// Manga Views & Favorites
export const incrementMangaViews = async (mangaId) => {
  try {
    const mangaRef = doc(db, "manga", mangaId);
    await updateDoc(mangaRef, { views: increment(1) });
  } catch (error) {
    console.error("Error incrementing manga views:", error);
  }
};

export const incrementMangaFavorites = async (mangaId) => {
  try {
    const mangaRef = doc(db, "manga", mangaId);
    await updateDoc(mangaRef, { favorites: increment(1) });
  } catch (error) {
    console.error("Error incrementing manga favorites:", error);
  }
};

export const decrementMangaFavorites = async (mangaId) => {
  try {
    const mangaRef = doc(db, "manga", mangaId);
    await updateDoc(mangaRef, { favorites: increment(-1) });
  } catch (error) {
    console.error("Error decrementing manga favorites:", error);
  }
};

// Comments
export const createComment = async (data) => {
  const commentRef = await addDoc(collection(db, "comments"), {
    ...data,
    createdAt: serverTimestamp(),
    likes: 0,
  });
  return commentRef.id;
};

export const getComments = async (targetId, targetType = "blog") => {
  try {
    const q = query(
      collection(db, "comments"),
      where("targetId", "==", targetId),
      where("targetType", "==", targetType)
    );
    const snap = await getDocs(q);
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return comments.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const deleteComment = async (commentId) => {
  await deleteDoc(doc(db, "comments", commentId));
};

export const likeComment = async (commentId) => {
  const commentRef = doc(db, "comments", commentId);
  await updateDoc(commentRef, { likes: increment(1) });
};

// Admin Logs
export const createLog = async (data) => {
  await addDoc(collection(db, "logs"), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getAllLogs = async () => {
  try {
    const snap = await getDocs(collection(db, "logs"));
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return logs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    }).slice(0, 100);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

// Leaderboard Functions
export const getLeaderboard = async (period = 'allTime') => {
  try {
    // Get all blogs and filter in memory (avoids index requirements)
    const blogsSnap = await getDocs(collection(db, "blogs"));
    const allBlogs = blogsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(b => b.status === "approved");
    
    if (allBlogs.length === 0) {
      return [];
    }

    // Group by author
    const authorData = {};
    for (const blog of allBlogs) {
      const authorId = blog.authorId || blog.author || blog.userId;
      if (!authorId) continue;
      
      if (!authorData[authorId]) {
        authorData[authorId] = {
          id: authorId,
          name: blog.authorName || blog.authorDisplayName || null,
          photo: blog.authorPhoto || blog.authorPhotoURL || null,
          totalViews: 0,
          monthlyViews: 0,
          blogCount: 0,
        };
      }
      
      // Update name/photo if found
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

    // Convert to array
    const leaderboard = Object.values(authorData).map(author => ({
      ...author,
      userId: author.id.slice(0, 8).toUpperCase(),
      name: author.name || `Blogger ${author.id.slice(0, 6)}`,
    }));

    // Sort by views
    const viewsField = period === 'monthly' ? 'monthlyViews' : 'totalViews';
    return leaderboard
      .sort((a, b) => b[viewsField] - a[viewsField] || b.blogCount - a.blogCount)
      .slice(0, 100);
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    return [];
  }
};

// Record blog view with device tracking
export const recordBlogView = async (blogId, deviceId) => {
  try {
    const viewKey = `${blogId}_${deviceId}`;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if view already recorded today
    const viewsRef = collection(db, "blogViews");
    const q = query(viewsRef, where("viewKey", "==", viewKey), where("date", "==", today));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      // Record new view
      await addDoc(viewsRef, {
        blogId,
        deviceId,
        viewKey,
        date: today,
        createdAt: serverTimestamp(),
      });
      
      // Increment blog views
      await incrementBlogViews(blogId);
      
      // Increment monthly views
      const blogRef = doc(db, "blogs", blogId);
      await updateDoc(blogRef, { monthlyViews: increment(1) });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error recording blog view:", error);
    return false;
  }
};

// Admin Rewards Functions
export const createReward = async (data) => {
  const rewardRef = await addDoc(collection(db, "rewards"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return rewardRef.id;
};

export const getAllRewards = async () => {
  try {
    const snap = await getDocs(collection(db, "rewards"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }
};

export const updateUserPublicId = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists() && !userSnap.data().userId) {
    const publicId = 'LX' + Math.random().toString(36).substr(2, 6).toUpperCase();
    await updateDoc(userRef, { userId: publicId });
    return publicId;
  }
  return userSnap.data()?.userId || null;
};

// Favorites Functions
export const addToFavorites = async (userId, itemId, itemType = "blog") => {
  try {
    const favRef = doc(db, "users", userId, "favorites", itemId);
    const { setDoc } = await import("firebase/firestore");
    await setDoc(favRef, {
      itemId,
      itemType,
      addedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return { success: false, error };
  }
};

export const removeFromFavorites = async (userId, itemId) => {
  try {
    const favRef = doc(db, "users", userId, "favorites", itemId);
    await deleteDoc(favRef);
    return { success: true };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return { success: false, error };
  }
};

export const getUserFavorites = async (userId) => {
  try {
    const favsSnap = await getDocs(collection(db, "users", userId, "favorites"));
    return favsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const isItemFavorited = async (userId, itemId) => {
  try {
    const favRef = doc(db, "users", userId, "favorites", itemId);
    const snap = await getDoc(favRef);
    return snap.exists();
  } catch (error) {
    return false;
  }
};

// Sitemap Functions
export const addSitemapUrl = async (data) => {
  try {
    const existing = await getDocs(
      query(collection(db, "sitemap"), where("url", "==", data.url))
    );
    if (!existing.empty) {
      // Update existing
      await updateDoc(doc(db, "sitemap", existing.docs[0].id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return existing.docs[0].id;
    }
    const ref = await addDoc(collection(db, "sitemap"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error("Error adding sitemap URL:", error);
    return null;
  }
};

export const getSitemapUrls = async () => {
  try {
    const snap = await getDocs(collection(db, "sitemap"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    return [];
  }
};

export const deleteSitemapUrl = async (id) => {
  try {
    await deleteDoc(doc(db, "sitemap", id));
    return true;
  } catch (error) {
    console.error("Error deleting sitemap URL:", error);
    return false;
  }
};

export const deleteSitemapByUrl = async (url) => {
  try {
    const existing = await getDocs(
      query(collection(db, "sitemap"), where("url", "==", url))
    );
    if (!existing.empty) {
      await deleteDoc(doc(db, "sitemap", existing.docs[0].id));
    }
    return true;
  } catch (error) {
    console.error("Error deleting sitemap by URL:", error);
    return false;
  }
};

// Auto-register blog/manga to sitemap
export const registerBlogToSitemap = async (slug, title) => {
  return addSitemapUrl({
    url: `/blog/${slug}`,
    title,
    type: "blog",
    changefreq: "weekly",
    priority: "0.7",
  });
};

export const registerMangaToSitemap = async (slug, title, totalChapters = 1) => {
  // Add main manga page
  await addSitemapUrl({
    url: `/manga/${slug}`,
    title,
    type: "manga",
    changefreq: "weekly",
    priority: "0.8",
  });
  
  // Add chapter pages
  for (let i = 1; i <= totalChapters; i++) {
    await addSitemapUrl({
      url: `/manga/${slug}/chapter-${i}`,
      title: `${title} Chapter ${i}`,
      type: "chapter",
      parentSlug: slug,
      changefreq: "monthly",
      priority: "0.6",
    });
  }
};

export const removeMangaFromSitemap = async (slug) => {
  try {
    // Remove main manga page
    await deleteSitemapByUrl(`/manga/${slug}`);
    
    // Remove all chapters
    const chapters = await getDocs(
      query(collection(db, "sitemap"), where("parentSlug", "==", slug))
    );
    for (const ch of chapters.docs) {
      await deleteDoc(doc(db, "sitemap", ch.id));
    }
    return true;
  } catch (error) {
    console.error("Error removing manga from sitemap:", error);
    return false;
  }
};

// Subscriber Functions
export const addSubscriber = async (email) => {
  try {
    // Check if email already exists
    const existing = await getDocs(
      query(collection(db, "subscribers"), where("email", "==", email.toLowerCase()))
    );
    if (!existing.empty) {
      return { success: false, error: "already_subscribed" };
    }
    
    const ref = await addDoc(collection(db, "subscribers"), {
      email: email.toLowerCase(),
      subscribedAt: serverTimestamp(),
      status: "active",
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error("Error adding subscriber:", error);
    return { success: false, error: error.message };
  }
};

export const getAllSubscribers = async () => {
  try {
    const snap = await getDocs(collection(db, "subscribers"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
      const dateA = a.subscribedAt?.toDate?.() || new Date(0);
      const dateB = b.subscribedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return [];
  }
};

export const deleteSubscriber = async (id) => {
  try {
    await deleteDoc(doc(db, "subscribers", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return { success: false, error: error.message };
  }
};

export const updateSubscriberStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "subscribers", id), { status });
    return { success: true };
  } catch (error) {
    console.error("Error updating subscriber:", error);
    return { success: false, error: error.message };
  }
};

// Leaderboard with all users
export const getLeaderboardWithAllUsers = async () => {
  try {
    // Get all users
    const usersSnap = await getDocs(collection(db, "users"));
    const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Get all approved blogs
    const blogsSnap = await getDocs(
      query(collection(db, "blogs"), where("status", "==", "approved"))
    );
    const allBlogs = blogsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Build user stats
    const userStats = {};
    for (const user of allUsers) {
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

    // Aggregate blog stats
    for (const blog of allBlogs) {
      const authorId = blog.authorId || blog.author || blog.userId;
      if (authorId && userStats[authorId]) {
        userStats[authorId].blogCount += 1;
        userStats[authorId].totalViews += Number(blog.views) || 0;
      }
    }

    // Convert to array and sort by views (high to low), then by blog count
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.totalViews - a.totalViews || b.blogCount - a.blogCount)
      .slice(0, 100);

    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

// ============================================
// BLOG DRAFTS (AI-Generated)
// ============================================

const FUNCTIONS_BASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  "https://us-central1-singlestore-14943.cloudfunctions.net";

export const getTrendingTopics = async (geo = "IN") => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/trendingTopics?geo=${geo}`);
    const data = await response.json();
    if (data.success) {
      return data.topics;
    }
    throw new Error(data.error || "Failed to fetch trending topics");
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    throw error;
  }
};

export const generateBlogDraft = async (topic, adminId, category = "General", tone = "informative and engaging") => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateBlogDraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, adminId, category, tone }),
    });
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.error || "Failed to generate draft");
  } catch (error) {
    console.error("Error generating blog draft:", error);
    throw error;
  }
};

export const getBlogDrafts = async (status = "draft") => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/getBlogDrafts?status=${status}`);
    const data = await response.json();
    if (data.success) {
      return data.drafts;
    }
    throw new Error(data.error || "Failed to fetch drafts");
  } catch (error) {
    console.error("Error fetching blog drafts:", error);
    throw error;
  }
};

export const getBlogDraft = async (draftId) => {
  try {
    const docRef = doc(db, "blogDrafts", draftId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching draft:", error);
    throw error;
  }
};

export const updateBlogDraft = async (draftId, data) => {
  try {
    const docRef = doc(db, "blogDrafts", draftId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating draft:", error);
    throw error;
  }
};

export const publishBlogDraft = async (draftId, adminId, authorName, authorPhoto) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/publishBlogDraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, adminId, authorName, authorPhoto }),
    });
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.error || "Failed to publish draft");
  } catch (error) {
    console.error("Error publishing draft:", error);
    throw error;
  }
};

export const deleteBlogDraft = async (draftId) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/deleteBlogDraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId }),
    });
    const data = await response.json();
    if (data.success) {
      return true;
    }
    throw new Error(data.error || "Failed to delete draft");
  } catch (error) {
    console.error("Error deleting draft:", error);
    throw error;
  }
};

// ============================================
// FOLLOW SYSTEM
// ============================================

export const followUser = async (followerId, followingId) => {
  try {
    const followRef = doc(db, "follows", `${followerId}_${followingId}`);
    const { setDoc } = await import("firebase/firestore");
    await setDoc(followRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
    // Update follower counts
    const followerRef = doc(db, "users", followerId);
    const followingRef = doc(db, "users", followingId);
    await updateDoc(followerRef, { followingCount: increment(1) });
    await updateDoc(followingRef, { followersCount: increment(1) });
    return true;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

export const unfollowUser = async (followerId, followingId) => {
  try {
    const followRef = doc(db, "follows", `${followerId}_${followingId}`);
    await deleteDoc(followRef);
    // Update follower counts
    const followerRef = doc(db, "users", followerId);
    const followingRef = doc(db, "users", followingId);
    await updateDoc(followerRef, { followingCount: increment(-1) });
    await updateDoc(followingRef, { followersCount: increment(-1) });
    return true;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

export const isFollowing = async (followerId, followingId) => {
  try {
    const followRef = doc(db, "follows", `${followerId}_${followingId}`);
    const snap = await getDoc(followRef);
    return snap.exists();
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
};

export const getFollowers = async (userId) => {
  try {
    const q = query(collection(db, "follows"), where("followingId", "==", userId));
    const snap = await getDocs(q);
    const followerIds = snap.docs.map(d => d.data().followerId);
    const followers = await Promise.all(followerIds.map(id => getUser(id)));
    return followers.filter(Boolean);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return [];
  }
};

export const getFollowing = async (userId) => {
  try {
    const q = query(collection(db, "follows"), where("followerId", "==", userId));
    const snap = await getDocs(q);
    const followingIds = snap.docs.map(d => d.data().followingId);
    const following = await Promise.all(followingIds.map(id => getUser(id)));
    return following.filter(Boolean);
  } catch (error) {
    console.error("Error fetching following:", error);
    return [];
  }
};

// ============================================
// BLOG LIKES
// ============================================

export const likeBlog = async (userId, blogId) => {
  try {
    const likeRef = doc(db, "blogLikes", `${userId}_${blogId}`);
    const { setDoc } = await import("firebase/firestore");
    await setDoc(likeRef, {
      userId,
      blogId,
      createdAt: serverTimestamp(),
    });
    // Update blog like count
    const blogRef = doc(db, "blogs", blogId);
    await updateDoc(blogRef, { likes: increment(1) });
    return true;
  } catch (error) {
    console.error("Error liking blog:", error);
    throw error;
  }
};

export const unlikeBlog = async (userId, blogId) => {
  try {
    const likeRef = doc(db, "blogLikes", `${userId}_${blogId}`);
    await deleteDoc(likeRef);
    // Update blog like count
    const blogRef = doc(db, "blogs", blogId);
    await updateDoc(blogRef, { likes: increment(-1) });
    return true;
  } catch (error) {
    console.error("Error unliking blog:", error);
    throw error;
  }
};

export const isBlogLiked = async (userId, blogId) => {
  try {
    const likeRef = doc(db, "blogLikes", `${userId}_${blogId}`);
    const snap = await getDoc(likeRef);
    return snap.exists();
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
};

export const getBlogLikesCount = async (blogId) => {
  try {
    const q = query(collection(db, "blogLikes"), where("blogId", "==", blogId));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error("Error fetching likes count:", error);
    return 0;
  }
};

// ============================================
// USER LIBRARIES (Story Collections)
// ============================================

export const createLibrary = async (userId, data) => {
  try {
    const libraryRef = await addDoc(collection(db, "libraries"), {
      userId,
      name: data.name,
      description: data.description || "",
      isPublic: data.isPublic !== false,
      blogs: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return libraryRef.id;
  } catch (error) {
    console.error("Error creating library:", error);
    throw error;
  }
};

export const updateLibrary = async (libraryId, data) => {
  try {
    const libraryRef = doc(db, "libraries", libraryId);
    await updateDoc(libraryRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating library:", error);
    throw error;
  }
};

export const deleteLibrary = async (libraryId) => {
  try {
    await deleteDoc(doc(db, "libraries", libraryId));
    return true;
  } catch (error) {
    console.error("Error deleting library:", error);
    throw error;
  }
};

export const getUserLibraries = async (userId, includePrivate = false) => {
  try {
    let q;
    if (includePrivate) {
      q = query(collection(db, "libraries"), where("userId", "==", userId));
    } else {
      q = query(collection(db, "libraries"), where("userId", "==", userId), where("isPublic", "==", true));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching libraries:", error);
    return [];
  }
};

export const addBlogToLibrary = async (libraryId, blogId) => {
  try {
    const libraryRef = doc(db, "libraries", libraryId);
    const { arrayUnion } = await import("firebase/firestore");
    await updateDoc(libraryRef, {
      blogs: arrayUnion(blogId),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error adding blog to library:", error);
    throw error;
  }
};

export const removeBlogFromLibrary = async (libraryId, blogId) => {
  try {
    const libraryRef = doc(db, "libraries", libraryId);
    const { arrayRemove } = await import("firebase/firestore");
    await updateDoc(libraryRef, {
      blogs: arrayRemove(blogId),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error removing blog from library:", error);
    throw error;
  }
};

export const getLibrary = async (libraryId) => {
  try {
    const libraryRef = doc(db, "libraries", libraryId);
    const snap = await getDoc(libraryRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error("Error fetching library:", error);
    return null;
  }
};

// ============================================
// PUBLIC USER PROFILE
// ============================================

export const getUserByUsername = async (username) => {
  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return null;
  }
};

export const getUserBlogs = async (userId, status = null) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, "blogs"),
        where("authorId", "==", userId),
        where("status", "==", status)
      );
    } else {
      q = query(
        collection(db, "blogs"),
        where("authorId", "==", userId)
      );
    }
    const snap = await getDocs(q);
    const blogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort by createdAt in memory to avoid composite index requirement
    return blogs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching user blogs:", error);
    return [];
  }
};

export const getUserStats = async (userId) => {
  try {
    const blogs = await getUserBlogs(userId, "approved");
    const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
    
    // Get follower/following counts from user doc
    const user = await getUser(userId);
    
    return {
      totalBlogs: blogs.length,
      totalViews,
      totalLikes,
      followersCount: user?.followersCount || 0,
      followingCount: user?.followingCount || 0,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { totalBlogs: 0, totalViews: 0, totalLikes: 0, followersCount: 0, followingCount: 0 };
  }
};

// ============================================
// PUBLISHERS/CREATORS DISCOVERY
// ============================================

export const getPublishers = async (category = null, sortBy = "followers") => {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let publishers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Filter by category if specified
    if (category && category !== "all") {
      publishers = publishers.filter(p => p.publisherCategory === category);
    }
    
    // Get blog counts for each publisher
    const blogsSnap = await getDocs(query(collection(db, "blogs"), where("status", "==", "approved")));
    const blogsByAuthor = {};
    blogsSnap.docs.forEach(d => {
      const authorId = d.data().authorId;
      if (!blogsByAuthor[authorId]) blogsByAuthor[authorId] = { count: 0, views: 0 };
      blogsByAuthor[authorId].count++;
      blogsByAuthor[authorId].views += d.data().views || 0;
    });
    
    // Enrich publishers with blog stats
    publishers = publishers.map(p => ({
      ...p,
      blogCount: blogsByAuthor[p.id]?.count || 0,
      totalViews: blogsByAuthor[p.id]?.views || 0,
    })).filter(p => p.blogCount > 0); // Only show users with published blogs
    
    // Sort
    if (sortBy === "followers") {
      publishers.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    } else if (sortBy === "views") {
      publishers.sort((a, b) => b.totalViews - a.totalViews);
    } else if (sortBy === "blogs") {
      publishers.sort((a, b) => b.blogCount - a.blogCount);
    }
    
    return publishers;
  } catch (error) {
    console.error("Error fetching publishers:", error);
    return [];
  }
};

export const updatePublisherCategory = async (userId, category) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { publisherCategory: category });
    return true;
  } catch (error) {
    console.error("Error updating publisher category:", error);
    throw error;
  }
};

// Admin direct blog publish (bypasses limits)
export const adminPublishBlog = async (blogData, adminId) => {
  try {
    const slug = blogData.slug || blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    const docRef = await addDoc(collection(db, "blogs"), {
      ...blogData,
      slug,
      authorId: adminId,
      status: "approved",
      views: 0,
      monthlyViews: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error publishing blog:", error);
    throw error;
  }
};
