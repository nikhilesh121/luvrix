import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import BlogCard from "../components/BlogCard";
import { useAuth } from "../context/AuthContext";
import { getUserFavorites, getBlog } from "../lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiHeart, FiBookOpen, FiGrid, FiSearch, 
  FiX, FiArrowRight, FiGift
} from "react-icons/fi";

export default function Favorites() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [_favorites, setFavorites] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [giveaways, setGiveaways] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    
    if (!isLoggedIn) {
      router.push("/login?redirect=/favorites");
      return;
    }
    
    const fetchFavorites = async () => {
      try {
        const favs = await getUserFavorites(user.uid);
        setFavorites(favs);
        
        // Fetch actual blog data for each blog favorite
        const blogPromises = favs
          .filter(f => f.itemType === "blog")
          .map(async (fav) => {
            const blog = await getBlog(fav.itemId);
            return blog ? { ...blog, favoriteType: "blog" } : null;
          });
        
        const blogsData = await Promise.all(blogPromises);
        setBlogs(blogsData.filter(Boolean));

        // Fetch giveaway data for each giveaway favorite
        const giveawayFavs = favs.filter(f => f.itemType === "giveaway");
        if (giveawayFavs.length > 0) {
          const giveawayPromises = giveawayFavs.map(async (fav) => {
            try {
              const res = await fetch(`/api/giveaways/${fav.itemId}`);
              if (!res.ok) return null;
              const g = await res.json();
              return g && !g.error ? { ...g, favoriteType: "giveaway" } : null;
            } catch { return null; }
          });
          const giveawaysData = await Promise.all(giveawayPromises);
          setGiveaways(giveawaysData.filter(Boolean));
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [authLoading, isLoggedIn, user, router]);

  const allItems = [...blogs, ...giveaways];

  const filteredItems = allItems.filter((item) => {
    if (filter !== "all" && item.favoriteType !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.title?.toLowerCase().includes(query) ||
             item.category?.toLowerCase().includes(query);
    }
    return true;
  });

  if (!user) {
    return (
      <Layout title="Favorites" noindex={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Favorites" description="Your saved articles and content" noindex={true}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-rose-500 to-red-500">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <FiHeart className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                My Favorites
              </h1>
              <p className="text-white/80 text-lg max-w-xl mx-auto">
                Your curated collection of saved articles and content
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{allItems.length}</p>
                  <p className="text-white/60 text-sm">Saved Items</p>
                </div>
                {blogs.length > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{blogs.length}</p>
                    <p className="text-white/60 text-sm">Articles</p>
                  </div>
                )}
                {giveaways.length > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{giveaways.length}</p>
                    <p className="text-white/60 text-sm">Giveaways</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" className="w-full">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z" fill="#f9fafb"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 pb-20 -mt-4">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 mb-8 border border-gray-100"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your favorites..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    filter === "all" 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  All
                </button>
                <button
                  onClick={() => setFilter("blog")}
                  className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    filter === "blog" 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FiBookOpen className="w-4 h-4" />
                  Articles
                </button>
                <button
                  onClick={() => setFilter("giveaway")}
                  className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    filter === "giveaway" 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FiGift className="w-4 h-4" />
                  Giveaways
                </button>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredItems.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {item.favoriteType === "giveaway" ? (
                      <Link href={`/giveaway/${item.slug}`} className="block group">
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                          {item.imageUrl && (
                            <div className="relative h-44 overflow-hidden">
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute top-3 left-3">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                                  item.status === "active" ? "bg-green-500" :
                                  item.status === "winner_selected" ? "bg-purple-500" : "bg-gray-500"
                                }`}>
                                  {item.status === "active" ? "Live" : item.status === "winner_selected" ? "Winner" : "Ended"}
                                </span>
                              </div>
                              <div className="absolute top-3 right-3">
                                <span className="bg-pink-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <FiGift className="w-3 h-3" /> Giveaway
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                            {item.prizeDetails && <p className="text-sm text-gray-500 line-clamp-2">{item.prizeDetails}</p>}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <BlogCard blog={item} index={index} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiHeart className="w-10 h-10 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No favorites yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Start exploring and save articles you love to build your personal collection.
              </p>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Explore Articles
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
