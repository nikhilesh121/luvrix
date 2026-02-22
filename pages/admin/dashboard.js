import { useState, useEffect } from "react";
import Head from "next/head";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllBlogs, getAllUsers, getAllManga, getAllPayments } from "../../lib/firebase-client";
import { motion } from "framer-motion";
import { 
  FiFileText, FiUsers, FiBook, FiDollarSign, FiTrendingUp, FiClock,
  FiArrowUpRight, FiArrowRight, FiActivity, FiCheckCircle,
  FiAlertCircle, FiBarChart2, FiGift, FiHeart
} from "react-icons/fi";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState({
    blogs: { total: 0, pending: 0, approved: 0 },
    users: { total: 0 },
    manga: { total: 0 },
    payments: { total: 0, revenue: 0 },
  });
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [donationStats, setDonationStats] = useState({ grandTotal: 0, grandCount: 0, perGiveaway: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [blogs, users, manga, payments] = await Promise.all([
          getAllBlogs("approved", true),
          getAllUsers(),
          getAllManga(),
          getAllPayments(),
        ]);

        const pendingBlogs = blogs.filter((b) => b.status === "pending");
        const approvedBlogs = blogs.filter((b) => b.status === "approved");
        const totalRevenue = payments
          .filter((p) => p.status === "success")
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        setStats({
          blogs: {
            total: blogs.length,
            pending: pendingBlogs.length,
            approved: approvedBlogs.length,
          },
          users: { total: users.length },
          manga: { total: manga.length },
          payments: { total: payments.length, revenue: totalRevenue },
        });

        setRecentBlogs(blogs.slice(0, 5));

        // Fetch giveaway donation stats
        try {
          const token = localStorage.getItem("luvrix_auth_token");
          const donRes = await fetch("/api/giveaways/donation-stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (donRes.ok) {
            const donData = await donRes.json();
            setDonationStats(donData);
          }
        } catch {}
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Blogs",
      value: stats.blogs.total,
      icon: FiFileText,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/10 to-blue-600/10",
      link: "/admin/blogs",
      change: "+12%",
      positive: true,
    },
    {
      title: "Pending Approval",
      value: stats.blogs.pending,
      icon: FiClock,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      link: "/admin/blogs?status=pending",
      change: stats.blogs.pending > 0 ? "Action needed" : "All clear",
      positive: stats.blogs.pending === 0,
    },
    {
      title: "Total Users",
      value: stats.users.total,
      icon: FiUsers,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/10",
      link: "/admin/users",
      change: "+8%",
      positive: true,
    },
    {
      title: "Manga Series",
      value: stats.manga.total,
      icon: FiBook,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-500/10 to-violet-500/10",
      link: "/admin/manga",
      change: "+5%",
      positive: true,
    },
    {
      title: "Total Payments",
      value: stats.payments.total,
      icon: FiDollarSign,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-500/10 to-rose-500/10",
      link: "/admin/payments",
      change: "+15%",
      positive: true,
    },
    {
      title: "Revenue",
      value: `₹${stats.payments.revenue.toLocaleString()}`,
      icon: FiTrendingUp,
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-500/10 to-blue-500/10",
      link: "/admin/payments",
      change: "+23%",
      positive: true,
    },
    {
      title: "Giveaway Donations",
      value: `₹${donationStats.grandTotal.toLocaleString()}`,
      icon: FiHeart,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-500/10 to-pink-500/10",
      link: "/admin/giveaways",
      change: `${donationStats.grandCount} donors`,
      positive: true,
    },
  ];

  const quickActions = [
    { label: "Manage Blogs", href: "/admin/blogs", icon: FiFileText, color: "bg-blue-500" },
    { label: "Manage Users", href: "/admin/users", icon: FiUsers, color: "bg-green-500" },
    { label: "Settings", href: "/admin/settings", icon: FiActivity, color: "bg-purple-500" },
    { label: "Analytics", href: "/admin/analytics", icon: FiBarChart2, color: "bg-orange-500" },
  ];

  return (
    <>
      <Head>
        <title>Admin Dashboard - Luvrix</title>
        <link rel="icon" type="image/png" href="https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png" />
      </Head>
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminSidebar />

      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl md:text-4xl font-black text-white mb-2"
                >
                  Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-400"
                >
                  Welcome back! Here's what's happening with your platform.
                </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm">System Online</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card, index) => (
                  <Link key={index} href={card.link}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden relative"
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <card.icon className="w-7 h-7 text-white" />
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            card.positive 
                              ? "bg-green-100 text-green-700" 
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {card.positive ? <FiArrowUpRight className="w-3 h-3" /> : <FiAlertCircle className="w-3 h-3" />}
                            {card.change}
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mb-1">{card.title}</p>
                        <p className="text-3xl font-black text-slate-900">{card.value}</p>
                      </div>

                      {/* Hover Arrow */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiArrowRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-slate-100 flex items-center gap-3 cursor-pointer group"
                      >
                        <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-slate-900">{action.label}</span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Recent Blogs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <FiFileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Recent Blogs</h2>
                      <p className="text-sm text-slate-500">Latest submissions from authors</p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/blogs" 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                    View All
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {recentBlogs.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FiFileText className="w-5 h-5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-900 font-semibold truncate">{blog.title}</p>
                            <p className="text-sm text-slate-500">{blog.category || "Uncategorized"}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          blog.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : blog.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {blog.status === "approved" ? (
                            <FiCheckCircle className="w-3.5 h-3.5" />
                          ) : blog.status === "pending" ? (
                            <FiClock className="w-3.5 h-3.5" />
                          ) : (
                            <FiAlertCircle className="w-3.5 h-3.5" />
                          )}
                          {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiFileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No blogs yet</p>
                    <p className="text-sm text-slate-400">Blogs will appear here when authors submit them</p>
                  </div>
                )}
              </motion.div>

              {/* Giveaway Donation Breakdown */}
              {donationStats.perGiveaway.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8"
                >
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <FiHeart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Giveaway Donations</h2>
                        <p className="text-sm text-slate-500">Total: ₹{donationStats.grandTotal.toLocaleString()} from {donationStats.grandCount} supporters</p>
                      </div>
                    </div>
                    <Link
                      href="/admin/giveaways"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                    >
                      Manage
                      <FiArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {donationStats.perGiveaway.map((g, index) => (
                      <motion.div
                        key={g.giveawayId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {g.imageUrl ? (
                            <img src={g.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FiGift className="w-5 h-5 text-purple-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-slate-900 font-semibold truncate">{g.title}</p>
                            <p className="text-sm text-slate-500">{g.count} donation{g.count !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-lg font-bold text-rose-600">₹{g.total.toLocaleString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
