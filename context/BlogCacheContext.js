import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAllBlogs } from "../lib/api-client";

const BlogCacheContext = createContext();

export function BlogCacheProvider({ children }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchBlogs = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Use cache if available and not expired
    if (!force && lastFetch && (now - lastFetch) < CACHE_DURATION && blogs.length > 0) {
      return blogs;
    }

    setLoading(true);
    try {
      const data = await getAllBlogs("approved");
      setBlogs(data);
      setLastFetch(now);
      return data;
    } catch (error) {
      console.error("Error fetching blogs:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [blogs, lastFetch]);

  const refreshBlogs = useCallback(() => {
    return fetchBlogs(true);
  }, [fetchBlogs]);

  const getLatestBlogs = useCallback((count = 6) => {
    return blogs.slice(0, count);
  }, [blogs]);

  const getFeaturedBlog = useCallback(() => {
    return blogs[0] || null;
  }, [blogs]);

  const getBlogsByCategory = useCallback((category) => {
    return blogs.filter((blog) => blog.category === category);
  }, [blogs]);

  // Initial fetch
  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <BlogCacheContext.Provider
      value={{
        blogs,
        loading,
        fetchBlogs,
        refreshBlogs,
        getLatestBlogs,
        getFeaturedBlog,
        getBlogsByCategory,
      }}
    >
      {children}
    </BlogCacheContext.Provider>
  );
}

export function useBlogCache() {
  const context = useContext(BlogCacheContext);
  if (!context) {
    throw new Error("useBlogCache must be used within BlogCacheProvider");
  }
  return context;
}
