import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { getPublishers } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";
import { followUser, unfollowUser, isFollowing } from "../lib/api-client";
import { 
  FiUsers, FiUserPlus, FiUserCheck,
  FiFilter, FiSearch, FiStar, FiBookOpen, FiHeart, FiRadio, FiPenTool, FiCamera, FiFilm, FiCpu
} from "react-icons/fi";

const PUBLISHER_CATEGORIES = [
  { id: "all", label: "All Creators", icon: FiUsers },
  { id: "storyteller", label: "Storytellers", icon: FiBookOpen },
  { id: "news", label: "News Publishers", icon: FiRadio },
  { id: "tech", label: "Tech Writers", icon: FiCpu },
  { id: "lifestyle", label: "Lifestyle", icon: FiHeart },
  { id: "entertainment", label: "Entertainment", icon: FiFilm },
  { id: "education", label: "Educators", icon: FiPenTool },
  { id: "creative", label: "Creative Artists", icon: FiCamera },
];

const SORT_OPTIONS = [
  { id: "followers", label: "Most Followers" },
  { id: "views", label: "Most Views" },
  { id: "blogs", label: "Most Posts" },
];

export default function PublishersPage() {
  const { user } = useAuth();
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("followers");
  const [searchQuery, setSearchQuery] = useState("");
  const [followingMap, setFollowingMap] = useState({});
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  useEffect(() => {
    fetchPublishers();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    if (user && publishers.length > 0) {
      checkFollowStatuses();
    }
  }, [user, publishers]);

  const fetchPublishers = async () => {
    setLoading(true);
    try {
      const data = await getPublishers(selectedCategory === "all" ? null : selectedCategory, sortBy);
      setPublishers(data);
    } catch (error) {
      console.error("Error fetching publishers:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatuses = async () => {
    const statuses = {};
    for (const pub of publishers) {
      if (pub.id !== user?.uid) {
        statuses[pub.id] = await isFollowing(user.uid, pub.id);
      }
    }
    setFollowingMap(statuses);
  };

  const handleFollow = async (publisherId) => {
    if (!user) return;
    
    setFollowLoadingMap(prev => ({ ...prev, [publisherId]: true }));
    try {
      if (followingMap[publisherId]) {
        await unfollowUser(user.uid, publisherId);
        setFollowingMap(prev => ({ ...prev, [publisherId]: false }));
        setPublishers(prev => prev.map(p => 
          p.id === publisherId ? { ...p, followersCount: Math.max(0, (p.followersCount || 1) - 1) } : p
        ));
      } else {
        await followUser(user.uid, publisherId);
        setFollowingMap(prev => ({ ...prev, [publisherId]: true }));
        setPublishers(prev => prev.map(p => 
          p.id === publisherId ? { ...p, followersCount: (p.followersCount || 0) + 1 } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [publisherId]: false }));
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const filteredPublishers = publishers.filter(pub => 
    !searchQuery || pub.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Discover Creators" description="Find and follow your favorite content creators on Luvrix" canonical="https://luvrix.com/publishers/">
      <Head>
        <meta name="keywords" content="content creators, bloggers, publishers, luvrix writers" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-6">
                <FiStar className="w-4 h-4 text-yellow-400" />
                Discover Amazing Creators
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Find Your Favorite{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                  Publishers
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Follow storytellers, news writers, and content creators. Get updates when they publish new content.
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search creators by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-7xl mx-auto px-4 -mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {PUBLISHER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Sort Options */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-400">
              <span className="text-white font-semibold">{filteredPublishers.length}</span> creators found
            </p>
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-gray-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Publishers Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 sm:p-6 animate-pulse">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full" />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="h-4 sm:h-5 bg-white/10 rounded w-20 sm:w-32 mb-2 mx-auto sm:mx-0" />
                      <div className="h-3 sm:h-4 bg-white/10 rounded w-16 sm:w-24 mx-auto sm:mx-0" />
                    </div>
                  </div>
                  <div className="h-16 sm:h-20 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : filteredPublishers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
            >
              {filteredPublishers.map((publisher, index) => (
                <motion.div
                  key={publisher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-6 hover:border-primary/30 transition-all">
                    {/* Rank Badge */}
                    {index < 3 && (
                      <div className={`absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-base shadow-lg ${
                        index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
                        "bg-gradient-to-br from-orange-400 to-orange-600"
                      }`}>
                        #{index + 1}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <Link href={`/user/${publisher.uniqueId || publisher.id}`}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer"
                        >
                          {publisher.photoURL ? (
                            <img src={publisher.photoURL} alt={publisher.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                              <span className="text-xl sm:text-2xl font-bold text-white">
                                {publisher.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      </Link>
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <Link href={`/user/${publisher.uniqueId || publisher.id}`}>
                          <h3 className="text-sm sm:text-lg font-semibold text-white truncate hover:text-primary transition-colors cursor-pointer">
                            {publisher.name || "Anonymous"}
                          </h3>
                        </Link>
                        {publisher.publisherCategory && (
                          <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary text-[10px] sm:text-xs rounded-full">
                            {PUBLISHER_CATEGORIES.find(c => c.id === publisher.publisherCategory)?.label || publisher.publisherCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {publisher.bio && (
                      <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 hidden sm:block">{publisher.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-3 sm:mb-4">
                      <div className="text-center">
                        <p className="text-sm sm:text-lg font-bold text-white">{formatNumber(publisher.followersCount)}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm sm:text-lg font-bold text-white">{formatNumber(publisher.blogCount)}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm sm:text-lg font-bold text-white">{formatNumber(publisher.totalViews)}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Views</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 sm:gap-2">
                      <Link href={`/user/${publisher.uniqueId || publisher.id}`} className="flex-1">
                        <button className="w-full py-2 sm:py-2.5 bg-white/5 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-white/10 transition-all">
                          View Profile
                        </button>
                      </Link>
                      {user && user.uid !== publisher.id && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleFollow(publisher.id)}
                          disabled={followLoadingMap[publisher.id]}
                          className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all ${
                            followingMap[publisher.id]
                              ? "bg-white/10 text-white border border-white/20"
                              : "bg-gradient-to-r from-primary to-purple-600 text-white"
                          }`}
                        >
                          {followLoadingMap[publisher.id] ? (
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : followingMap[publisher.id] ? (
                            <FiUserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <FiUserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <FiUsers className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No creators found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? "Try a different search term" : "No creators in this category yet"}
              </p>
              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
                >
                  View All Creators
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
