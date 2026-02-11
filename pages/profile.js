import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import UserGuard from "../components/UserGuard";
import BuyPostsModal from "../components/BuyPostsModal";
import { 
  getUser, updateUser, getUserBlogs, getUserPayments, getFollowers, getFollowing,
  deleteBlog, getUserLibraries, createLibrary, updateLibrary, deleteLibrary,
  addBlogToLibrary, removeBlogFromLibrary, getUserReferrals, getReferralStats,
  generateReferralCode, getMyGiveaways
} from "../lib/api-client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX, FiImage,
  FiFileText, FiCreditCard, FiCalendar, FiCheck, FiShoppingBag,
  FiGlobe, FiTwitter, FiInstagram, FiExternalLink, FiPlus,
  FiTrendingUp, FiEye, FiAward, FiZap, FiChevronRight, FiUsers,
  FiHeart, FiCopy, FiLink, FiStar, FiTarget, FiActivity, FiBookOpen,
  FiShare2, FiSettings, FiGrid, FiTrash2, FiFolder, FiCheckCircle,
  FiClock, FiXCircle, FiMoreVertical, FiEdit3, FiGift
} from "react-icons/fi";
import Link from "next/link";

export default function Profile() {
  return (
    <UserGuard>
      {({ user, userData }) => <ProfileContent user={user} initialUserData={userData} />}
    </UserGuard>
  );
}

function ProfileContent({ user, initialUserData }) {
  const router = useRouter();
  const [userData, setUserData] = useState(initialUserData);
  const [blogs, setBlogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("blogs");
  const [blogFilter, setBlogFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Library management states
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [libraryForm, setLibraryForm] = useState({ name: "", description: "", isPublic: true });
  const [selectedBlogForLibrary, setSelectedBlogForLibrary] = useState(null);
  
  // Referral states
  const [referrals, setReferrals] = useState([]);
  const [referralStats, setReferralStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [referralCode, setReferralCode] = useState("");

  // Giveaway states
  const [myGiveaways, setMyGiveaways] = useState([]);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    phone: userData?.phone || "",
    bio: userData?.bio || "",
    photoURL: userData?.photoURL || "",
    website: userData?.website || "",
    twitter: userData?.twitter || "",
    instagram: userData?.instagram || "",
    linkedin: userData?.linkedin || "",
    youtube: userData?.youtube || "",
    facebook: userData?.facebook || "",
    tiktok: userData?.tiktok || "",
    github: userData?.github || "",
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [userBlogs, userPayments, freshUserData, userFollowers, userFollowing, userLibraries, userReferrals, userReferralStats, userGiveaways] = await Promise.all([
        getUserBlogs(user.uid),
        getUserPayments(user.uid),
        getUser(user.uid),
        getFollowers(user.uid),
        getFollowing(user.uid),
        getUserLibraries(user.uid, true),
        getUserReferrals(user.uid).catch(() => []),
        getReferralStats(user.uid).catch(() => ({ total: 0, completed: 0, pending: 0 })),
        getMyGiveaways().catch(() => []),
      ]);
      
      setBlogs(userBlogs);
      setPayments(userPayments);
      setFollowers(userFollowers);
      setFollowing(userFollowing);
      setLibraries(userLibraries || []);
      setReferrals(userReferrals || []);
      setReferralStats(userReferralStats || { total: 0, completed: 0, pending: 0 });
      setMyGiveaways(Array.isArray(userGiveaways) ? userGiveaways : []);
      if (freshUserData) {
        setUserData(freshUserData);
        setReferralCode(freshUserData.referralCode || "");
        setFormData({
          name: freshUserData.name || "",
          phone: freshUserData.phone || "",
          bio: freshUserData.bio || "",
          photoURL: freshUserData.photoURL || "",
          website: freshUserData.website || "",
          twitter: freshUserData.twitter || "",
          instagram: freshUserData.instagram || "",
          linkedin: freshUserData.linkedin || "",
          youtube: freshUserData.youtube || "",
          facebook: freshUserData.facebook || "",
          tiktok: freshUserData.tiktok || "",
          github: freshUserData.github || "",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Buy posts success handler
  const handleBuySuccess = async () => {
    const freshUserData = await getUser(user.uid);
    setUserData(freshUserData);
    setShowBuyModal(false);
  };

  // Blog management functions
  const handleDeleteBlog = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    try {
      await deleteBlog(blogId);
      setBlogs(blogs.filter(b => b.id !== blogId));
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    }
  };

  // Library management functions
  const handleCreateLibrary = async () => {
    if (!libraryForm.name.trim()) return;
    try {
      const libraryId = await createLibrary(user.uid, libraryForm);
      setLibraries([...libraries, { id: libraryId, ...libraryForm, blogs: [] }]);
      setShowLibraryModal(false);
      setLibraryForm({ name: "", description: "", isPublic: true });
    } catch (error) {
      console.error("Error creating library:", error);
      alert("Failed to create library");
    }
  };

  const handleUpdateLibrary = async () => {
    if (!editingLibrary || !libraryForm.name.trim()) return;
    try {
      await updateLibrary(editingLibrary.id, libraryForm);
      setLibraries(libraries.map(lib => 
        lib.id === editingLibrary.id ? { ...lib, ...libraryForm } : lib
      ));
      setEditingLibrary(null);
      setShowLibraryModal(false);
      setLibraryForm({ name: "", description: "", isPublic: true });
    } catch (error) {
      console.error("Error updating library:", error);
      alert("Failed to update library");
    }
  };

  const handleDeleteLibrary = async (libraryId) => {
    if (!confirm("Are you sure you want to delete this library?")) return;
    try {
      await deleteLibrary(libraryId);
      setLibraries(libraries.filter(lib => lib.id !== libraryId));
    } catch (error) {
      console.error("Error deleting library:", error);
      alert("Failed to delete library");
    }
  };

  const handleAddToLibrary = async (libraryId, blogId) => {
    try {
      await addBlogToLibrary(libraryId, blogId);
      setLibraries(libraries.map(lib => 
        lib.id === libraryId 
          ? { ...lib, blogs: [...(lib.blogs || []), blogId] }
          : lib
      ));
      setSelectedBlogForLibrary(null);
    } catch (error) {
      console.error("Error adding blog to library:", error);
    }
  };

  const handleRemoveFromLibrary = async (libraryId, blogId) => {
    try {
      await removeBlogFromLibrary(libraryId, blogId);
      setLibraries(libraries.map(lib => 
        lib.id === libraryId 
          ? { ...lib, blogs: (lib.blogs || []).filter(id => id !== blogId) }
          : lib
      ));
    } catch (error) {
      console.error("Error removing blog from library:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(user.uid, formData);
      setUserData({ ...userData, ...formData });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReferralCode = async () => {
    try {
      const result = await generateReferralCode(user.uid);
      setReferralCode(result.code);
    } catch (error) {
      console.error("Error generating referral code:", error);
      alert("Failed to generate referral code");
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const tabs = [
    { id: "blogs", label: "My Blogs", icon: FiFileText, count: blogs.length },
    { id: "libraries", label: "Libraries", icon: FiFolder, count: libraries.length },
    { id: "giveaways", label: "Giveaways", icon: FiGift, count: myGiveaways.length },
    { id: "referrals", label: "Referrals", icon: FiUsers },
    { id: "profile", label: "Settings", icon: FiSettings },
    { id: "payments", label: "Payments", icon: FiCreditCard, count: payments.length },
  ];

  // Filter blogs based on selected filter
  const filteredBlogs = blogFilter === "all" 
    ? blogs 
    : blogs.filter(b => b.status === blogFilter);

  const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalLikes = blogs.reduce((sum, b) => sum + (b.likes || 0), 0);

  // Calculate account age
  const accountAge = userData?.createdAt 
    ? Math.floor((Date.now() - (userData.createdAt?.toDate?.() || new Date(userData.createdAt)).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Achievement badges based on stats
  const badges = [
    { id: 'writer', label: 'Writer', icon: FiEdit2, unlocked: blogs.length >= 1, color: 'purple' },
    { id: 'popular', label: 'Popular', icon: FiTrendingUp, unlocked: totalViews >= 100, color: 'blue' },
    { id: 'loved', label: 'Loved', icon: FiHeart, unlocked: totalLikes >= 10, color: 'pink' },
    { id: 'influencer', label: 'Influencer', icon: FiUsers, unlocked: followers.length >= 5, color: 'green' },
    { id: 'veteran', label: 'Veteran', icon: FiAward, unlocked: accountAge >= 30, color: 'amber' },
    { id: 'prolific', label: 'Prolific', icon: FiBookOpen, unlocked: blogs.length >= 10, color: 'cyan' },
  ];

  return (
    <Layout title="My Profile" noindex={true}>
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Ultra Modern Hero Header */}
        <div className="relative overflow-hidden">
          {/* Animated Mesh Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                x: [0, 50, 0],
                y: [0, -30, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/40 via-pink-600/30 to-transparent rounded-full blur-[120px]"
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                x: [0, -40, 0],
                y: [0, 40, 0]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-to-l from-blue-600/40 via-cyan-600/30 to-transparent rounded-full blur-[120px]"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-full blur-[100px]"
            />
          </div>

          {/* Floating Decorative Elements */}
          <motion.div
            animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-20 right-[20%] w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-xl border border-white/10 hidden lg:flex items-center justify-center"
          >
            <FiStar className="w-6 h-6 text-purple-400" />
          </motion.div>
          <motion.div
            animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-32 left-[15%] w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-xl border border-white/10 hidden lg:flex items-center justify-center"
          >
            <FiZap className="w-5 h-5 text-cyan-400" />
          </motion.div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 lg:py-20">
            {/* Top Actions Bar */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-10"
            >
              <div className="flex items-center gap-3">
                <Link 
                  href="/create-blog"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="text-sm">New Post</span>
                </Link>
                {userData?.uniqueId && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-xl rounded-xl text-gray-400 border border-white/10">
                    <span className="text-xs">ID:</span>
                    <code className="text-xs font-mono text-purple-400">{userData.uniqueId}</code>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href={`/user/${userData?.uniqueId || user?.uid}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                >
                  <FiEye className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Public Profile</span>
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/user/${userData?.uniqueId || user?.uid}`);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                >
                  {copiedId ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiShare2 className="w-4 h-4" />}
                  <span className="text-sm font-medium hidden sm:inline">{copiedId ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12"
            >
              {/* Avatar with Glow Ring */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-75 blur-md"
                />
                <div className="relative w-36 h-36 lg:w-44 lg:h-44 rounded-[1.8rem] bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-[1.6rem] bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="w-14 h-14 text-gray-600" />
                    )}
                  </div>
                </div>
                {editing && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-purple-400 transition-colors">
                    <FiImage className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="text-center lg:text-left flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-1">
                      {userData?.name || "User"}
                    </h1>
                    <p className="text-gray-400 flex items-center gap-2 justify-center lg:justify-start">
                      <FiMail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>
                                  </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Posts', value: blogs.length, icon: FiFileText, color: 'purple' },
                    { label: 'Followers', value: followers.length, icon: FiUsers, color: 'pink' },
                    { label: 'Following', value: following.length, icon: FiHeart, color: 'red' },
                    { label: 'Views', value: totalViews.toLocaleString(), icon: FiEye, color: 'cyan' },
                    { label: 'Likes', value: totalLikes.toLocaleString(), icon: FiZap, color: 'amber' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="relative group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="relative p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all text-center">
                        <stat.icon className={`w-5 h-5 text-${stat.color}-400 mx-auto mb-2`} />
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Achievement Badges */}
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center lg:text-left">Achievements</p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    {badges.map((badge, i) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className={`relative group ${!badge.unlocked && 'opacity-40'}`}
                      >
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          badge.unlocked 
                            ? `bg-${badge.color}-500/10 border-${badge.color}-500/30 text-${badge.color}-400` 
                            : 'bg-white/5 border-white/10 text-gray-500'
                        }`}>
                          <badge.icon className="w-4 h-4" />
                          <span className="text-xs font-semibold">{badge.label}</span>
                          {badge.unlocked && <FiCheck className="w-3 h-3" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* User ID */}
                <div className="flex items-center gap-2 justify-center lg:justify-start text-xs text-gray-500">
                  <span>User ID:</span>
                  <code className="px-2 py-1 bg-white/5 rounded font-mono">{userData?.uniqueId || user?.uid?.slice(0, 12)}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userData?.uniqueId || user?.uid || "");
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedId ? <FiCheck className="w-3 h-3 text-green-400" /> : <FiCopy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gradient-to-b from-[#0a0a0f] to-[#12121a] min-h-[50vh]">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Tabs */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 mb-8 inline-flex gap-2 border border-white/10 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? "bg-white/20" : "bg-white/10"
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

          <AnimatePresence mode="wait">
          {/* Blogs Tab */}
          {activeTab === "blogs" && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Blog Filters */}
              <div className="flex items-center gap-2 mb-6 bg-white/5 rounded-xl p-1 w-fit">
                {[
                  { id: "all", label: "All", count: blogs.length },
                  { id: "approved", label: "Published", count: blogs.filter(b => b.status === "approved").length },
                  { id: "pending", label: "Pending", count: blogs.filter(b => b.status === "pending").length },
                  { id: "rejected", label: "Rejected", count: blogs.filter(b => b.status === "rejected").length },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setBlogFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      blogFilter === filter.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              {/* Free Post Alert */}
              {userData?.freePostsUsed === 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <FiStar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">You have 1 free post available!</p>
                    <p className="text-gray-400 text-sm">Start sharing your story with the world today.</p>
                  </div>
                  <Link href="/create-blog" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                    Use Now
                  </Link>
                </div>
              )}

              {/* Blog List */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">Loading your posts...</p>
                </div>
              ) : filteredBlogs.length > 0 ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {filteredBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-5 hover:bg-white/5 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                                {blog.title}
                              </h3>
                              {blog.status === "approved" ? (
                                <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                                  <FiCheckCircle className="w-3 h-3" /> Live
                                </span>
                              ) : blog.status === "rejected" ? (
                                <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full flex items-center gap-1">
                                  <FiXCircle className="w-3 h-3" /> Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                                  <FiClock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <FiCalendar className="w-4 h-4" />
                                {formatDate(blog.createdAt)}
                              </span>
                              <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                                {blog.category || "General"}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiEye className="w-4 h-4" /> {blog.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiHeart className="w-4 h-4" /> {blog.likes || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {blog.status === "approved" ? (
                              <Link
                                href={`/blog?id=${blog.id}`}
                                className="p-2.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all"
                                title="View Live"
                              >
                                <FiExternalLink className="w-5 h-5" />
                              </Link>
                            ) : (
                              <Link
                                href={`/preview-blog?id=${blog.id}`}
                                className="p-2.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-all"
                                title="Preview"
                              >
                                <FiEye className="w-5 h-5" />
                              </Link>
                            )}
                            <Link
                              href={`/edit-blog?id=${blog.id}`}
                              className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all"
                              title="Edit"
                            >
                              <FiEdit3 className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => setSelectedBlogForLibrary(blog)}
                              className="p-2.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-all"
                              title="Add to Library"
                            >
                              <FiFolder className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiEdit3 className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {blogFilter === "all" ? "No posts yet" : `No ${blogFilter} posts`}
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    {blogFilter === "all" 
                      ? "Start your blogging journey today!"
                      : `You don't have any ${blogFilter} posts.`
                    }
                  </p>
                  {blogFilter === "all" && (
                    <Link 
                      href="/create-blog" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
                    >
                      <FiPlus className="w-5 h-5" /> Create Your First Post
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Libraries Tab */}
          {activeTab === "libraries" && (
            <motion.div
              key="libraries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400">Organize your blogs into collections</p>
                <button
                  onClick={() => {
                    setEditingLibrary(null);
                    setLibraryForm({ name: "", description: "", isPublic: true });
                    setShowLibraryModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <FiPlus className="w-4 h-4" /> Create Library
                </button>
              </div>

              {libraries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraries.map((library, index) => (
                    <motion.div
                      key={library.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                          <FiFolder className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingLibrary(library);
                              setLibraryForm({ name: library.name, description: library.description || "", isPublic: library.isPublic });
                              setShowLibraryModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLibrary(library.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                        {library.name}
                      </h3>
                      {library.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{library.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <FiBookOpen className="w-4 h-4" />
                          {library.blogs?.length || 0} posts
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          library.isPublic ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {library.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiFolder className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No libraries yet</h3>
                  <p className="text-gray-400 mb-6">Create collections to organize your blog posts</p>
                  <button
                    onClick={() => {
                      setEditingLibrary(null);
                      setLibraryForm({ name: "", description: "", isPublic: true });
                      setShowLibraryModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
                  >
                    <FiPlus className="w-5 h-5" /> Create Your First Library
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Profile/Settings Tab */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-purple-400" />
                      </div>
                      Basic Information
                    </h2>
                    <div className="flex gap-2">
                      {!editing ? (
                        <button
                          onClick={() => setEditing(true)}
                          className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl font-medium hover:bg-purple-500/30 transition-all flex items-center gap-2"
                        >
                          <FiEdit2 className="w-4 h-4" /> Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                          >
                            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                            Save
                          </button>
                          <button 
                            onClick={() => setEditing(false)} 
                            className="px-3 py-2 bg-white/10 text-gray-400 rounded-xl hover:bg-white/20 transition-all"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {saved && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <FiCheck className="w-4 h-4" />
                      </div>
                      Profile updated successfully!
                    </motion.div>
                  )}

                  <div className="space-y-5">
                    {/* Profile Picture URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Profile Picture URL</label>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.photoURL}
                          onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400 truncate">{formData.photoURL || "No image URL set"}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Enter a URL to your profile image (shows everywhere)</p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="Enter your name"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-white font-medium">{formData.name || "Not set"}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                      <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{user?.email}</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.phone || "Not set"}</p>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Bio</label>
                      {editing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500 resize-none"
                          rows={3}
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.bio || "No bio added"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Links Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FiGlobe className="w-4 h-4 text-blue-400" />
                    </div>
                    Social Links
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Website</label>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="https://yourwebsite.com"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.website || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Twitter</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.twitter}
                          onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="@username"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.twitter || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Instagram</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.instagram}
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="@username"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.instagram || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">LinkedIn</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.linkedin}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="linkedin.com/in/username"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.linkedin || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">YouTube</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.youtube}
                          onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="youtube.com/@channel"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.youtube || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Facebook</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.facebook}
                          onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="facebook.com/username"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.facebook || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">TikTok</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.tiktok}
                          onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="@username"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.tiktok || "Not set"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">GitHub</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.github}
                          onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-white placeholder-gray-500"
                          placeholder="github.com/username"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">{formData.github || "Not set"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                {/* Stats Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <FiTrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    Account Stats
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Total Blogs</span>
                        <span className="text-2xl font-black text-purple-400">{blogs.length}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Posts Available</span>
                        <span className="text-2xl font-black text-emerald-400">{userData?.extraPosts || 0}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Total Views</span>
                        <span className="text-2xl font-black text-blue-400">{totalViews}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Transactions</span>
                        <span className="text-2xl font-black text-amber-400">{payments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blog Credits */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FiZap className="w-5 h-5 text-purple-400" />
                    Blog Credits
                  </h2>
                  <div className="text-center py-4">
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      {(userData?.extraPosts || 0) + (userData?.freePostsUsed === 0 ? 1 : 0)}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Available Credits</p>
                    {userData?.freePostsUsed === 0 && (
                      <p className="text-xs text-emerald-400 mt-2">Includes 1 free post!</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowBuyModal(true)}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold mt-4"
                  >
                    <FiCreditCard className="w-5 h-5" />
                    Buy More Credits
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <Link 
                      href="/create-blog" 
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                      <FiPlus className="w-5 h-5" />
                      <span className="font-semibold">Create New Blog</span>
                    </Link>
                    <Link 
                      href="/leaderboard" 
                      className="flex items-center gap-3 p-3 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all border border-white/10"
                    >
                      <FiAward className="w-5 h-5" />
                      <span className="font-semibold">Leaderboard</span>
                    </Link>
                  </div>
                </div>

                {/* Data & Privacy (GDPR) */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FiSettings className="w-5 h-5 text-blue-400" />
                    Data & Privacy
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">Manage your personal data under GDPR.</p>
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch('/api/user/export-data', {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) throw new Error('Export failed');
                          const data = await res.json();
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `luvrix-data-export-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          alert('Failed to export data. Please try again.');
                        }
                      }}
                      className="flex items-center gap-3 w-full p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all border border-blue-500/20"
                    >
                      <FiExternalLink className="w-5 h-5" />
                      <span className="font-semibold">Export My Data</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) return;
                        if (!confirm('This will delete ALL your data including blogs, comments, and profile. Type OK to confirm.')) return;
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch('/api/user/delete-account', {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) throw new Error('Delete failed');
                          localStorage.clear();
                          router.push('/');
                        } catch (err) {
                          alert('Failed to delete account. Please try again.');
                        }
                      }}
                      className="flex items-center gap-3 w-full p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      <span className="font-semibold">Delete My Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Referral Code Card */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FiShare2 className="w-4 h-4 text-purple-400" />
                  </div>
                  Your Referral Link
                </h2>
                
                {referralCode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 font-mono text-white border border-white/10">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition flex items-center gap-2"
                      >
                        {copiedReferral ? <FiCheck /> : <FiCopy />}
                        {copiedReferral ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Share this link with friends. When they sign up and publish their first blog, you both earn bonus posts!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-4">Generate your unique referral code to start inviting friends</p>
                    <button
                      onClick={handleGenerateReferralCode}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition"
                    >
                      Generate Referral Code
                    </button>
                  </div>
                )}
              </div>

              {/* Referral Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-3xl font-bold text-purple-400">{referralStats.total}</p>
                  <p className="text-gray-400 text-sm">Total Invited</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-3xl font-bold text-emerald-400">{referralStats.completed}</p>
                  <p className="text-gray-400 text-sm">Completed</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-3xl font-bold text-amber-400">{referralStats.pending}</p>
                  <p className="text-gray-400 text-sm">Pending</p>
                </div>
              </div>

              {/* Referral List */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiUsers className="text-purple-400" />
                  Invited Users
                </h3>
                
                {referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((referral, index) => (
                      <motion.div
                        key={referral.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {referral.referredUser?.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{referral.referredUser?.name || "Unknown User"}</h4>
                          <p className="text-sm text-gray-500">{referral.referredUser?.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            referral.status === "completed" 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {referral.status === "completed" ? "Completed" : "Pending"}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(referral.createdAt)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <FiUsers className="w-8 h-8 text-gray-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">No referrals yet</h4>
                    <p className="text-gray-500">Share your referral link to start inviting friends</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Giveaways Tab */}
          {activeTab === "giveaways" && (
            <motion.div
              key="giveaways"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400">Track your giveaway participations and wins</p>
                <Link
                  href="/giveaway"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm"
                >
                  <FiGift className="w-4 h-4" /> Browse Giveaways
                </Link>
              </div>

              {myGiveaways.length > 0 ? (
                <div className="space-y-3">
                  {myGiveaways.map((entry, index) => {
                    const g = entry.giveaway;
                    if (!g) return null;
                    const isWinner = entry.status === "winner";
                    const isEligible = entry.status === "eligible";
                    const statusColor = isWinner ? "purple" : isEligible ? "emerald" : "amber";
                    const statusLabel = isWinner ? "Winner 🎉" : isEligible ? "Eligible" : g.winnerId ? "Not Selected" : "Joined";
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        <Link href={`/giveaway/${g.slug}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all">
                          {g.imageUrl && (
                            <img src={g.imageUrl} alt={g.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{g.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              {g.prizeDetails && <span className="truncate">{g.prizeDetails}</span>}
                              {g.endDate && <span className="flex items-center gap-1 flex-shrink-0"><FiClock className="w-3 h-3" />{new Date(g.endDate).toLocaleDateString()}</span>}
                            </div>
                            {isWinner && g.winnerName && (
                              <p className="text-xs text-purple-400 mt-1">Won by you!</p>
                            )}
                            {!isWinner && g.winnerName && (
                              <p className="text-xs text-gray-500 mt-1">Won by {g.winnerName}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold bg-${statusColor}-500/20 text-${statusColor}-400`}>
                              {statusLabel}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiGift className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No giveaways joined yet</h3>
                  <p className="text-gray-400 mb-6">Join a giveaway for free and win physical prizes!</p>
                  <Link
                    href="/giveaway"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
                  >
                    <FiGift className="w-5 h-5" /> Browse Giveaways
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <FiCreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  Payment History
                </h2>
              </div>

              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        payment.status === "success" 
                          ? "bg-emerald-500/20" 
                          : payment.status === "pending"
                          ? "bg-amber-500/20"
                          : "bg-red-500/20"
                      }`}>
                        <FiCreditCard className={`w-6 h-6 ${
                          payment.status === "success" 
                            ? "text-emerald-400" 
                            : payment.status === "pending"
                            ? "text-amber-400"
                            : "text-red-400"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {payment.packageLabel || `${payment.posts} Blog Posts`}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">₹{payment.amount}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            payment.status === "success"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : payment.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <FiShoppingBag className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No transactions yet</h3>
                  <p className="text-gray-500">Your payment history will appear here</p>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </div>

        {/* Library Modal */}
        <AnimatePresence>
          {showLibraryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowLibraryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#12121a] rounded-2xl p-6 w-full max-w-md border border-white/10"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  {editingLibrary ? "Edit Library" : "Create New Library"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Library Name</label>
                    <input
                      type="text"
                      value={libraryForm.name}
                      onChange={(e) => setLibraryForm({ ...libraryForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none text-white placeholder-gray-500"
                      placeholder="My Collection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                    <textarea
                      value={libraryForm.description}
                      onChange={(e) => setLibraryForm({ ...libraryForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none text-white placeholder-gray-500 resize-none"
                      rows={3}
                      placeholder="Describe your library..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={libraryForm.isPublic}
                      onChange={(e) => setLibraryForm({ ...libraryForm, isPublic: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="isPublic" className="text-gray-300">Make this library public</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowLibraryModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingLibrary ? handleUpdateLibrary : handleCreateLibrary}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    {editingLibrary ? "Update" : "Create"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add to Library Modal */}
        <AnimatePresence>
          {selectedBlogForLibrary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedBlogForLibrary(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#12121a] rounded-2xl p-6 w-full max-w-md border border-white/10"
              >
                <h3 className="text-xl font-bold text-white mb-2">Add to Library</h3>
                <p className="text-gray-400 mb-4 text-sm truncate">"{selectedBlogForLibrary.title}"</p>
                
                {libraries.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {libraries.map((library) => {
                      const isInLibrary = library.blogs?.includes(selectedBlogForLibrary.id);
                      return (
                        <button
                          key={library.id}
                          onClick={() => isInLibrary 
                            ? handleRemoveFromLibrary(library.id, selectedBlogForLibrary.id)
                            : handleAddToLibrary(library.id, selectedBlogForLibrary.id)
                          }
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isInLibrary 
                              ? "bg-purple-500/20 border border-purple-500/30" 
                              : "bg-white/5 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <FiFolder className={`w-5 h-5 ${isInLibrary ? "text-purple-400" : "text-gray-400"}`} />
                          <span className={`flex-1 text-left ${isInLibrary ? "text-white" : "text-gray-300"}`}>
                            {library.name}
                          </span>
                          {isInLibrary && <FiCheck className="w-5 h-5 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">No libraries yet</p>
                    <button
                      onClick={() => {
                        setSelectedBlogForLibrary(null);
                        setShowLibraryModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
                    >
                      Create Library
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedBlogForLibrary(null)}
                  className="w-full mt-4 px-4 py-3 bg-white/5 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-all"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buy Posts Modal */}
        <BuyPostsModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleBuySuccess}
          userData={userData}
        />
      </div>
    </Layout>
  );
}
