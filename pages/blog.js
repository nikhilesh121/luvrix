import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Layout from "../components/Layout";
import { getBlog, getUser, getSettings, incrementBlogViews, getAllBlogs, likeBlog, unlikeBlog, isBlogLiked, isFollowing, followUser, unfollowUser } from "../lib/api-client";
import { cleanContentForDisplay } from "../components/BlogEditor";
import { MagazineHero, MinimalHero, CinematicHero, NewsletterHero, BoldHero, VideoHero, MagazineContent, MinimalContent, CinematicContent, NewsletterContent, BoldContent, VideoContent } from "../components/BlogTemplates";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { BlogArticleSchema, BreadcrumbSchema } from "../components/SEOHead";
import CommentSection from "../components/CommentSection";
import SocialShare from "../components/SocialShare";
import BlogContentWithAds from "../components/BlogContentWithAds";
import AdRenderer from "../components/AdRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCalendar, FiUser, FiTag, FiArrowLeft, FiEye, FiShare2, 
  FiClock, FiBookmark, FiHeart, FiMessageCircle, FiChevronUp,
  FiTwitter, FiFacebook, FiLinkedin, FiCopy, FiCheck,
  FiUserPlus, FiUserCheck
} from "react-icons/fi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

// Helper to serialize timestamps for SSR
const serializeData = (obj) => {
  if (!obj) return null;
  const serialized = { ...obj };
  for (const key in serialized) {
    if (serialized[key]?.toDate) {
      serialized[key] = serialized[key].toDate().toISOString();
    } else if (serialized[key]?.seconds) {
      serialized[key] = new Date(serialized[key].seconds * 1000).toISOString();
    }
  }
  return serialized;
};

export default function BlogPage({ initialBlog, initialAuthor, initialSettings }) {
  const router = useRouter();
  const { id } = router.query;
  const isReady = router.isReady;
  const { user } = useAuth();
  const { joinRoom, leaveRoom, subscribe, emitBlogView, emitBlogLike, emitFollow } = useSocket();
  const [blog, setBlog] = useState(initialBlog);
  const [author, setAuthor] = useState(initialAuthor);
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Join blog room for real-time updates
  useEffect(() => {
    if (blog?.id) {
      const room = `blog:${blog.id}`;
      joinRoom(room);
      setViewCount(blog.views || 0);

      // Subscribe to real-time view updates
      const unsubscribeViews = subscribe('blog:viewUpdate', (data) => {
        if (data.blogId === blog.id) {
          setViewCount(data.views);
        }
      });

      // Subscribe to real-time like updates
      const unsubscribeLikes = subscribe('blog:likeUpdate', (data) => {
        if (data.blogId === blog.id) {
          setLikeCount(data.likes);
          // Update own like status if it was our action
          if (data.userId === user?.uid) {
            setIsLiked(data.action === 'like');
          }
        }
      });

      return () => {
        leaveRoom(room);
        unsubscribeViews();
        unsubscribeLikes();
      };
    }
  }, [blog?.id, joinRoom, leaveRoom, subscribe, user]);

  // Check if blog is liked and if following author
  useEffect(() => {
    async function checkStatus() {
      if (user && blog) {
        const liked = await isBlogLiked(user.uid, blog.id);
        setIsLiked(liked);
        setLikeCount(blog.likes || 0);
        
        // Check follow status
        if (blog.authorId && user.uid !== blog.authorId) {
          const following = await isFollowing(user.uid, blog.authorId);
          setIsFollowingAuthor(following);
        }
      }
    }
    checkStatus();
  }, [user, blog]);

  const handleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!blog?.authorId || user.uid === blog.authorId) return;
    
    setFollowLoading(true);
    try {
      if (isFollowingAuthor) {
        await unfollowUser(user.uid, blog.authorId);
        setIsFollowingAuthor(false);
      } else {
        await followUser(user.uid, blog.authorId);
        setIsFollowingAuthor(true);
        // Emit real-time follow notification
        emitFollow(user.uid, user.displayName || 'Someone', blog.authorId);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLikeLoading(true);
    try {
      if (isLiked) {
        await unlikeBlog(user.uid, blog.id);
        const newLikeCount = Math.max(0, likeCount - 1);
        setIsLiked(false);
        setLikeCount(newLikeCount);
        // Emit real-time like update
        emitBlogLike(blog.id, newLikeCount, user.uid, 'unlike');
      } else {
        await likeBlog(user.uid, blog.id);
        const newLikeCount = likeCount + 1;
        setIsLiked(true);
        setLikeCount(newLikeCount);
        // Emit real-time like update
        emitBlogLike(blog.id, newLikeCount, user.uid, 'like');
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLikeLoading(false);
    }
  };

  // Calculate reading time
  const calculateReadingTime = (content) => {
    if (!content) return 1;
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadingProgress(Math.min(100, progress));
      setShowScrollTop(scrollTop > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Wait for router to be ready before fetching
    if (!isReady) return;

    async function fetchBlog() {
      setLoading(true);
      setError(null);

      // If we have SSR data AND the id matches, use it
      if (initialBlog && initialBlog.id === id) {
        setBlog(initialBlog);
        setAuthor(initialAuthor);
        setSettings(initialSettings);
        setLoading(false);
        // Just increment views and fetch related
        try {
          const result = await incrementBlogViews(id);
          if (result?.views) {
            setViewCount(result.views);
            emitBlogView(id, result.views);
          }
        } catch (e) {
          console.log("Could not increment views");
        }
        // Fetch related blogs
        try {
          const allBlogs = await getAllBlogs("approved", true, 10);
          setRelatedBlogs(allBlogs.filter(b => b.id !== id).slice(0, 3));
        } catch (e) {
          console.log("Could not fetch related blogs");
        }
        return;
      }

      // Client-side fetch when navigating between blogs
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const blogData = await getBlog(id);
        
        if (!blogData || blogData.status !== "approved") {
          setError("Blog not found or not approved");
          setLoading(false);
          return;
        }

        setBlog(blogData);
        setViewCount(blogData.views || 0);
        setLikeCount(blogData.likes || 0);

        // Increment view count
        try {
          const result = await incrementBlogViews(id);
          if (result?.views) {
            setViewCount(result.views);
            emitBlogView(id, result.views);
          }
        } catch (e) {
          console.log("Could not increment views");
        }

        if (blogData.authorId) {
          const authorData = await getUser(blogData.authorId);
          setAuthor(authorData);
        }

        const settingsData = await getSettings();
        setSettings(settingsData);

        // Fetch related blogs
        try {
          const allBlogs = await getAllBlogs("approved", true, 10);
          setRelatedBlogs(allBlogs.filter(b => b.id !== id).slice(0, 3));
        } catch (e) {
          console.log("Could not fetch related blogs");
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load blog");
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [id, isReady]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = blog.title;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === 'native' && navigator.share) {
      navigator.share({ title, text: blog.seoDescription, url });
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Layout title="Loading Article..." description="Loading article content. Please wait.">
        <Head>
          <meta name="robots" content="index, follow" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading article...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !blog) {
    return (
      <Layout title="Blog Not Found">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiBookmark className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Article Not Found</h1>
            <p className="text-gray-500 mb-6">{error || "The article you're looking for doesn't exist or has been removed."}</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition">
              <FiArrowLeft /> Back to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const pageUrl = blog.slug ? `/blog/${blog.slug}` : `/blog?id=${blog.id}`;
  const fullUrl = `${SITE_URL}${pageUrl}`;
  const publishedDate = blog.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
  const modifiedDate = blog.updatedAt?.toDate?.()?.toISOString() || publishedDate;
  const readingTime = calculateReadingTime(blog.content);

  // Generate SEO description from content if not provided
  const generateDescription = () => {
    if (blog.seoDescription) return blog.seoDescription;
    if (blog.content) {
      const plainText = blog.content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      return plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");
    }
    return `Read ${blog.title} on Luvrix - Your destination for amazing stories and insights.`;
  };
  const seoDescription = generateDescription();

  // Ensure absolute image URL
  const getAbsoluteImageUrl = (url) => {
    if (!url) return "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";
    if (url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
  };
  const ogImage = getAbsoluteImageUrl(blog.thumbnail);

  return (
    <Layout
      title={blog.seoTitle || blog.title}
      description={blog.seoDescription}
      keywords={blog.focusKeyword || blog.keywords}
      image={ogImage}
    >
      <Head>
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={fullUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:title" content={blog.seoTitle || blog.title} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={blog.title} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Luvrix" />
        <meta property="article:published_time" content={publishedDate} />
        <meta property="article:modified_time" content={modifiedDate} />
        {blog.category && <meta property="article:section" content={blog.category} />}
        {author?.name && <meta property="article:author" content={author.name} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seoTitle || blog.title} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
        {blog.focusKeyword && <meta name="news_keywords" content={blog.focusKeyword} />}
      </Head>
      
      <BlogArticleSchema blog={blog} url={pageUrl} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: blog.category || "Blog", url: `/categories?cat=${blog.category?.toLowerCase()}` },
        { name: blog.title, url: pageUrl },
      ]} />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
          style={{ width: `${readingProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Floating Share Buttons - Desktop */}
      <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleShare('twitter')}
          className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-[#1DA1F2] hover:shadow-xl transition-all"
          title="Share on Twitter"
        >
          <FiTwitter className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleShare('facebook')}
          className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-[#4267B2] hover:shadow-xl transition-all"
          title="Share on Facebook"
        >
          <FiFacebook className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleShare('linkedin')}
          className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-[#0077B5] hover:shadow-xl transition-all"
          title="Share on LinkedIn"
        >
          <FiLinkedin className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleShare('copy')}
          className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-primary hover:shadow-xl transition-all"
          title="Copy Link"
        >
          {copied ? <FiCheck className="w-5 h-5 text-green-500" /> : <FiCopy className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Hero Section - Template Aware */}
      {blog.template === "magazine" ? (
        <MagazineHero blog={blog} author={author} readingTime={`${readingTime} min read`} viewCount={viewCount} />
      ) : blog.template === "minimal" ? (
        <MinimalHero blog={blog} author={author} readingTime={`${readingTime} min read`} viewCount={viewCount} />
      ) : blog.template === "cinematic" ? (
        <CinematicHero blog={blog} author={author} readingTime={`${readingTime} min read`} viewCount={viewCount} />
      ) : blog.template === "newsletter" ? (
        <NewsletterHero blog={blog} author={author} readingTime={`${readingTime} min read`} viewCount={viewCount} />
      ) : blog.template === "bold" ? (
        <BoldHero blog={blog} author={author} readingTime={`${readingTime} min read`} viewCount={viewCount} />
      ) : blog.template === "video" ? (
        <VideoHero blog={blog} author={author} readingTime={`${readingTime} min read`} viewCount={viewCount} />
      ) : (
        <div className="relative">
          {blog.thumbnail ? (
            <div className="relative aspect-video md:h-[60vh] md:aspect-auto overflow-hidden">
              <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12">
                <div className="max-w-4xl mx-auto">
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition">
                      <FiArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    {blog.category && (
                      <Link href={`/categories?cat=${blog.category.toLowerCase()}`} className="inline-block px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold mb-4 hover:bg-primary/90 transition">
                        {blog.category}
                      </Link>
                    )}
                    <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight break-words line-clamp-4">{blog.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white/80 text-sm md:text-base">
                      {author && (
                        <Link href={`/user/${blog.authorId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
                            {author.photoURL ? <img src={author.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{author.name?.charAt(0)}</div>}
                          </div>
                          <span className="font-medium hover:underline">{author.name}</span>
                        </Link>
                      )}
                      <div className="flex items-center gap-2"><FiCalendar className="w-4 h-4" /><span>{formatDate(blog.createdAt)}</span></div>
                      <div className="flex items-center gap-2"><FiClock className="w-4 h-4" /><span>{readingTime} min read</span></div>
                      <div className="flex items-center gap-2"><FiEye className="w-4 h-4" /><span>{viewCount.toLocaleString()} views</span></div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary/10 via-purple-50 to-pink-50 pt-8 pb-16">
              <div className="max-w-4xl mx-auto px-4">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition"><FiArrowLeft className="w-4 h-4" /> Back to Home</Link>
                {blog.category && <Link href={`/categories?cat=${blog.category.toLowerCase()}`} className="inline-block px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold mb-4">{blog.category}</Link>}
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight break-words line-clamp-4">{blog.title}</h1>
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-600">
                  {author && (
                    <Link href={`/user/${blog.authorId}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden">
                        {author.photoURL ? <img src={author.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary font-bold">{author.name?.charAt(0)}</div>}
                      </div>
                      <span className="font-medium hover:underline">{author.name}</span>
                    </Link>
                  )}
                  <div className="flex items-center gap-2"><FiCalendar className="w-4 h-4" /><span>{formatDate(blog.createdAt)}</span></div>
                  <div className="flex items-center gap-2"><FiClock className="w-4 h-4" /><span>{readingTime} min read</span></div>
                  <div className="flex items-center gap-2"><FiEye className="w-4 h-4" /><span>{viewCount.toLocaleString()} views</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Template Aware */}
      {blog.template === "magazine" ? (
        <MagazineContent>
          <AdRenderer position="content_middle" settings={settings} className="mb-10" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-base md:prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-loose prose-a:text-primary prose-img:rounded-xl prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-xl prose-code:bg-gray-100 prose-code:rounded prose-pre:bg-gray-900 prose-pre:rounded-xl"
            />
          </motion.div>
        </MagazineContent>
      ) : blog.template === "minimal" ? (
        <MinimalContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-loose prose-p:text-lg prose-a:text-primary prose-img:rounded-lg prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:italic prose-code:bg-gray-50 prose-code:rounded prose-pre:bg-gray-900 prose-pre:rounded-lg"
            />
          </motion.div>
        </MinimalContent>
      ) : blog.template === "cinematic" ? (
        <CinematicContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-loose prose-a:text-primary prose-img:rounded-xl prose-img:shadow-xl prose-blockquote:border-l-4 prose-blockquote:border-gray-800 prose-blockquote:bg-gray-50 prose-blockquote:rounded-r-xl prose-code:bg-gray-100 prose-code:rounded prose-pre:bg-gray-950 prose-pre:rounded-xl"
            />
          </motion.div>
        </CinematicContent>
      ) : blog.template === "newsletter" ? (
        <NewsletterContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-base md:prose-lg max-w-none prose-headings:font-extrabold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-img:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:rounded-r-xl prose-code:bg-blue-50 prose-code:text-blue-700 prose-code:rounded prose-pre:bg-gray-900 prose-pre:rounded-xl"
            />
          </motion.div>
        </NewsletterContent>
      ) : blog.template === "bold" ? (
        <BoldContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-loose prose-a:text-purple-600 prose-img:rounded-2xl prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50 prose-blockquote:rounded-r-xl prose-code:bg-purple-50 prose-code:text-purple-700 prose-code:rounded prose-pre:bg-gray-900 prose-pre:rounded-xl"
            />
          </motion.div>
        </BoldContent>
      ) : blog.template === "video" ? (
        <VideoContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-red-600 prose-img:rounded-xl prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:bg-red-50 prose-blockquote:rounded-r-xl prose-code:bg-gray-100 prose-code:rounded prose-pre:bg-gray-900 prose-pre:rounded-xl"
            />
          </motion.div>
        </VideoContent>
      ) : (
        <article className="max-w-4xl mx-auto px-3 sm:px-4 py-6 md:py-12">
          <AdRenderer position="content_middle" settings={settings} className="mb-10" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <BlogContentWithAds
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              className="blog-content prose prose-base md:prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:break-words
                prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-8 md:prose-h2:mt-12 prose-h2:mb-4 md:prose-h2:mb-6
                prose-h3:text-xl md:prose-h3:text-2xl prose-h3:mt-6 md:prose-h3:mt-10 prose-h3:mb-3 md:prose-h3:mb-4
                prose-p:text-gray-700 prose-p:leading-relaxed md:prose-p:leading-loose prose-p:text-base md:prose-p:text-lg
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-words
                prose-img:rounded-xl prose-img:shadow-lg prose-img:w-full
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:italic
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-primary prose-code:break-words
                prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:overflow-x-auto"
            />
          </motion.div>
        </article>
      )}

      {/* Shared sections for all templates */}
      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
        {/* Engagement Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-10 py-6 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                isLiked 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30" 
                  : "bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-500"
              }`}
            >
              {likeLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiHeart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              )}
              <span>{likeCount}</span>
            </motion.button>
            <div className="flex items-center gap-2 text-gray-500">
              <FiEye className="w-5 h-5" />
              <span>{viewCount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm hidden sm:inline">Share:</span>
            <button
              onClick={() => handleShare('twitter')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-[#1DA1F2] hover:text-white transition border border-gray-200"
            >
              <FiTwitter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-[#4267B2] hover:text-white transition border border-gray-200"
            >
              <FiFacebook className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition border border-gray-200"
            >
              {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Share Buttons - Hidden on larger screens */}
        <div className="lg:hidden flex items-center justify-center gap-3 mt-6 py-4 border-t border-gray-100">
          <button
            onClick={() => handleShare('linkedin')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#0077B5] hover:text-white transition"
          >
            <FiLinkedin className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('native')}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white"
          >
            <FiShare2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tags */}
        {blog.keywords && (
          <div className="mt-10">
            <div className="flex flex-wrap gap-2">
              {blog.keywords.split(",").map((keyword) => (
                <span
                  key={keyword}
                  className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 rounded-full text-sm font-medium transition cursor-pointer"
                >
                  #{keyword.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ad Space - Bottom */}
        {settings?.adsEnabled && (
          <div className="mt-10 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl text-center border border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Advertisement</p>
            <div id="blog-bottom-ad" className="min-h-[100px]"></div>
          </div>
        )}

        {/* Author Card with Follow */}
        {author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 bg-gradient-to-br from-primary/5 via-purple-50 to-pink-50 rounded-3xl border border-primary/10"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Link href={`/user/${blog.authorId}`} className="shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg hover:scale-105 transition-transform">
                  {author.photoURL ? (
                    <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    author.name?.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
              <div className="text-center sm:text-left flex-1">
                <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">Written by</p>
                <Link href={`/user/${blog.authorId}`} className="hover:text-primary transition-colors">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{author.name}</h3>
                </Link>
                <p className="text-gray-600 leading-relaxed mb-4">{author.bio || "Passionate content creator sharing insights and stories with the world."}</p>
                {author.uniqueId && (
                  <p className="text-xs text-gray-400 mb-3">ID: {author.uniqueId}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                  <Link
                    href={`/user/${blog.authorId}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <FiUser className="w-4 h-4" />
                    View Profile
                  </Link>
                  {user && user.uid !== blog.authorId && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                        isFollowingAuthor
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-primary text-white shadow-lg shadow-primary/30"
                      }`}
                    >
                      {followLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isFollowingAuthor ? (
                        <>
                          <FiUserCheck className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <FiUserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Related Articles */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="w-10 h-1 bg-primary rounded-full"></span>
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((related) => (
                <motion.div
                  key={related.id}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Link
                    href={related.slug ? `/blog/${related.slug}` : `/blog?id=${related.id}`}
                    className="block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100"
                  >
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      {related.thumbnail ? (
                        <img
                          src={related.thumbnail}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-200">
                          <FiBookmark className="w-8 h-8 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {related.category && (
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {related.category}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mt-2 line-clamp-2 group-hover:text-primary transition">
                        {related.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {calculateReadingTime(related.content)} min
                        </span>
                        <span className="flex items-center gap-1">
                          <FiEye className="w-3 h-3" />
                          {related.views || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <span className="w-10 h-1 bg-primary rounded-full"></span>
            Comments
          </h2>
          <CommentSection targetId={blog.id} targetType="blog" />
        </div>
      </article>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition z-40"
          >
            <FiChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </Layout>
  );
}

// Server-side data fetching for SEO
export async function getServerSideProps(context) {
  const { id } = context.query;
  
  if (!id) {
    return { props: { initialBlog: null, initialAuthor: null, initialSettings: null } };
  }

  try {
    const { getBlog, getUser, getSettings } = await import("../lib/db");
    
    const blogData = await getBlog(id);
    
    if (!blogData || blogData.status !== "approved") {
      return { props: { initialBlog: null, initialAuthor: null, initialSettings: null } };
    }

    // Serialize data for SSR - handle timestamps, ObjectIds, and remove _id
    const serializeData = (obj) => {
      if (!obj) return null;
      const serialized = { ...obj };
      
      // Remove MongoDB _id field (we use 'id' instead)
      delete serialized._id;
      
      for (const key in serialized) {
        const value = serialized[key];
        // Handle date timestamps
        if (value?.toDate) {
          serialized[key] = value.toDate().toISOString();
        } else if (value?.seconds) {
          serialized[key] = new Date(value.seconds * 1000).toISOString();
        }
        // Handle MongoDB ObjectId
        else if (value && typeof value === 'object' && value.constructor?.name === 'ObjectId') {
          serialized[key] = value.toString();
        }
        // Handle Date objects
        else if (value instanceof Date) {
          serialized[key] = value.toISOString();
        }
      }
      return serialized;
    };

    let authorData = null;
    if (blogData.authorId) {
      authorData = await getUser(blogData.authorId);
    }

    const settingsData = await getSettings();

    return {
      props: {
        initialBlog: serializeData(blogData),
        initialAuthor: serializeData(authorData),
        initialSettings: serializeData(settingsData),
      },
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return { props: { initialBlog: null, initialAuthor: null, initialSettings: null } };
  }
}
