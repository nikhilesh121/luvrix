import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Layout from "../../../components/Layout";
import { getMangaBySlug, getSettings, incrementMangaViews, incrementMangaFavorites, decrementMangaFavorites, addToFavorites, removeFromFavorites, isItemFavorited } from "../../../lib/api-client";
import { useAuth } from "../../../context/AuthContext";
import { generateChapterList } from "../../../utils/mangaRedirectGenerator";
import { MangaSchema, BreadcrumbSchema } from "../../../components/SEOHead";
import CommentSection from "../../../components/CommentSection";
import { motion } from "framer-motion";
import { FiArrowLeft, FiBook, FiExternalLink, FiStar, FiClock, FiUser, FiBookOpen, FiHeart, FiShare2, FiChevronRight, FiArrowUp, FiArrowDown } from "react-icons/fi";

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

// Helper to format slug to title (e.g., "astral-pet-store" -> "Astral Pet Store")
const formatSlugToTitle = (slug) => {
  if (!slug) return "";
  return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

// Helper to apply SEO template
const applyTemplate = (template, data) => {
  if (!template) return null;
  return template
    .replace(/{title}/g, data?.title || '')
    .replace(/{chapters}/g, data?.totalChapters || '')
    .replace(/{status}/g, data?.status || 'Ongoing')
    .replace(/{author}/g, data?.author || '')
    .replace(/{genre}/g, data?.genre || '');
};

export default function MangaDetail({ initialManga, initialSettings }) {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [manga, setManga] = useState(initialManga);
  const [chapters, setChapters] = useState([]);
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(!initialManga);
  const [visibleChapters, setVisibleChapters] = useState(50);
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Format slug to readable title for SEO (from URL)
  const formattedSlugTitle = formatSlugToTitle(slug);
  
  // SEO values - use manga data if loaded, otherwise use formatted slug
  const seoTitle = manga?.seoTitle || (manga ? applyTemplate(settings?.mangaSeoDefaults?.titleTemplate, manga) : null) || (manga?.title ? `Read ${manga.title} Online - All Chapters` : `Read ${formattedSlugTitle} Online - All Chapters`);
  
  // Generate SEO description from manga description field if not explicitly set
  const generateMangaDescription = () => {
    if (manga?.seoDescription) return manga.seoDescription;
    if (manga ? applyTemplate(settings?.mangaSeoDefaults?.descriptionTemplate, manga) : null) {
      return applyTemplate(settings?.mangaSeoDefaults?.descriptionTemplate, manga);
    }
    if (manga?.description) {
      const plainText = manga.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      return plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");
    }
    return `Read ${manga?.title || formattedSlugTitle} manga online for free. All chapters available with high-quality images.`;
  };
  const seoDescription = generateMangaDescription();
  const seoKeywords = manga?.focusKeyword || (manga ? applyTemplate(settings?.mangaSeoDefaults?.focusKeywordTemplate, manga) : null) || `${formattedSlugTitle}, manga, read online`;

  // Ensure absolute image URL for SEO
  const getAbsoluteImageUrl = (url) => {
    if (!url) return `${SITE_URL}/og-default.svg`;
    if (url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
  };
  const ogImage = manga?.coverUrl ? getAbsoluteImageUrl(manga.coverUrl) : `${SITE_URL}/og-default.svg`;

  useEffect(() => {
    if (manga) {
      const chapterList = generateChapterList(manga);
      setChapters(chapterList);
      incrementMangaViews(manga.id);
    }
  }, [manga]);

  // Check if manga is favorited
  useEffect(() => {
    async function checkFavorite() {
      if (user && manga) {
        const favorited = await isItemFavorited(user.uid, manga.id);
        setIsFavorited(favorited);
      }
    }
    checkFavorite();
  }, [user, manga]);

  useEffect(() => {
    async function fetchManga() {
      // Skip fetch if we already have SSR data
      if (initialManga) {
        return;
      }

      if (!slug) return;

      setLoading(true);
      try {
        const [mangaData, settingsData] = await Promise.all([
          getMangaBySlug(slug),
          getSettings()
        ]);
        
        if (mangaData) {
          setManga(mangaData);
          setSettings(settingsData);
        }
      } catch (error) {
        console.error("Error fetching manga:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchManga();
  }, [slug, initialManga]);

  const loadMore = () => {
    setVisibleChapters((prev) => prev + 50);
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(user.uid, manga.id);
        await decrementMangaFavorites(manga.id);
        setIsFavorited(false);
      } else {
        await addToFavorites(user.uid, manga.id, 'manga');
        await incrementMangaFavorites(manga.id);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: manga.title,
      text: `Read ${manga.title} manga online`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Loading state with SEO from URL
  if (loading) {
    return (
      <Layout title={seoTitle} description={seoDescription}>
        <Head>
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={`${SITE_URL}/manga/${slug}`} />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:type" content="book" />
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {formattedSlugTitle}...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!manga) {
    return (
      <Layout title="Manga Not Found">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Manga Not Found</h1>
            <Link href="/manga" className="text-primary hover:underline">
              Browse Manga
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const pageUrl = `/manga/${slug}`;
  const fullUrl = `${SITE_URL}${pageUrl}`;

  return (
    <Layout
      title={seoTitle}
      description={seoDescription}
      keywords={seoKeywords}
    >
      <Head>
        {/* Primary SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={fullUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="book" />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={`${manga.title} Cover`} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="1200" />
        <meta property="og:site_name" content="Luvrix" />
        <meta property="book:author" content={manga.author || "Unknown"} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Focus Keyword */}
        {manga.focusKeyword && <meta name="news_keywords" content={manga.focusKeyword} />}
      </Head>
      
      {/* Structured Data */}
      <MangaSchema manga={manga} url={pageUrl} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Manga", url: "/manga" },
        { name: manga.title, url: pageUrl },
      ]} />
      
      <div className="min-h-screen">
        {/* Hero Section with Parallax Effect */}
        <div className="relative overflow-hidden">
          {/* Background Image with Blur */}
          <div className="absolute inset-0 z-0">
            {manga.coverUrl && (
              <img
                src={manga.coverUrl}
                alt=""
                className="w-full h-full object-cover scale-110 blur-xl opacity-30"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/90 to-gray-900" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link
                href="/manga"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                <span>Back to Manga</span>
              </Link>
            </motion.div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Cover Image */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotateY: -15 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full lg:w-80 flex-shrink-0"
              >
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
                  <div className="relative aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-blog.svg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                        <FiBook className="w-20 h-20 text-white/30" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex-1 text-white"
              >
                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  {manga.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {manga.author && (
                    <div className="flex items-center gap-2 text-white/70">
                      <FiUser className="w-4 h-4" />
                      <span>{manga.author}</span>
                    </div>
                  )}
                  {manga.genre && (
                    <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm border border-purple-500/30">
                      {manga.genre}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    manga.status === "Completed" 
                      ? "bg-green-500/30 text-green-200 border border-green-500/30" 
                      : "bg-yellow-500/30 text-yellow-200 border border-yellow-500/30"
                  }`}>
                    {manga.status || "Ongoing"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl">
                  {manga.description || "No description available."}
                </p>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <FiBookOpen className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-2xl font-bold">{manga.totalChapters}</p>
                    <p className="text-white/50 text-sm">Chapters</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <FiStar className="w-6 h-6 text-yellow-400 mb-2" />
                    <p className="text-2xl font-bold">{formatNumber(manga.views || 0)}</p>
                    <p className="text-white/50 text-sm">Views</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <FiHeart className="w-6 h-6 text-red-400 mb-2" />
                    <p className="text-2xl font-bold">{formatNumber(manga.favorites || 0)}</p>
                    <p className="text-white/50 text-sm">Favorites</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <FiClock className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold">{manga.status === 'Completed' ? 'Done' : 'Weekly'}</p>
                    <p className="text-white/50 text-sm">Updates</p>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href={`/manga/${slug}/chapter-1`}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                    >
                      <FiBookOpen className="w-5 h-5" /> Start Reading
                      <FiChevronRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className={`px-6 py-4 backdrop-blur-sm rounded-xl font-semibold border transition-all flex items-center gap-2 ${
                      isFavorited 
                        ? 'bg-red-500/30 text-red-200 border-red-500/30 hover:bg-red-500/40' 
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {favoriteLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiHeart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                    )}
                    {isFavorited ? 'Favorited' : 'Add to Favorites'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="px-6 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <FiShare2 className="w-5 h-5" /> Share
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="max-w-7xl mx-auto px-4 py-12">

        {settings?.adsEnabled && (
          <div className="mb-8 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-2">Advertisement</p>
            <div id="manga-top-ad" className="min-h-[100px]"></div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Chapters ({manga.totalChapters})
            </h2>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium"
              title={sortOrder === "desc" ? "Showing newest first (click for oldest first)" : "Showing oldest first (click for newest first)"}
            >
              {sortOrder === "desc" ? (
                <>
                  <FiArrowDown className="w-4 h-4" />
                  <span className="hidden sm:inline">{manga.totalChapters}-1</span>
                  <span className="sm:hidden">New→Old</span>
                </>
              ) : (
                <>
                  <FiArrowUp className="w-4 h-4" />
                  <span className="hidden sm:inline">1-{manga.totalChapters}</span>
                  <span className="sm:hidden">Old→New</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {(sortOrder === "desc" ? [...chapters].reverse() : chapters).slice(0, visibleChapters).map((chapter) => (
              <Link
                key={chapter.number}
                href={`/manga/${slug}/chapter-${chapter.number}`}
                className="p-4 bg-white border rounded-lg hover:border-primary hover:shadow-md transition text-center group"
              >
                <span className="text-gray-800 font-medium group-hover:text-primary">
                  Chapter {chapter.number}
                </span>
              </Link>
            ))}
          </div>

          {visibleChapters < chapters.length && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                className="px-8 py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Load More Chapters
              </button>
            </div>
          )}
        </motion.div>

        {settings?.adsEnabled && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-2">Advertisement</p>
            <div id="manga-bottom-ad" className="min-h-[100px]"></div>
          </div>
        )}

        {/* Comments Section */}
        {manga && <CommentSection targetId={manga.id} targetType="manga" />}
        </div>
      </div>
    </Layout>
  );
}

// Server-side data fetching for SEO
export async function getServerSideProps(context) {
  const { slug } = context.params;
  
  if (!slug) {
    return { props: { initialManga: null, initialSettings: null } };
  }

  try {
    const { getMangaBySlug, getSettings } = await import("../../../lib/api-client");
    
    const [mangaData, settingsData] = await Promise.all([
      getMangaBySlug(slug),
      getSettings()
    ]);
    
    if (!mangaData) {
      return { props: { initialManga: null, initialSettings: null } };
    }

    // Serialize timestamps for SSR
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

    return {
      props: {
        initialManga: serializeData(mangaData),
        initialSettings: serializeData(settingsData),
      },
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return { props: { initialManga: null, initialSettings: null } };
  }
}
