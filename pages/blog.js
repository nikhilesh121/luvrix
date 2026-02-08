import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Layout from "../components/Layout";
import { getBlog, getBlogBySlug, getUser, getSettings, incrementBlogViews, getAllBlogs, likeBlog, unlikeBlog, isBlogLiked, isFollowing, followUser, unfollowUser } from "../lib/api-client";
import { cleanContentForDisplay } from "../components/BlogEditor";
import { MagazineHero, MinimalHero, CinematicHero, NewsletterHero, BoldHero, VideoHero, MagazineContent, MinimalContent, CinematicContent, NewsletterContent, BoldContent, VideoContent } from "../components/BlogTemplates";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { BlogArticleSchema, BreadcrumbSchema } from "../components/SEOHead";
import CommentSection from "../components/CommentSection";
import BlogHero from "../components/BlogHero";
import BlogContentRenderer from "../components/BlogContentRenderer";
import AdRenderer from "../components/AdRenderer";
import { shouldShowBlogAds, getBlogAdPlacements } from "../lib/ads";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCalendar, FiUser, FiArrowLeft, FiEye, FiShare2, 
  FiClock, FiBookmark, FiHeart, FiChevronUp,
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
  const { id, slug } = router.query;
  const blogId = id || initialBlog?.id;
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
      if (initialBlog && initialBlog.id === blogId) {
        setBlog(initialBlog);
        setAuthor(initialAuthor);
        setSettings(initialSettings);
        setLoading(false);
        // Just increment views and fetch related
        try {
          const result = await incrementBlogViews(blogId);
          if (result?.views) {
            setViewCount(result.views);
            emitBlogView(blogId, result.views);
          }
        } catch (e) {
          console.log("Could not increment views");
        }
        // Fetch related blogs
        try {
          const allBlogs = await getAllBlogs("approved", true, 10);
          setRelatedBlogs(allBlogs.filter(b => b.id !== blogId).slice(0, 3));
        } catch (e) {
          console.log("Could not fetch related blogs");
        }
        return;
      }

      // Client-side fetch when navigating between blogs
      if (!blogId) {
        setLoading(false);
        return;
      }

      try {
        const blogData = slug ? await getBlogBySlug(slug) : await getBlog(blogId);
        
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
  }, [blogId, slug, isReady]);

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
  const showAds = shouldShowBlogAds(settings, blog);
  const adPlacements = getBlogAdPlacements(settings, blog);

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

      {/* Inject admin blog color + spacing settings as CSS custom properties */}
      <style jsx global>{`
        :root {
          ${settings?.blogTextColorLight ? `--blog-text-color: ${settings.blogTextColorLight};` : ''}
          ${settings?.blogTextColorDark ? `--blog-text-color-dark: ${settings.blogTextColorDark};` : ''}
          ${settings?.blogHeadingColorLight ? `--blog-heading-color: ${settings.blogHeadingColorLight};` : ''}
          ${settings?.blogHeadingColorDark ? `--blog-heading-color-dark: ${settings.blogHeadingColorDark};` : ''}
          ${settings?.blogLinkColorLight ? `--blog-link-color: ${settings.blogLinkColorLight};` : ''}
          ${settings?.blogLinkColorDark ? `--blog-link-color-dark: ${settings.blogLinkColorDark};` : ''}
          ${settings?.blogH1MarginTop ? `--blog-h1-mt: ${settings.blogH1MarginTop};` : ''}
          ${settings?.blogH1MarginBottom ? `--blog-h1-mb: ${settings.blogH1MarginBottom};` : ''}
          ${settings?.blogH2MarginTop ? `--blog-h2-mt: ${settings.blogH2MarginTop};` : ''}
          ${settings?.blogH2MarginBottom ? `--blog-h2-mb: ${settings.blogH2MarginBottom};` : ''}
          ${settings?.blogH3MarginTop ? `--blog-h3-mt: ${settings.blogH3MarginTop};` : ''}
          ${settings?.blogH3MarginBottom ? `--blog-h3-mb: ${settings.blogH3MarginBottom};` : ''}
          ${settings?.blogParagraphMarginBottom ? `--blog-p-mb: ${settings.blogParagraphMarginBottom};` : ''}
          ${settings?.blogLineHeight ? `--blog-line-height: ${settings.blogLineHeight};` : ''}
          ${settings?.blogLetterSpacing ? `--blog-letter-spacing: ${settings.blogLetterSpacing};` : ''}
          ${settings?.blogWordSpacing ? `--blog-word-spacing: ${settings.blogWordSpacing};` : ''}
        }
      `}</style>

      {/* ═══════════════════════════════════════════════
           READING PROGRESS BAR
         ═══════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 h-0.5 sm:h-1 bg-gray-200/60 dark:bg-gray-700/60 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
          style={{ width: `${readingProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* ═══════════════════════════════════════════════
           FLOATING SHARE — Desktop only (left rail)
         ═══════════════════════════════════════════════ */}
      <div className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col gap-2.5 z-40">
        {[
          { fn: () => handleShare('twitter'),  icon: <FiTwitter className="w-4 h-4" />,  hover: 'hover:text-[#1DA1F2]' },
          { fn: () => handleShare('facebook'), icon: <FiFacebook className="w-4 h-4" />, hover: 'hover:text-[#4267B2]' },
          { fn: () => handleShare('linkedin'), icon: <FiLinkedin className="w-4 h-4" />, hover: 'hover:text-[#0077B5]' },
          { fn: () => handleShare('copy'),     icon: copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />, hover: 'hover:text-primary' },
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={btn.fn}
            className={`w-10 h-10 bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 ${btn.hover} transition-all`}
          >
            {btn.icon}
          </motion.button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
           HERO SECTION — template-aware
         ═══════════════════════════════════════════════ */}
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
        <BlogHero blog={blog} author={author} readingTime={readingTime} viewCount={viewCount} formatDate={formatDate} />
      )}

      {/* ═══════════════════════════════════════════════
           TOP AD SLOT — below hero, above article body
         ═══════════════════════════════════════════════ */}
      {showAds && adPlacements.top && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mb-1 uppercase tracking-widest select-none">Advertisement</p>
          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/50">
            <AdRenderer position="blog_top" settings={settings} className="w-full" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           ARTICLE BODY — unified renderer per template
         ═══════════════════════════════════════════════ */}
      {blog.template === "magazine" ? (
        <MagazineContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="magazine"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </MagazineContent>
      ) : blog.template === "minimal" ? (
        <MinimalContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="minimal"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </MinimalContent>
      ) : blog.template === "cinematic" ? (
        <CinematicContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="cinematic"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </CinematicContent>
      ) : blog.template === "newsletter" ? (
        <NewsletterContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="newsletter"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </NewsletterContent>
      ) : blog.template === "bold" ? (
        <BoldContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="bold"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </BoldContent>
      ) : blog.template === "video" ? (
        <VideoContent>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="video"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </VideoContent>
      ) : (
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <BlogContentRenderer
              html={cleanContentForDisplay(blog.content)}
              settings={settings}
              blog={blog}
              template="default"
              adsEnabled={showAds && adPlacements.inContent}
            />
          </motion.div>
        </article>
      )}

      {/* ═══════════════════════════════════════════════
           BELOW-CONTENT SECTIONS (shared by all templates)
         ═══════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">

        {/* ── Engagement bar ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-between gap-4 py-5 px-4 sm:px-6 mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700"
        >
          {/* Like + views */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                isLiked
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-red-300 hover:text-red-500 active:bg-red-50 dark:active:bg-red-500/10"
              }`}
            >
              {likeLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiHeart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              )}
              <span>{likeCount}</span>
            </motion.button>
            <span className="flex items-center gap-1.5 text-gray-400 text-sm">
              <FiEye className="w-4 h-4" />
              {viewCount.toLocaleString()}
            </span>
          </div>

          {/* Share buttons — all devices */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { fn: () => handleShare('twitter'),  icon: <FiTwitter className="w-4 h-4" />,  label: 'Twitter' },
              { fn: () => handleShare('facebook'), icon: <FiFacebook className="w-4 h-4" />, label: 'Facebook' },
              { fn: () => handleShare('linkedin'), icon: <FiLinkedin className="w-4 h-4" />, label: 'LinkedIn' },
              { fn: () => handleShare('copy'),     icon: copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />, label: 'Copy' },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.fn}
                title={btn.label}
                className="w-10 h-10 sm:w-9 sm:h-9 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/5 border border-gray-200 dark:border-gray-600 transition min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                {btn.icon}
              </button>
            ))}
            {/* Native share on mobile */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() => handleShare('native')}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white sm:hidden min-h-[44px] min-w-[44px]"
              >
                <FiShare2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Tags ────────────────────────────────────── */}
        {blog.keywords && (
          <div className="mt-8">
            <div className="flex flex-wrap gap-2">
              {blog.keywords.split(",").map((keyword) => (
                <span
                  key={keyword}
                  className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium transition cursor-pointer min-h-[36px] flex items-center"
                >
                  #{keyword.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom Ad ──────────────────────────────── */}
        {showAds && adPlacements.bottom && (
          <div className="mt-10">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mb-1 uppercase tracking-widest select-none">Advertisement</p>
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/50">
              <AdRenderer position="blog_bottom" settings={settings} className="w-full" />
            </div>
          </div>
        )}

        {/* ── Author card ────────────────────────────── */}
        {author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 sm:mt-12"
          >
            <div className="p-5 sm:p-6 bg-gradient-to-br from-primary/5 via-purple-50/60 to-pink-50/60 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800/60 rounded-2xl border border-primary/10 dark:border-gray-700">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Link href={`/user/${blog.authorId}`} className="shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-md hover:scale-105 transition-transform">
                    {author.photoURL ? (
                      <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      author.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-0.5">Written by</p>
                  <Link href={`/user/${blog.authorId}`} className="hover:text-primary transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{author.name}</h3>
                  </Link>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mt-1 line-clamp-2">
                    {author.bio || "Passionate content creator sharing insights and stories."}
                  </p>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Link
                      href={`/user/${blog.authorId}`}
                      className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 min-h-[36px]"
                    >
                      <FiUser className="w-3.5 h-3.5" />
                      Profile
                    </Link>
                    {user && user.uid !== blog.authorId && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`px-3.5 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 min-h-[36px] ${
                          isFollowingAuthor
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-primary text-white shadow-md shadow-primary/25"
                        }`}
                      >
                        {followLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isFollowingAuthor ? (
                          <><FiUserCheck className="w-3.5 h-3.5" /> Following</>
                        ) : (
                          <><FiUserPlus className="w-3.5 h-3.5" /> Follow</>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Related articles ───────────────────────── */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12 sm:mt-14">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2.5">
              <span className="w-8 h-0.5 bg-primary rounded-full" />
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedBlogs.map((related) => (
                <Link
                  key={related.id}
                  href={related.slug ? `/blog/${related.slug}` : `/blog?id=${related.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {related.thumbnail ? (
                      <img
                        src={related.thumbnail}
                        alt={related.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-100 dark:from-primary/20 dark:to-purple-900/30">
                        <FiBookmark className="w-6 h-6 text-primary/40" />
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="p-4">
                    {related.category && (
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                        {related.category}
                      </span>
                    )}
                    <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-2 leading-snug group-hover:text-primary transition">
                      {related.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {calculateReadingTime(related.content)} min
                      </span>
                      <span className="flex items-center gap-1">
                        <FiEye className="w-3 h-3" />
                        {(related.views || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Comments ───────────────────────────────── */}
        <div className="mt-12 sm:mt-14">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2.5">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Comments
          </h2>
          <CommentSection targetId={blog.id} targetType="blog" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
           SCROLL TO TOP — mobile-friendly
         ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 w-11 h-11 sm:w-12 sm:h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition z-40 min-h-[44px] min-w-[44px]"
          >
            <FiChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
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
