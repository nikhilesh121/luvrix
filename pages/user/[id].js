import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Layout from "../../components/Layout";
import { ProfilePageSchema } from "../../components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getUser, getUserByUniqueId, getUserBlogs, getUserStats, getUserLibraries, getBlog,
  isFollowing, followUser, unfollowUser 
} from "../../lib/api-client";
import { useAuth } from "../../context/AuthContext";
import { 
  FiUser, FiUsers, FiEye, FiHeart, FiBookOpen, FiCalendar, 
  FiGrid, FiList, FiFolder, FiArrowLeft, FiUserPlus, FiUserCheck,
  FiTrendingUp, FiAward, FiEdit3, FiExternalLink, FiBookmark
} from "react-icons/fi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("blogs");
  const [viewMode, setViewMode] = useState("grid");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [libraryBlogs, setLibraryBlogs] = useState([]);

  useEffect(() => {
    if (id) fetchUserData();
  }, [id]);

  useEffect(() => {
    if (currentUser && profileUser) {
      checkFollowStatus();
    }
  }, [currentUser, profileUser]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Check if ID looks like uniqueId (YYYYMMDD0001 format - 12 digits)
      const isUniqueIdFormat = /^\d{12}$/.test(id);
      let userData = null;
      let userId = id;
      
      if (isUniqueIdFormat) {
        // Try uniqueId first for YYYYMMDD format
        userData = await getUserByUniqueId(id).catch(() => null);
        if (userData) {
          userId = userData.id;
        }
      }
      
      if (!userData) {
        // Try by user ID
        userData = await getUser(id).catch(() => null);
        userId = id;
      }
      
      if (!userData) {
        setLoading(false);
        return;
      }
      
      const [userBlogs, userStats, userLibraries] = await Promise.all([
        getUserBlogs(userId, "approved"),
        getUserStats(userId),
        getUserLibraries(userId, false),
      ]);
      
      setProfileUser(userData);
      setBlogs(userBlogs);
      setStats(userStats);
      setLibraries(userLibraries);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (currentUser && profileUser && currentUser.uid !== profileUser.id) {
      const isFollowingUser = await isFollowing(currentUser.uid, profileUser.id);
      setFollowing(isFollowingUser);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(currentUser.uid, profileUser.id);
        setFollowing(false);
        setStats(prev => ({ ...prev, followersCount: Math.max(0, (prev?.followersCount || 1) - 1) }));
      } else {
        await followUser(currentUser.uid, profileUser.id);
        setFollowing(true);
        setStats(prev => ({ ...prev, followersCount: (prev?.followersCount || 0) + 1 }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLibraryClick = async (library) => {
    setSelectedLibrary(library);
    const blogPromises = library.blogs?.map(blogId => getBlog(blogId)) || [];
    const fetchedBlogs = await Promise.all(blogPromises);
    setLibraryBlogs(fetchedBlogs.filter(Boolean));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <Layout title="Loading Profile...">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout title="User Not Found">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center text-white">
            <FiUser className="w-20 h-20 mx-auto mb-4 text-gray-600" />
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <Link href="/" className="text-primary hover:underline">Go Home</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${profileUser.name || "User"}'s Profile`} noindex={true}>
      <Head>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content={`View ${profileUser.name}'s profile and published blogs on Luvrix`} />
        <meta property="og:title" content={`${profileUser.name} - Luvrix Creator`} />
        <meta property="og:image" content={profileUser.photoURL || "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png"} />
      </Head>

      <ProfilePageSchema user={profileUser} url={`/user/${router.query.id}`} />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20" />
          <motion.div 
            className="absolute inset-0"
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          
          <div className="relative max-w-6xl mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-center md:items-start gap-8"
            >
              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                  {profileUser.photoURL ? (
                    <img src={profileUser.photoURL} alt={profileUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {profileUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
                {profileUser.publisherCategory && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                    {profileUser.publisherCategory}
                  </div>
                )}
              </motion.div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {profileUser.name || "Anonymous"}
                </h1>
                {profileUser.bio && (
                  <p className="text-gray-400 mb-4 max-w-xl">{profileUser.bio}</p>
                )}
                
                {/* Stats Row */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(stats?.totalBlogs)}</p>
                    <p className="text-gray-500 text-sm">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(stats?.followersCount)}</p>
                    <p className="text-gray-500 text-sm">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(stats?.followingCount)}</p>
                    <p className="text-gray-500 text-sm">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(stats?.totalViews)}</p>
                    <p className="text-gray-500 text-sm">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(stats?.totalLikes)}</p>
                    <p className="text-gray-500 text-sm">Likes</p>
                  </div>
                </div>

                {/* Follow Button */}
                {currentUser && currentUser.uid !== profileUser.id && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                      following
                        ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                        : "bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90"
                    }`}
                  >
                    {followLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : following ? (
                      <>
                        <FiUserCheck className="w-5 h-5" /> Following
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-5 h-5" /> Follow
                      </>
                    )}
                  </motion.button>
                )}

                {/* Member Since */}
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-4 justify-center md:justify-start">
                  <FiCalendar className="w-4 h-4" />
                  <span>Joined {formatDate(profileUser.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-16 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[
                  { id: "blogs", label: "Posts", icon: FiEdit3, count: stats?.totalBlogs },
                  { id: "libraries", label: "Libraries", icon: FiFolder, count: libraries.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedLibrary(null); }}
                    className={`flex items-center gap-2 px-5 py-4 font-medium transition-all relative ${
                      activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{tab.count}</span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
                      />
                    )}
                  </button>
                ))}
              </div>
              
              {/* View Toggle */}
              {activeTab === "blogs" && (
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500"}`}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500"}`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {activeTab === "blogs" && !selectedLibrary && (
              <motion.div
                key="blogs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {blogs.length > 0 ? (
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {blogs.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/blog?id=${blog.id}`}>
                          <div className={`group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all ${
                            viewMode === "list" ? "flex gap-4 p-4" : ""
                          }`}>
                            {blog.thumbnail && (
                              <div className={viewMode === "list" ? "w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden" : "aspect-video"}>
                                <img 
                                  src={blog.thumbnail} 
                                  alt={blog.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className={viewMode === "list" ? "flex-1" : "p-5"}>
                              <span className="text-xs text-primary font-medium">{blog.category}</span>
                              <h3 className="text-lg font-semibold text-white mt-1 group-hover:text-primary transition-colors line-clamp-2">
                                {blog.title}
                              </h3>
                              <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
                                <span className="flex items-center gap-1">
                                  <FiEye className="w-4 h-4" /> {formatNumber(blog.views)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FiHeart className="w-4 h-4" /> {formatNumber(blog.likes)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <FiEdit3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                    <p className="text-gray-500">This user hasn't published any posts yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "libraries" && !selectedLibrary && (
              <motion.div
                key="libraries"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {libraries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {libraries.map((library, index) => (
                      <motion.div
                        key={library.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleLibraryClick(library)}
                        className="cursor-pointer"
                      >
                        <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                            <FiFolder className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                            {library.name}
                          </h3>
                          {library.description && (
                            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{library.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <FiBookOpen className="w-4 h-4" />
                            <span>{library.blogs?.length || 0} stories</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <FiFolder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No libraries yet</h3>
                    <p className="text-gray-500">This user hasn't created any public libraries yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {selectedLibrary && (
              <motion.div
                key="library-detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button
                  onClick={() => setSelectedLibrary(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back to Libraries
                </button>
                
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedLibrary.name}</h2>
                  {selectedLibrary.description && (
                    <p className="text-gray-400">{selectedLibrary.description}</p>
                  )}
                </div>

                {libraryBlogs.length > 0 ? (
                  <div className="space-y-4">
                    {libraryBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/blog?id=${blog.id}`}>
                          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                              {index + 1}
                            </div>
                            {blog.thumbnail && (
                              <img src={blog.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg" />
                            )}
                            <div className="flex-1">
                              <h3 className="text-white font-medium group-hover:text-primary transition-colors">
                                {blog.title}
                              </h3>
                              <p className="text-gray-500 text-sm">{blog.category}</p>
                            </div>
                            <FiExternalLink className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    This library is empty.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
