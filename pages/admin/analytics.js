import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog, getAllBlogs, getAllManga } from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { 
  FiSave, FiBarChart2, FiToggleLeft, FiToggleRight, FiUsers, FiEye, 
  FiTrendingUp, FiActivity, FiGlobe, FiClock, FiZap, FiRefreshCw,
  FiBookOpen, FiFileText, FiHeart, FiMessageCircle, FiAlertCircle, FiRadio,
  FiCalendar
} from "react-icons/fi";

export default function AdminAnalytics() {
  return (
    <AdminGuard>
      <AnalyticsContent />
    </AdminGuard>
  );
}

function AnalyticsContent() {
  const [settings, setSettings] = useState({
    analyticsEnabled: false,
    analyticsId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalManga: 0,
    totalViews: 0,
    totalFavorites: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [idError, setIdError] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [pageviewData, setPageviewData] = useState({ dailyViews: [], topPages: [], totalViews: 0, uniqueVisitors: 0 });
  const [liveStats, setLiveStats] = useState({
    liveUsers: 0,
    avgWatchTime: 0,
    pageBreakdown: {},
  });
  
  const { subscribe, joinAdminAnalytics, isConnected } = useSocket();

  useEffect(() => {
    fetchSettings();
    fetchStats();
    fetchLiveStats();
    fetchPageviews(dateRange);
  }, []);

  // Refetch when date range changes
  useEffect(() => {
    fetchPageviews(dateRange);
  }, [dateRange]);

  const fetchPageviews = async (range) => {
    try {
      const res = await fetch(`/api/analytics/pageviews?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setPageviewData(data);
      }
    } catch (error) {
      console.error('Error fetching pageview analytics:', error);
    }
  };

  // Subscribe to real-time analytics updates
  useEffect(() => {
    if (isConnected) {
      joinAdminAnalytics();
      
      const unsubscribe = subscribe('analytics:update', (data) => {
        setLiveStats(prev => ({ ...prev, ...data }));
      });
      
      return unsubscribe;
    }
  }, [isConnected, subscribe, joinAdminAnalytics]);

  // Fetch live stats periodically
  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/socket?analytics=true');
      if (res.ok) {
        const data = await res.json();
        setLiveStats(data);
      }
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  // Refresh live stats every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchLiveStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings({
        analyticsEnabled: data.analyticsEnabled || false,
        analyticsId: data.analyticsId || "",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const [blogs, manga] = await Promise.all([
        getAllBlogs("approved", false, 1000),
        getAllManga()
      ]);
      
      const totalBlogViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);
      const totalMangaViews = manga.reduce((acc, m) => acc + (m.views || 0), 0);
      const totalFavorites = manga.reduce((acc, m) => acc + (m.favorites || 0), 0);
      
      setStats({
        totalBlogs: blogs.length,
        totalManga: manga.length,
        totalViews: totalBlogViews + totalMangaViews,
        totalFavorites: totalFavorites,
        blogViews: totalBlogViews,
        mangaViews: totalMangaViews,
        topBlogs: [...blogs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
        topManga: [...manga].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const validateGAId = (id) => {
    if (!id) return "";
    const pattern = /^G-[A-Z0-9]{10}$/;
    if (!pattern.test(id)) {
      return "Invalid format. GA4 ID should be like G-XXXXXXXXXX (10 alphanumeric characters after G-)";
    }
    return "";
  };

  const handleIdChange = (value) => {
    setSettings({ ...settings, analyticsId: value.toUpperCase() });
    setIdError(validateGAId(value.toUpperCase()));
  };

  const handleSave = async () => {
    if (settings.analyticsId && validateGAId(settings.analyticsId)) {
      setIdError(validateGAId(settings.analyticsId));
      return;
    }
    
    setSaving(true);
    try {
      await updateSettings(settings);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated Analytics Settings",
        targetId: "settings",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)" }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
    </motion.div>
  );

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: FiBarChart2 },
    { id: "settings", label: "Settings", icon: FiActivity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Analytics & Insights
              </h1>
              <p className="text-gray-500">Monitor your website performance and traffic</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchStats}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Live Stats Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <FiRadio className="w-7 h-7 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">Live Users Now</p>
                        <p className="text-4xl font-black">{liveStats.liveUsers}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white/80 text-xs">Real-time tracking active</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <FiClock className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">Avg Watch Time</p>
                        <p className="text-4xl font-black">
                          {liveStats.avgWatchTime > 60 
                            ? `${Math.floor(liveStats.avgWatchTime / 60)}m ${liveStats.avgWatchTime % 60}s`
                            : `${liveStats.avgWatchTime}s`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white/80 text-xs">Based on {liveStats.totalSessions || 0} sessions</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <FiActivity className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">Active Pages</p>
                        <p className="text-4xl font-black">{Object.keys(liveStats.pageBreakdown || {}).length}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white/80 text-xs">Pages being viewed right now</span>
                    </div>
                  </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard icon={FiEye} label="Total Views" value={stats.totalViews} color="from-blue-500 to-cyan-500" subValue={`Blogs: ${stats.blogViews || 0} | Manga: ${stats.mangaViews || 0}`} />
                  <StatCard icon={FiFileText} label="Total Blogs" value={stats.totalBlogs} color="from-purple-500 to-pink-500" />
                  <StatCard icon={FiBookOpen} label="Total Manga" value={stats.totalManga} color="from-orange-500 to-red-500" />
                  <StatCard icon={FiHeart} label="Total Favorites" value={stats.totalFavorites} color="from-pink-500 to-rose-500" />
                </div>

                {/* Page Views Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8"
                >
                  <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <FiBarChart2 className="text-blue-500" />
                      Page Views
                    </h3>
                    <div className="flex items-center gap-2">
                      {[
                        { id: "1d", label: "Today" },
                        { id: "7d", label: "7 Days" },
                        { id: "30d", label: "30 Days" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setDateRange(r.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            dateRange === r.id
                              ? "bg-blue-500 text-white shadow"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Summary row */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-600 font-medium">Total Views</p>
                        <p className="text-2xl font-black text-blue-800">{(pageviewData.totalViews || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-purple-600 font-medium">Unique Visitors</p>
                        <p className="text-2xl font-black text-purple-800">{(pageviewData.uniqueVisitors || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    {pageviewData.dailyViews.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-end gap-1 h-48">
                          {(() => {
                            const maxViews = Math.max(...pageviewData.dailyViews.map(d => d.views), 1);
                            return pageviewData.dailyViews.map((day, i) => {
                              const height = Math.max((day.views / maxViews) * 100, 2);
                              const dateStr = new Date(day.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                    {day.views} views / {day.uniqueVisitors} unique
                                  </div>
                                  <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-300 hover:from-blue-600 hover:to-blue-500 min-w-[8px]"
                                    style={{ height: `${height}%` }}
                                  />
                                  <span className="text-[10px] text-gray-400 truncate w-full text-center">{dateStr}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <FiBarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No pageview data yet. Views will appear as visitors browse the site.</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Most Viewed Pages (from pageview analytics) */}
                {pageviewData.topPages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8"
                  >
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiTrendingUp className="text-cyan-500" />
                        Most Viewed Pages ({dateRange === '1d' ? 'Today' : dateRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {pageviewData.topPages.map((page, i) => (
                        <div key={page.path} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? "bg-yellow-100 text-yellow-600" :
                            i === 1 ? "bg-gray-100 text-gray-600" :
                            i === 2 ? "bg-orange-100 text-orange-600" :
                            "bg-gray-50 text-gray-400"
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{page.path}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">{page.views.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Page Breakdown */}
                {Object.keys(liveStats.pageBreakdown || {}).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8"
                  >
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiRadio className="text-green-500" />
                        Live Page Views
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {Object.entries(liveStats.pageBreakdown).map(([page, count]) => (
                        <div key={page} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-medium text-gray-700 truncate max-w-md">{page}</span>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            {count} {count === 1 ? 'viewer' : 'viewers'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Google Analytics Link */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <FiGlobe className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">Google Analytics Integration</h3>
                      <p className="text-white/80 text-sm mb-4">
                        For detailed analytics and demographic data, connect your Google Analytics account in the Settings tab.
                      </p>
                      {settings.analyticsId && (
                        <a
                          href={`https://analytics.google.com/analytics/web/?pli=1#/realtime/overview`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition"
                        >
                          <FiGlobe className="w-4 h-4" />
                          Open Google Analytics
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Top Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Blogs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiTrendingUp className="text-purple-500" />
                        Top Performing Blogs
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {stats.topBlogs?.length > 0 ? stats.topBlogs.map((blog, i) => (
                        <div key={blog.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? "bg-yellow-100 text-yellow-600" :
                            i === 1 ? "bg-gray-100 text-gray-600" :
                            i === 2 ? "bg-orange-100 text-orange-600" :
                            "bg-gray-50 text-gray-400"
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{blog.title}</p>
                            <p className="text-xs text-gray-400">{blog.category || "Uncategorized"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">{(blog.views || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">views</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-400">
                          <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No blog data yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Top Manga */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiZap className="text-orange-500" />
                        Top Performing Manga
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {stats.topManga?.length > 0 ? stats.topManga.map((manga, i) => (
                        <div key={manga.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? "bg-yellow-100 text-yellow-600" :
                            i === 1 ? "bg-gray-100 text-gray-600" :
                            i === 2 ? "bg-orange-100 text-orange-600" :
                            "bg-gray-50 text-gray-400"
                          }`}>
                            {i + 1}
                          </div>
                          {manga.coverUrl && (
                            <img src={manga.coverUrl} alt="" className="w-10 h-14 object-cover rounded-lg" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{manga.title}</p>
                            <p className="text-xs text-gray-400">{manga.totalChapters || 0} chapters</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">{(manga.views || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">views</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-400">
                          <FiBookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No manga data yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-2xl"
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                  {/* Enable/Disable Analytics */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FiBarChart2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Enable Analytics</p>
                        <p className="text-sm text-gray-500">Track website visitors with Google Analytics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, analyticsEnabled: !settings.analyticsEnabled })}
                      className={`p-2 rounded-xl transition-all ${
                        settings.analyticsEnabled
                          ? "bg-green-100 text-green-600 shadow-lg shadow-green-100"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {settings.analyticsEnabled ? <FiToggleRight className="w-10 h-10" /> : <FiToggleLeft className="w-10 h-10" />}
                    </button>
                  </div>

                  {/* Analytics ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Google Analytics Measurement ID
                    </label>
                    <input
                      type="text"
                      value={settings.analyticsId}
                      onChange={(e) => handleIdChange(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                        idError ? "border-red-300 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-primary"
                      }`}
                      placeholder="G-XXXXXXXXXX"
                    />
                    {idError && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <FiAlertCircle className="w-4 h-4" />
                        {idError}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Enter your Google Analytics 4 Measurement ID. It should start with G- followed by 10 alphanumeric characters.
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <FiGlobe className="w-5 h-5" />
                      How to get your Measurement ID:
                    </h3>
                    <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                      <li>Go to <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-blue-800">Google Analytics</a></li>
                      <li>Create a new GA4 property or select existing one</li>
                      <li>Go to <strong>Admin → Data Streams → Web</strong></li>
                      <li>Copy the <strong>Measurement ID</strong> (format: G-XXXXXXXXXX)</li>
                    </ol>
                  </div>

                  {/* Status Preview */}
                  {settings.analyticsEnabled && settings.analyticsId && !idError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <h3 className="font-bold text-green-800">Analytics Active</h3>
                      </div>
                      <p className="text-sm text-green-700">
                        Google Analytics is tracking visitors with ID: 
                        <code className="ml-2 bg-green-100 px-3 py-1 rounded-lg font-mono font-bold">{settings.analyticsId}</code>
                      </p>
                    </motion.div>
                  )}

                  {/* Save Button */}
                  <div className="flex items-center gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={saving || idError}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSave className="w-5 h-5" />
                      )}
                      Save Settings
                    </motion.button>
                    {saved && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-600 font-semibold flex items-center gap-2"
                      >
                        ✓ Saved successfully!
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
