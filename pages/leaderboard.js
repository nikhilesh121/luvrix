import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getLeaderboardWithAllUsers } from "../lib/api-client";
import { motion } from "framer-motion";
import { FiAward, FiTrendingUp, FiEye, FiFileText, FiUser, FiStar, FiZap } from "react-icons/fi";
import Link from "next/link";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );
      const data = await Promise.race([getLeaderboardWithAllUsers(), timeoutPromise]);
      setLeaderboard(data || []);
    } catch (error) {
      console.error("Leaderboard error:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const _getRankStyle = (index) => {
    if (index === 0) return { bg: "from-yellow-400 to-amber-500", text: "text-amber-600", border: "border-yellow-200", cardBg: "from-yellow-50 to-amber-50" };
    if (index === 1) return { bg: "from-slate-300 to-slate-400", text: "text-slate-600", border: "border-slate-200", cardBg: "from-slate-50 to-gray-50" };
    if (index === 2) return { bg: "from-amber-600 to-orange-600", text: "text-orange-600", border: "border-orange-200", cardBg: "from-orange-50 to-amber-50" };
    return { bg: "from-purple-500 to-pink-500", text: "text-purple-600", border: "border-slate-100", cardBg: "" };
  };

  const totalUsers = leaderboard.length;
  const activeBloggers = leaderboard.filter(u => u.blogCount > 0).length;
  const totalBlogs = leaderboard.reduce((sum, u) => sum + u.blogCount, 0);
  const totalViews = leaderboard.reduce((sum, u) => sum + u.totalViews, 0);

  return (
    <Layout title="Leaderboard" description="Top bloggers on Luvrix based on views" canonical="https://luvrix.com/leaderboard/">
      {/* Hero Header */}
      <div className="relative bg-[#0a0a0f] overflow-hidden">
        <div className="absolute inset-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[100px]"
          />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30">
              <FiAward className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Community <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">Leaderboard</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              Top creators ranked by total blog views. Write great content and climb the ranks!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: totalUsers, icon: FiUser, color: "from-purple-500 to-pink-500" },
            { label: "Active Bloggers", value: activeBloggers, icon: FiFileText, color: "from-emerald-500 to-teal-500" },
            { label: "Total Blogs", value: totalBlogs, icon: FiStar, color: "from-blue-500 to-cyan-500" },
            { label: "Total Views", value: totalViews.toLocaleString(), icon: FiEye, color: "from-amber-500 to-orange-500" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 border border-slate-100"
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="mb-10">
            {/* Mobile: Vertical Stack */}
            <div className="flex md:hidden flex-col items-center gap-4">
              {/* 1st Place - Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-[280px]"
              >
                <div className="bg-gradient-to-b from-yellow-50 to-amber-100 rounded-2xl p-5 text-center border-2 border-yellow-300 relative shadow-xl shadow-yellow-200/50">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">👑</div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 p-1 shadow-lg shadow-yellow-500/30 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {leaderboard[0]?.photo ? (
                          <img src={leaderboard[0].photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-amber-600">{leaderboard[0]?.name?.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <Link href={`/user/${leaderboard[0]?.id}`}>
                        <h3 className="font-black text-amber-800 truncate hover:text-amber-600 cursor-pointer transition-colors">{leaderboard[0]?.name}</h3>
                      </Link>
                      <p className="text-amber-600 text-sm flex items-center gap-1 font-semibold">
                        <FiEye className="w-4 h-4" /> {leaderboard[0]?.totalViews?.toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-3xl font-black text-amber-500">#1</div>
                  </div>
                </div>
              </motion.div>

              {/* 2nd Place - Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-[280px]"
              >
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-5 text-center border-2 border-slate-200 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 p-1 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {leaderboard[1]?.photo ? (
                          <img src={leaderboard[1].photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-slate-600">{leaderboard[1]?.name?.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <Link href={`/user/${leaderboard[1]?.id}`}>
                        <h3 className="font-bold text-slate-800 truncate hover:text-primary cursor-pointer transition-colors">{leaderboard[1]?.name}</h3>
                      </Link>
                      <p className="text-slate-500 text-sm flex items-center gap-1">
                        <FiEye className="w-4 h-4" /> {leaderboard[1]?.totalViews?.toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-2xl font-black text-slate-400">#2</div>
                  </div>
                </div>
              </motion.div>

              {/* 3rd Place - Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-[280px]"
              >
                <div className="bg-gradient-to-b from-orange-50 to-amber-100 rounded-2xl p-5 text-center border-2 border-orange-200 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 p-1 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {leaderboard[2]?.photo ? (
                          <img src={leaderboard[2].photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-orange-600">{leaderboard[2]?.name?.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <Link href={`/user/${leaderboard[2]?.id}`}>
                        <h3 className="font-bold text-slate-800 truncate hover:text-primary cursor-pointer transition-colors">{leaderboard[2]?.name}</h3>
                      </Link>
                      <p className="text-slate-500 text-sm flex items-center gap-1">
                        <FiEye className="w-4 h-4" /> {leaderboard[2]?.totalViews?.toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-2xl font-black text-orange-400">#3</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Desktop: Horizontal Podium */}
            <div className="hidden md:flex items-center justify-center gap-4 md:gap-8">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 max-w-[200px]"
              >
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-6 text-center border-2 border-slate-200 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">🥈</div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 p-1 mx-auto mt-4 mb-3">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {leaderboard[1]?.photo ? (
                        <img src={leaderboard[1].photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-slate-600">{leaderboard[1]?.name?.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/user/${leaderboard[1]?.id}`}>
                    <h3 className="font-bold text-slate-800 truncate hover:text-primary cursor-pointer transition-colors">{leaderboard[1]?.name}</h3>
                  </Link>
                  <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mt-1">
                    <FiEye className="w-4 h-4" /> {leaderboard[1]?.totalViews?.toLocaleString()}
                  </p>
                </div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 max-w-[220px] -mt-8"
              >
                <div className="bg-gradient-to-b from-yellow-50 to-amber-100 rounded-2xl p-6 text-center border-2 border-yellow-300 relative shadow-xl shadow-yellow-200/50">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-5xl">👑</div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 p-1 mx-auto mt-4 mb-3 shadow-lg shadow-yellow-500/30">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {leaderboard[0]?.photo ? (
                        <img src={leaderboard[0].photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-amber-600">{leaderboard[0]?.name?.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/user/${leaderboard[0]?.id}`}>
                    <h3 className="font-black text-lg text-amber-800 truncate hover:text-amber-600 cursor-pointer transition-colors">{leaderboard[0]?.name}</h3>
                  </Link>
                  <p className="text-amber-600 text-sm flex items-center justify-center gap-1 mt-1 font-semibold">
                    <FiEye className="w-4 h-4" /> {leaderboard[0]?.totalViews?.toLocaleString()}
                  </p>
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1 max-w-[200px]"
              >
                <div className="bg-gradient-to-b from-orange-50 to-amber-100 rounded-2xl p-6 text-center border-2 border-orange-200 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">🥉</div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 p-1 mx-auto mt-4 mb-3">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {leaderboard[2]?.photo ? (
                        <img src={leaderboard[2].photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-orange-600">{leaderboard[2]?.name?.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/user/${leaderboard[2]?.id}`}>
                    <h3 className="font-bold text-slate-800 truncate hover:text-primary cursor-pointer transition-colors">{leaderboard[2]?.name}</h3>
                  </Link>
                  <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mt-1">
                    <FiEye className="w-4 h-4" /> {leaderboard[2]?.totalViews?.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Users Yet</h3>
            <p className="text-slate-500 mb-6">Be the first to register and start blogging!</p>
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              <FiZap className="w-5 h-5" /> Get Started
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-purple-500" />
                All Rankings
              </h2>
              <span className="text-sm text-slate-500">{leaderboard.length} users</span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {leaderboard.slice(3).map((user, index) => {
                const actualRank = index + 4;
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {actualRank}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border-2 border-slate-200">
                      {user.photo ? (
                        <img src={user.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{user.name?.charAt(0) || "?"}</span>
                      )}
                    </div>
                    <Link href={`/user/${user.id}`} className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate hover:text-primary cursor-pointer transition-colors">{user.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{user.userId}</p>
                    </Link>
                    <div className="text-center px-4">
                      <p className="text-lg font-bold text-purple-600">{user.blogCount}</p>
                      <p className="text-xs text-slate-400">blogs</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
                      <FiEye className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-purple-600">{user.totalViews.toLocaleString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl"
        >
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <FiZap className="w-5 h-5" /> How to Climb the Rankings
          </h3>
          <p className="text-purple-700 text-sm leading-relaxed">
            Users are ranked by total views across all published blogs. Write engaging content, share your posts, 
            and build your audience to climb the leaderboard! Views are counted once per device per blog per day.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}

// SSR required for SEO meta tags to be rendered server-side
export async function getServerSideProps() {
  return { props: {} };
}
