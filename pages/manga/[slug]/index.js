import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Layout from "../../../components/Layout";
import { getMangaBySlug, getSettings, incrementMangaViews, incrementMangaFavorites, decrementMangaFavorites, addToFavorites, removeFromFavorites, isItemFavorited } from "../../../lib/api-client";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import { generateChapterList, generateChapterUrl } from "../../../utils/mangaRedirectGenerator";
import { MangaSchema, BreadcrumbSchema } from "../../../components/SEOHead";
import AdRenderer from "../../../components/AdRenderer";
import CommentSection from "../../../components/CommentSection";
import { trackMangaView, trackEngagement } from "../../../lib/analytics";
import { motion } from "framer-motion";
import { FiArrowLeft, FiBook, FiExternalLink, FiStar, FiClock, FiUser, FiBookOpen, FiHeart, FiShare2, FiArrowUp, FiArrowDown } from "react-icons/fi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

// Helper to serialize timestamps for SSR
const _serializeData = (obj) => {
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

// Helper to extract alternative names from manga data
const getAltNames = (data) => {
  if (data?.alternativeNames) return data.alternativeNames;
  // Fallback: try to extract from description (common patterns like "Also known as: ...")
  if (data?.description) {
    const match = data.description.match(/(?:also known as|alternative names?|other names?)[:\s]+([^.\n]+)/i);
    if (match) return match[1].trim();
  }
  return "";
};

// Helper to apply SEO template
const applyTemplate = (template, data) => {
  if (!template) return null;
  const altNames = getAltNames(data);
  let result = template
    .replace(/{title}/g, data?.title || "")
    .replace(/{altNames}/g, altNames)
    .replace(/{chapters}/g, data?.totalChapters || "")
    .replace(/{status}/g, data?.status || "Ongoing")
    .replace(/{author}/g, data?.author || "")
    .replace(/{genre}/g, data?.genre || "");
  // Clean up empty alt names artifacts (e.g., "Also known as ." when no alt names)
  result = result.replace(/Also known as\s*\.\s*/gi, "").replace(/\s{2,}/g, " ").trim();
  return result;
};

export default function MangaDetail({ initialManga, initialSettings }) {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const { subscribe, joinRoom, leaveRoom, emitMangaView, emitMangaFavorite, isConnected } = useSocket();
  const [manga, setManga] = useState(initialManga);
  const [chapters, setChapters] = useState([]);
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(!initialManga);
  const [visibleChapters, setVisibleChapters] = useState(50);
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [liveViews, setLiveViews] = useState(null);
  const [liveFavorites, setLiveFavorites] = useState(null);

  // Format slug to readable title for SEO (from URL)
  const formattedSlugTitle = formatSlugToTitle(slug);
  
  // SEO values - static title (no chapter numbers) for stable indexing
  const seoTitle = manga?.seoTitle || (manga ? applyTemplate(settings?.mangaSeoDefaults?.titleTemplate, manga) : null) || `${manga?.title || formattedSlugTitle} Manga | Luvrix`;
  
  // Dynamic meta description with chapter count + alt names — ranks for "manga name chapter N" queries
  const generateMangaDescription = () => {
    if (manga?.seoDescription) return manga.seoDescription;
    const templateResult = manga ? applyTemplate(settings?.mangaSeoDefaults?.descriptionTemplate, manga) : null;
    if (templateResult) return templateResult;
    const name = manga?.title || formattedSlugTitle;
    const total = manga?.totalChapters;
    const altNames = getAltNames(manga);
    const genre = manga?.genre;
    const status = manga?.status || "Ongoing";
    let desc = `Read ${name} manga online.`;
    if (altNames) desc += ` Also known as ${altNames}.`;
    if (total) desc += ` Chapters 1 to ${total} available.`;
    if (genre) desc += ` ${genre} manga, ${status}.`;
    desc += " Updated regularly on Luvrix.";
    return desc;
  };
  const seoDescription = generateMangaDescription();
  const seoKeywords = manga?.focusKeyword || (manga ? applyTemplate(settings?.mangaSeoDefaults?.focusKeywordTemplate, manga) : null) || `${formattedSlugTitle}, manga, read online`;

  // Ensure absolute image URL for SEO
  const getAbsoluteImageUrl = (url) => {
    if (!url) return "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";
    if (url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
  };
  const ogImage = manga?.coverUrl ? getAbsoluteImageUrl(manga.coverUrl) : "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";

  // Join manga room for real-time updates
  useEffect(() => {
    if (manga?.id && isConnected) {
      joinRoom(`manga:${manga.id}`);
      return () => leaveRoom(`manga:${manga.id}`);
    }
  }, [manga?.id, isConnected, joinRoom, leaveRoom]);

  // Subscribe to real-time manga updates
  useEffect(() => {
    if (!isConnected || !manga?.id) return;

    const unsubViews = subscribe("manga:viewUpdate", (data) => {
      if (data.mangaId === manga.id) {
        setLiveViews(data.views);
      }
    });

    const unsubFavorites = subscribe("manga:favoriteUpdate", (data) => {
      if (data.mangaId === manga.id) {
        setLiveFavorites(data.favorites);
      }
    });

    return () => {
      unsubViews();
      unsubFavorites();
    };
  }, [isConnected, manga?.id, subscribe]);

  useEffect(() => {
    if (manga) {
      const chapterList = generateChapterList(manga);
      setChapters(chapterList);
      
      // Increment views and emit to socket
      incrementMangaViews(manga.slug || manga.id).then((result) => {
        if (result?.views) {
          setLiveViews(result.views);
          emitMangaView(manga.id, result.views);
        }
      });
      
      // Track in Google Analytics
      trackMangaView(manga.id, manga.title, manga.totalChapters);
    }
  }, [manga, emitMangaView]);

  // Check if manga is favorited
  useEffect(() => {
    async function checkFavorite() {
      if (user && manga) {
        const result = await isItemFavorited(manga.id, user.uid);
        const favorited = result?.favorited || false;
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
      router.push("/login?redirect=" + encodeURIComponent(router.asPath));
      return;
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(`${user.uid}_${manga.id}`);
        const result = await decrementMangaFavorites(manga.slug || manga.id);
        setIsFavorited(false);
        // Emit socket event for real-time update
        const newFavorites = result?.favorites ?? (liveFavorites || manga.favorites || 0) - 1;
        setLiveFavorites(newFavorites);
        emitMangaFavorite(manga.id, newFavorites, user.uid, "unfavorite");
        trackEngagement("favorite", manga.id, manga.title);
      } else {
        await addToFavorites(user.uid, manga.id, "manga");
        const result = await incrementMangaFavorites(manga.slug || manga.id);
        setIsFavorited(true);
        // Emit socket event for real-time update
        const newFavorites = result?.favorites ?? (liveFavorites || manga.favorites || 0) + 1;
        setLiveFavorites(newFavorites);
        emitMangaFavorite(manga.id, newFavorites, user.uid, "favorite");
        trackEngagement("favorite", manga.id, manga.title);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
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
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Loading state with SEO from URL
  if (loading) {
    return (
      <Layout title={seoTitle} description={seoDescription} canonical={`${SITE_URL}/manga/${slug}/`}>
        <Head>
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

  const pageUrl = `/manga/${slug}/`;
  const fullUrl = `${SITE_URL}/manga/${slug}/`;

  return (
    <Layout
      title={seoTitle}
      description={seoDescription}
      keywords={seoKeywords}
      image={ogImage}
      canonical={fullUrl}
    >
      <Head>
        {/* Only extras not handled by Layout */}
        <meta property="og:type" content="book" />
        <meta property="og:image:alt" content={`${manga.title} Cover`} />
        <meta property="book:author" content={manga.author || "Unknown"} />
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
                <div className="mb-8 max-w-2xl">
                  <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-2">Synopsis</h3>
                  <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-white/70 text-base leading-relaxed whitespace-pre-line">
                      {manga.description || "No description available."}
                    </p>
                  </div>
                </div>

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
                    <p className="text-2xl font-bold">{formatNumber(liveViews ?? manga.views ?? 0)}</p>
                    <p className="text-white/50 text-sm">Views</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <FiHeart className="w-6 h-6 text-red-400 mb-2" />
                    <p className="text-2xl font-bold">{formatNumber(liveFavorites ?? manga.favorites ?? 0)}</p>
                    <p className="text-white/50 text-sm">Favorites</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <FiClock className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold">{manga.status === "Completed" ? "Done" : "Weekly"}</p>
                    <p className="text-white/50 text-sm">Updates</p>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <a
                      href={chapters[0]?.url || generateChapterUrl(manga, 1) || "#"}
                      target="_blank"
                      rel="nofollow noopener"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                    >
                      <FiBookOpen className="w-5 h-5" /> Start Reading
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className={`px-6 py-4 backdrop-blur-sm rounded-xl font-semibold border transition-all flex items-center gap-2 ${
                      isFavorited 
                        ? "bg-red-500/30 text-red-200 border-red-500/30 hover:bg-red-500/40" 
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {favoriteLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiHeart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                    )}
                    {isFavorited ? "Favorited" : "Add to Favorites"}
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

        {/* Chapter Availability — visible crawlable text for SEO (ranks for "manga name chapter N" queries) */}
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6">
            <p className="text-gray-700 text-base leading-relaxed">
              <strong>{manga.title}</strong>{manga.alternativeNames ? <> (also known as <strong>{manga.alternativeNames}</strong>)</> : null} manga currently has <strong>{manga.totalChapters} chapters</strong> available.
              Readers can access chapters from <strong>Chapter 1</strong> to <strong>Chapter {manga.totalChapters}</strong>.
              Latest chapter: <strong>Chapter {manga.totalChapters}</strong>.
              {manga.genre ? <> Genre: <strong>{manga.genre}</strong>.</> : null}
              {manga.status ? <> Status: <strong>{manga.status}</strong>.</> : null}
            </p>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="max-w-7xl mx-auto px-4 py-8">

        <AdRenderer position="content_middle" settings={settings} className="mb-8" />

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
              <a
                key={chapter.number}
                href={chapter.url || "#"}
                target="_blank"
                rel="nofollow noopener"
                className="p-4 bg-white border rounded-lg hover:border-primary hover:shadow-md transition text-center group"
              >
                <span className="text-gray-800 font-medium group-hover:text-primary flex items-center justify-center gap-1">
                  Chapter {chapter.number}
                  <FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </a>
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

        <AdRenderer position="content_bottom" settings={settings} className="mt-8" />

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
    const { getMangaBySlug, getSettings } = await import("../../../lib/db");
    
    const [mangaData, settingsData] = await Promise.all([
      getMangaBySlug(slug),
      getSettings()
    ]);
    
    if (!mangaData) {
      return { notFound: true };
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
    return { notFound: true };
  }
}
