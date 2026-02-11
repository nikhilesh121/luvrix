import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import { CollectionPageSchema, BreadcrumbSchema } from "../../components/SEOHead";
import AdRenderer from "../../components/AdRenderer";
import { getAllManga, getSettings } from "../../lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiBook, FiSearch, FiEye, FiClock,
  FiChevronRight, FiTrendingUp, FiHeart, FiBookOpen
} from "react-icons/fi";

export default function MangaList() {
  const [manga, setManga] = useState([]);
  const [filteredManga, setFilteredManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [_hoveredCard, setHoveredCard] = useState(null);
  const [mangaDisabled, setMangaDisabled] = useState(false);
  const [layout, setLayout] = useState({ viewType: "grid", columns: 5, cardSize: "medium" });
  const [settings, setSettings] = useState(null);

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  useEffect(() => {
    async function fetchManga() {
      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);
        const mangaVisibility = fetchedSettings?.mangaVisibility || { web: true, mobileWeb: true };
        
        // Get layout settings
        if (fetchedSettings?.mangaLayout) {
          setLayout(fetchedSettings.mangaLayout);
        }
        
        // Check if web visibility is enabled (this covers both desktop and mobile web)
        const isWebVisible = mangaVisibility.web || mangaVisibility.mobileWeb;
        
        if (!isWebVisible) {
          setMangaDisabled(true);
          setManga([]);
          setFilteredManga([]);
          setLoading(false);
          return;
        }
        
        const mangaData = await getAllManga();
        setManga(mangaData);
        setFilteredManga(mangaData);
      } catch (error) {
        console.error("Error fetching manga:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchManga();
  }, []);

  useEffect(() => {
    let filtered = manga;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    }

    if (activeFilter === "popular") {
      filtered = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (activeFilter === "new") {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredManga(filtered);
  }, [searchQuery, manga, activeFilter]);

  const filters = [
    { id: "all", label: "All", icon: FiBookOpen },
    { id: "popular", label: "Popular", icon: FiTrendingUp },
    { id: "new", label: "New", icon: FiClock },
  ];

  if (mangaDisabled) {
    return (
      <Layout title="Manga Unavailable" description="Manga is currently not available">
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-4"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <FiBook className="w-12 h-12 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Manga Unavailable</h1>
            <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">
              Manga content is currently not available. Please check back later.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <FiChevronRight className="w-5 h-5 rotate-180" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manga" description="Browse and read the best manga series online for free on Luvrix. Discover popular manga across all genres with high-quality chapters updated regularly." canonical="https://luvrix.com/manga">
      <CollectionPageSchema
        title="Browse Manga"
        description="Browse and read the best manga series online for free on Luvrix."
        url="/manga"
        items={filteredManga.slice(0, 20).map(m => ({ title: m.title, url: `/manga/${m.slug || m.id}`, image: m.coverUrl }))}
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Manga", url: "/manga" },
      ]} />
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-[#0a0a0f] to-pink-900/30" />
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px]" 
            />
            <motion.div 
              animate={{ scale: [1.3, 1, 1.3], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/30 rounded-full blur-[128px]" 
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 12, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]" 
            />
          </div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 right-20 w-20 h-20 border border-white/10 rounded-2xl backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 left-20 w-14 h-14 border border-purple-500/20 rounded-full backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-1/2 right-32 w-16 h-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg hidden lg:block"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-purple-300 text-sm font-medium">Updated Daily</span>
                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 text-xs font-bold rounded-full">NEW</span>
              </motion.div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-black mb-6">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Manga
                </span>
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Library
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
                      stroke="url(#mangaGradient)" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    <defs>
                      <linearGradient id="mangaGradient" x1="0" y1="0" x2="200" y2="0">
                        <stop stopColor="#a855f7"/>
                        <stop offset="0.5" stopColor="#ec4899"/>
                        <stop offset="1" stopColor="#a855f7"/>
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </span>
              </h1>

              <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                Dive into our extensive collection of manga. From action-packed adventures to heartfelt romances.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 mb-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl font-bold text-white">{manga.length}</p>
                  <p className="text-gray-500 text-sm">Manga Series</p>
                </motion.div>
                <div className="w-px h-12 bg-white/10" />
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {manga.reduce((acc, m) => acc + (m.totalChapters || 0), 0)}+
                  </p>
                  <p className="text-gray-500 text-sm">Chapters</p>
                </motion.div>
              </div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-30 group-hover:opacity-50 blur transition-opacity" />
                  <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    <FiSearch className="w-6 h-6 text-gray-400 ml-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for manga titles..."
                      className="w-full bg-transparent px-4 py-5 text-white placeholder-gray-500 focus:outline-none text-lg"
                    />
                    <button className="px-6 py-3 m-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                      Search
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-10"
          >
            <div className="flex items-center gap-3">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    activeFilter === filter.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>
            <p className="text-gray-500">
              <span className="text-white font-semibold">{filteredManga.length}</span> manga found
            </p>
          </motion.div>

          <AdRenderer position="between_posts" settings={settings} className="mb-6" />

          {/* Manga Display */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filteredManga.length > 0 ? (
            <>
              {/* Grid View */}
              {layout.viewType === "grid" && (
                <div className={`grid gap-4 ${
                  layout.columns === 2 ? "grid-cols-1 sm:grid-cols-2" :
                  layout.columns === 3 ? "grid-cols-2 sm:grid-cols-3" :
                  layout.columns === 4 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" :
                  layout.columns === 6 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" :
                  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}>
                  <AnimatePresence>
                    {filteredManga.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.03 }}
                        onMouseEnter={() => setHoveredCard(item.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative"
                      >
                        <Link href={`/manga/${item.slug || item.id}`} className="block">
                          <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 ${
                            layout.cardSize === "small" ? "aspect-[4/5]" :
                            layout.cardSize === "large" ? "aspect-[2/3]" : "aspect-[3/4]"
                          }`}>
                            {item.coverUrl ? (
                              <img src={item.coverUrl} alt={item.title} loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => { e.target.onerror = null; e.target.src = "/default-blog.svg"; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiBook className="w-12 h-12 text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                                {item.totalChapters || 0} CH
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className={`text-white font-bold leading-tight line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors ${
                                layout.cardSize === "small" ? "text-sm" : "text-base"
                              }`}>{item.title}</h3>
                              <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <span className="flex items-center gap-1"><FiEye className="w-3 h-3" />{formatNumber(item.views)}</span>
                                <span className="flex items-center gap-1"><FiHeart className="w-3 h-3" />{formatNumber(item.favorites || item.likes)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* List View */}
              {layout.viewType === "list" && (
                <div className={`grid gap-3 ${
                  layout.columns >= 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                }`}>
                  {filteredManga.map((item, index) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}>
                      <Link href={`/manga/${item.slug || item.id}`} className="flex gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
                        <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-purple-900/50">
                          {item.coverUrl ? (
                            <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><FiBook className="w-6 h-6 text-white/30" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate group-hover:text-purple-300 transition-colors">{item.title}</h3>
                          <p className="text-gray-500 text-sm mt-1">{item.totalChapters || 0} Chapters</p>
                          <div className="flex items-center gap-3 mt-2 text-gray-400 text-xs">
                            <span className="flex items-center gap-1"><FiEye className="w-3 h-3" />{formatNumber(item.views)}</span>
                            <span className="flex items-center gap-1"><FiHeart className="w-3 h-3" />{formatNumber(item.favorites || item.likes)}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {layout.viewType === "table" && (
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">#</th>
                        <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Title</th>
                        <th className="text-center px-4 py-3 text-gray-400 text-sm font-medium">Chapters</th>
                        <th className="text-center px-4 py-3 text-gray-400 text-sm font-medium">Views</th>
                        <th className="text-center px-4 py-3 text-gray-400 text-sm font-medium">Favorites</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredManga.map((item, index) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-gray-500 text-sm">{index + 1}</td>
                          <td className="px-4 py-3">
                            <Link href={`/manga/${item.slug || item.id}`} className="flex items-center gap-3 group">
                              <div className="w-10 h-12 rounded overflow-hidden bg-purple-900/50 flex-shrink-0">
                                {item.coverUrl ? <img src={item.coverUrl} alt="" className="w-full h-full object-cover" /> : <FiBook className="w-4 h-4 text-white/30 m-auto" />}
                              </div>
                              <span className="text-white font-medium group-hover:text-purple-300 transition-colors truncate">{item.title}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center text-purple-400 font-semibold">{item.totalChapters || 0}</td>
                          <td className="px-4 py-3 text-center text-gray-400">{formatNumber(item.views)}</td>
                          <td className="px-4 py-3 text-center text-gray-400">{formatNumber(item.favorites || item.likes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBook className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No manga found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery
                  ? "We couldn't find any manga matching your search. Try different keywords."
                  : "Our manga library is being updated. Check back soon!"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
