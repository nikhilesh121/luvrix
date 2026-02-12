import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import { getSettings } from "../lib/api-client";
import { useBlogCache } from "../context/BlogCacheContext";
import { useSocket } from "../context/SocketContext";
import { BlogGridSkeleton } from "../components/ui/Skeleton";
import { WebsiteSchema } from "../components/SEOHead";
import AdRenderer from "../components/AdRenderer";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic imports for better code splitting
const BlogCard = dynamic(() => import("../components/BlogCard"), {
  loading: () => <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />,
  ssr: true,
});
const GiveawayCard = dynamic(() => import("../components/GiveawayCard"), {
  loading: () => <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />,
  ssr: true,
});
import { 
  FiArrowRight, FiEdit3, FiSearch, FiTag, FiClock, 
  FiTrendingUp, FiZap, FiAward, FiBookOpen, FiStar,
  FiChevronRight, FiPlay, FiHeart, FiCpu, FiFilm,
  FiMusic, FiGrid, FiCoffee, FiMapPin, FiGift
} from "react-icons/fi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

// Compact number formatter: 999 → 999, 1000 → 1K+, 10500 → 10K+, 1000000 → 1M+
function formatNumber(num) {
  if (!num || num < 0) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1000000) return `${Math.floor(num / 1000)}K+`;
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
}

const categoryConfig = {
  "Technology": { icon: FiCpu, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10" },
  "Anime": { icon: FiStar, color: "from-pink-500 to-rose-500", bg: "bg-pink-500/10" },
  "Entertainment": { icon: FiFilm, color: "from-purple-500 to-violet-500", bg: "bg-purple-500/10" },
  "Gaming": { icon: FiGrid, color: "from-indigo-500 to-blue-500", bg: "bg-indigo-500/10" },
  "Science": { icon: FiZap, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
  "Lifestyle": { icon: FiHeart, color: "from-rose-500 to-pink-500", bg: "bg-rose-500/10" },
  "Sports": { icon: FiAward, color: "from-green-500 to-emerald-500", bg: "bg-green-500/10" },
  "Business": { icon: FiTrendingUp, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
  "Health": { icon: FiHeart, color: "from-red-500 to-rose-500", bg: "bg-red-500/10" },
  "Travel": { icon: FiMapPin, color: "from-teal-500 to-cyan-500", bg: "bg-teal-500/10" },
  "Food": { icon: FiCoffee, color: "from-orange-500 to-amber-500", bg: "bg-orange-500/10" },
  "Music": { icon: FiMusic, color: "from-violet-500 to-purple-500", bg: "bg-violet-500/10" },
};

export default function Home() {
  const { blogs: _cachedBlogs, loading: blogsLoading, getLatestBlogs, getFeaturedBlog, refreshBlogs } = useBlogCache();
  const { subscribe, isConnected } = useSocket();
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [liveUpdates, setLiveUpdates] = useState({}); // Store live view/like counts
  const [platformStats, setPlatformStats] = useState({ readers: 0, writers: 0, articles: 0 });

  // Memoize blog data to prevent unnecessary re-renders
  const featuredBlog = useMemo(() => getFeaturedBlog(), [getFeaturedBlog]);
  const latestBlogs = useMemo(() => getLatestBlogs(9), [getLatestBlogs]);

  // Fetch real platform stats
  useEffect(() => {
    fetch("/api/stats/platform")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPlatformStats(data); })
      .catch(() => {});
  }, []);

  // Subscribe to real-time blog updates
  useEffect(() => {
    if (!isConnected) return;

    // Listen for view updates on any blog
    const unsubViews = subscribe("blog:viewUpdate", (data) => {
      setLiveUpdates(prev => ({
        ...prev,
        [data.blogId]: { ...prev[data.blogId], views: data.views }
      }));
    });

    // Listen for like updates on any blog
    const unsubLikes = subscribe("blog:likeUpdate", (data) => {
      setLiveUpdates(prev => ({
        ...prev,
        [data.blogId]: { ...prev[data.blogId], likes: data.likes }
      }));
    });

    // Listen for new blog notifications
    const unsubNewBlog = subscribe("notification:new", (data) => {
      if (data.type === "new_blog") {
        // Refresh blogs when new one is published
        refreshBlogs?.();
      }
    });

    return () => {
      unsubViews();
      unsubLikes();
      unsubNewBlog();
    };
  }, [isConnected, subscribe, refreshBlogs]);

  // Helper to get live count or fallback to original
  const _getLiveCount = useCallback((blogId, field, originalValue) => {
    return liveUpdates[blogId]?.[field] ?? originalValue;
  }, [liveUpdates]);

  // Lazy load settings - non-blocking
  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % Object.keys(categoryConfig).length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const categories = Object.keys(categoryConfig);

  // Optimized animation variants - reduced complexity for faster rendering
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 } // Reduced stagger time
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced y offset
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0], // Reduced animation range
      transition: {
        duration: 4, // Faster animation
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <Layout title="Read Blogs, Manga & Stories" description="Discover amazing blogs, manga, and stories from creators worldwide. Write, share, and explore content on the #1 free platform for writers and readers." canonical={`${SITE_URL}/`}>
      <Head>
        {/* Homepage-specific keywords */}
        <meta name="keywords" content="blogs, manga, stories, read online, free platform, writers, readers, luvrix" />
      </Head>
      
      {/* Website Schema for Sitelinks */}
      <WebsiteSchema />
      
      {/* Hero Section - Ultra Modern Design */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Dynamic Animated Background */}
        <div className="absolute inset-0 bg-[#0a0a0f]">
          {/* Gradient Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
          
          {/* Floating Elements */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-32 right-20 w-24 h-24 border border-white/10 rounded-2xl backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-40 left-20 w-16 h-16 border border-white/10 rounded-full backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-1/2 right-32 w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg backdrop-blur-sm hidden lg:block"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Badge */}
              <motion.div variants={itemVariants} className="mb-8">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm text-white rounded-full text-sm border border-white/10">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Trending Now</span>
                  <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">NEW</span>
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1 
                variants={itemVariants}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1]"
              >
                Share Your
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                    Stories
                  </span>
                  <motion.svg 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="absolute -bottom-2 left-0 w-full" 
                    viewBox="0 0 200 12" 
                    fill="none"
                  >
                    <motion.path 
                      d="M2 10C50 2 150 2 198 10" 
                      stroke="url(#heroGradient)" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="200" y2="0">
                        <stop stopColor="#a855f7"/>
                        <stop offset="0.5" stopColor="#ec4899"/>
                        <stop offset="1" stopColor="#f97316"/>
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </span>
                <br />
                With The World
              </motion.h1>

              <motion.p 
                variants={itemVariants}
                className="text-xl text-gray-400 mb-8 leading-relaxed max-w-xl"
              >
                Join our community of creators. Write, share, and inspire millions. 
                Your first post is <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">completely free</span>.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-12">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 flex items-center gap-2"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Writing Free
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/categories"
                    className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                  >
                    <FiPlay className="w-5 h-5" />
                    Explore
                  </Link>
                </motion.div>
              </motion.div>

              {/* Stats */}
              <motion.div variants={itemVariants} className="flex items-center gap-6 sm:gap-8">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(platformStats.readers)}</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Active Readers</p>
                </div>
                <div className="w-px h-10 sm:h-12 bg-white/10" />
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(platformStats.writers)}</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Writers</p>
                </div>
                <div className="w-px h-10 sm:h-12 bg-white/10" />
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{formatNumber(platformStats.articles)}</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Articles</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Animated Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              {/* Main Search Card */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <FiSearch className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Discover Content</p>
                      <p className="text-gray-500 text-sm">Search any topic</p>
                    </div>
                  </div>
                  
                  <div className="relative mb-6">
                    <input
                      type="text"
                      placeholder="What interests you?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                    <Link
                      href={`/categories?search=${searchQuery}`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Search
                    </Link>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 6).map((cat, index) => {
                      const config = categoryConfig[cat] || { icon: FiTag, bg: "bg-gray-500/10", color: "from-gray-500 to-gray-600" };
                      const Icon = config.icon || FiTag;
                      return (
                        <motion.div
                          key={cat}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <Link
                            href={`/categories?category=${cat}`}
                            className={`px-4 py-2 ${config.bg || "bg-gray-500/10"} backdrop-blur-sm rounded-full text-sm font-medium text-white/80 hover:text-white transition-all flex items-center gap-2 border border-white/5 hover:border-white/20`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cat}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Floating Category Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-8 -right-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    {(() => {
                      const cat = categories[activeCategory];
                      const config = categoryConfig[cat] || { icon: FiTag, color: "from-gray-500 to-gray-600" };
                      const Icon = config.icon || FiTag;
                      return (
                        <>
                          <div className={`w-10 h-10 bg-gradient-to-r ${config.color || "from-gray-500 to-gray-600"} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{cat}</p>
                            <p className="text-gray-500 text-xs">Trending</p>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-4 -left-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-r ${["from-purple-500 to-pink-500", "from-blue-500 to-cyan-500", "from-orange-500 to-amber-500", "from-green-500 to-emerald-500"][i]} border-2 border-[#0a0a0f]`} />
                  ))}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{formatNumber(platformStats.writers)} Writers</p>
                  <p className="text-gray-500 text-xs">Active creators</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-white/40 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Featured Blog */}
      {featuredBlog && (
        <section className="py-20 bg-gradient-to-b from-[#0a0a0f] to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FiStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Featured Article</h2>
                <p className="text-gray-500">Editor's pick for you</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                  <div className="flex flex-col justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-sm text-purple-300 w-fit mb-6">
                      <FiTrendingUp className="w-4 h-4" />
                      {featuredBlog.category || "Featured"}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                      {featuredBlog.title}
                    </h3>
                    <p className="text-gray-400 mb-8 line-clamp-3">
                      {featuredBlog.seoDescription || featuredBlog.content?.substring(0, 200)}
                    </p>
                    <div className="flex items-center gap-4">
                      <Link
                        href={featuredBlog.slug ? `/blog/${featuredBlog.slug}` : `/blog?id=${featuredBlog.id}`}
                        className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                      >
                        Read Article 
                        <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                      <div className="flex items-center gap-2 text-gray-500">
                        <FiClock className="w-4 h-4" />
                        <span className="text-sm">5 min read</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    {featuredBlog.thumbnail ? (
                      <motion.div 
                        className="relative aspect-[4/3] rounded-2xl overflow-hidden group/img"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img 
                          src={featuredBlog.thumbnail} 
                          alt={featuredBlog.title}
                          width={800}
                          height={600}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        <motion.div 
                          className="absolute inset-0 border-2 border-white/20 rounded-2xl"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <div className="text-center">
                          <FiBookOpen className="w-16 h-16 text-white/30 mx-auto mb-3" />
                          <p className="text-white/40 text-sm">Featured Story</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10"
          >
            <div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3 uppercase tracking-wider"
              >
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Fresh Reads
              </motion.span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Latest Articles</h2>
            </div>
            <Link
              href="/categories"
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-full font-medium transition-all shadow-sm"
            >
              View All
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {blogsLoading ? (
            <BlogGridSkeleton count={9} />
          ) : latestBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Featured first article */}
              {latestBlogs.length > 0 && (
                <BlogCard blog={latestBlogs[0]} index={0} variant="featured" />
              )}
              {/* Remaining articles with between_posts ads */}
              {latestBlogs.slice(1).map((blog, index) => (
                <React.Fragment key={blog.id}>
                  <BlogCard blog={blog} index={index + 1} />
                  {(index + 1) % 4 === 0 && (
                    <div className="col-span-full">
                      <AdRenderer position="between_posts" settings={settings} className="my-2" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-20 bg-white rounded-3xl border border-gray-100"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FiEdit3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No articles yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Be the first to share your story with our community</p>
              <Link href="/create-blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition">
                <FiEdit3 className="w-4 h-4" /> Write Article
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Categories Section - Enhanced */}
      <section className="py-20 bg-gradient-to-b from-[#0a0a0f] via-slate-900 to-[#0a0a0f] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ scale: [1.3, 1, 1.3], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6"
            >
              <FiGrid className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Browse Topics</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Explore{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Categories
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Discover content across different topics and find what interests you most
            </p>
          </motion.div>
          
          {/* Categories Grid - Mobile Friendly Multi-Column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.map((cat, index) => {
              const config = categoryConfig[cat];
              const Icon = config?.icon || FiTag;
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    href={`/categories?category=${cat}`}
                    className="group relative block overflow-hidden"
                  >
                    {/* Glow Effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${config?.color || "from-gray-500 to-gray-600"} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                    
                    {/* Card */}
                    <div className="relative p-4 md:p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-300">
                      {/* Icon Container */}
                      <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${config?.color || "from-gray-500 to-gray-600"} rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      
                      {/* Text */}
                      <h3 className="font-bold text-white text-sm md:text-base mb-1 truncate">{cat}</h3>
                      <p className="text-slate-500 text-xs md:text-sm flex items-center gap-1">
                        Explore 
                        <FiChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                      </p>
                      
                      {/* Hover Arrow */}
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiArrowRight className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link
              href="/categories"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              View All Categories
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ GIVEAWAYS SECTION ═══════════════ */}
      <GiveawaysSection />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0f]">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[150px]"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-[150px]"
          />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <FiEdit3 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Share Your Story?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join thousands of writers and start sharing your knowledge with the world. Your first post is completely free!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg inline-flex items-center gap-2"
                >
                  Get Started Free
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/categories"
                  className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-white/10 hover:bg-white/10 transition-all inline-flex items-center gap-2"
                >
                  <FiBookOpen className="w-5 h-5" />
                  Browse Articles
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

// ── Giveaways Section (homepage) ──
function GiveawaysSection() {
  const [giveaways, setGiveaways] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/giveaways")
      .then(r => r.json())
      .then(data => {
        const active = (Array.isArray(data) ? data : []).filter(g => g.status === "active");
        setGiveaways(active.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const staggerGrid = { visible: { transition: { staggerChildren: 0.12 } } };
  const fadeUpItem = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

  // Don't render section at all if no active giveaways
  if (loaded && giveaways.length === 0) return null;

  return (
    <section className="relative py-24 bg-[#0a0a14] overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 left-[10%] w-72 h-72 rounded-full bg-purple-600/8 blur-[100px]"
        animate={{ y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-[5%] w-60 h-60 rounded-full bg-pink-600/8 blur-[80px]"
        animate={{ y: [0, 25, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 px-5 py-2 rounded-full text-sm font-bold mb-5 border border-purple-500/20 shadow-lg shadow-purple-500/5"
          >
            <FiGift className="w-4 h-4" /> Giveaways
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Win <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Amazing Prizes</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto text-lg">Join for free, complete tasks, and win physical prizes. No purchase required.</p>
        </motion.div>

        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="bg-[#0e0e18] rounded-2xl h-80 animate-pulse border border-white/5" />)}
          </div>
        ) : (
          <motion.div variants={staggerGrid} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {giveaways.map(g => (
              <motion.div key={g.id} variants={fadeUpItem}>
                <GiveawayCard giveaway={g} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center mt-12">
          <Link href="/giveaway" className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5">
            View All Giveaways <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
