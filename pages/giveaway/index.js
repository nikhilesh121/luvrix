import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";
import GiveawayCard from "../../components/GiveawayCard";
import { FiGift, FiAward, FiArrowRight, FiStar, FiClock } from "react-icons/fi";
import { motion, useScroll, useTransform } from "framer-motion";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const fadeScale = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            background: `rgba(${150 + Math.random() * 105}, ${100 + Math.random() * 100}, 255, ${0.15 + Math.random() * 0.2})`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 3 }}
        />
      ))}
    </div>
  );
}

export default function GiveawayListPage() {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("live");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetch("/api/giveaways").then(r => r.json());
        const list = Array.isArray(data) ? data : [];

        const withWinner = list.filter(g => g.status === "winner_selected" && g.id);
        const winnerPromises = withWinner.map(g =>
          fetch(`/api/giveaways/${g.id}/winner-info`).then(r => r.json()).catch(() => null)
        );
        const winnerResults = await Promise.all(winnerPromises);
        const winnerMap = {};
        withWinner.forEach((g, i) => { if (winnerResults[i]?.name) winnerMap[g.id] = winnerResults[i].name; });

        setGiveaways(list.map(g => ({ ...g, winnerName: winnerMap[g.id] || null })));
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const active = giveaways.filter(g => g.status === "active" && (!g.startDate || new Date(g.startDate) <= now));
  const upcoming = giveaways.filter(g =>
    (g.status === "active" && g.startDate && new Date(g.startDate) > now) ||
    (g.status === "draft" && g.startDate && new Date(g.startDate) > now)
  );
  const winners = giveaways.filter(g => g.status === "winner_selected" && g.winnerName);
  const ended = giveaways.filter(g => g.status === "ended" || g.status === "winner_selected");

  const tabs = [
    { id: "live", label: "Live", count: active.length, color: "green" },
    { id: "upcoming", label: "Upcoming", count: upcoming.length, color: "blue" },
    { id: "completed", label: "Completed", count: ended.length, color: "purple" },
  ];

  return (
    <Layout title="Giveaways" description="Join free giveaways on Luvrix. Complete tasks, earn eligibility, and win physical prizes!" canonical={`${SITE_URL}/giveaway/`}>
      <Head>
        <meta name="keywords" content="free giveaways, win prizes, luvrix giveaway, online contests" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Animated Dark Hero */}
        <div ref={heroRef} className="relative overflow-hidden py-20 sm:py-32 px-4">
          {/* Gradient mesh background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-[#0a0a0f] to-pink-950/40" />
            <motion.div
              className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[120px]"
              animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-600/8 blur-[100px]"
              animate={{ scale: [1, 1.15, 1], y: [0, -25, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            <motion.div
              className="absolute top-1/3 right-[10%] w-[200px] h-[200px] rounded-full bg-blue-600/6 blur-[80px]"
              animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>
          <FloatingParticles />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/30 relative"
              >
                <FiGift className="w-10 h-10 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight"
              >
                Win Amazing{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  Prizes
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-400 max-w-2xl mx-auto mb-8"
              >
                Join for free, complete tasks, and win real physical prizes. No purchase required.
              </motion.p>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-6 flex-wrap"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-300">{active.length} Active</span>
                </div>
                {winners.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                    <FiAward className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm text-gray-300">{winners.length} Winners</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <FiStar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-sm text-gray-300">100% Free</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-20 relative z-10">
          {/* Tab Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-2 mb-10 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-1.5 border border-white/5"
          >
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === t.id
                    ? "bg-white/10 text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}
              >
                {t.id === "live" && <span className={`w-2 h-2 rounded-full ${activeTab === t.id ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />}
                {t.id === "upcoming" && <FiClock className={`w-3.5 h-3.5 ${activeTab === t.id ? "text-blue-400" : ""}`} />}
                {t.id === "completed" && <FiAward className={`w-3.5 h-3.5 ${activeTab === t.id ? "text-purple-400" : ""}`} />}
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === t.id ? "bg-white/10 text-white" : "bg-white/5 text-gray-500"
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-2xl h-72 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <>
              {/* Live Tab */}
              {activeTab === "live" && (
                <section className="mb-16">
                  {active.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-sm">
                      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                        <FiGift className="w-16 h-16 text-purple-500/40 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-400 text-lg font-medium mb-1">No live giveaways right now</p>
                      <p className="text-gray-600 text-sm">Check back soon for exciting prizes!</p>
                    </motion.div>
                  ) : (
                    <motion.div variants={stagger} initial="hidden" animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {active.map(g => (
                        <motion.div key={g.id} variants={fadeUp}>
                          <GiveawayCard giveaway={g} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              )}

              {/* Upcoming Tab */}
              {activeTab === "upcoming" && (
                <section className="mb-16">
                  {upcoming.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-sm">
                      <FiClock className="w-16 h-16 text-blue-500/30 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg font-medium mb-1">No upcoming giveaways</p>
                      <p className="text-gray-600 text-sm">New giveaways will appear here before they go live</p>
                    </motion.div>
                  ) : (
                    <motion.div variants={stagger} initial="hidden" animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcoming.map(g => (
                        <motion.div key={g.id} variants={fadeUp}>
                          <GiveawayCard giveaway={g} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              )}

              {/* Completed Tab */}
              {activeTab === "completed" && (
                <section className="mb-16">
                  {ended.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-sm">
                      <FiAward className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg font-medium mb-1">No completed giveaways yet</p>
                      <p className="text-gray-600 text-sm">Completed giveaways and their winners will appear here</p>
                    </motion.div>
                  ) : (
                    <motion.div variants={stagger} initial="hidden" animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ended.map(g => (
                        <motion.div key={g.id} variants={fadeUp}>
                          <GiveawayCard giveaway={g} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              )}
            </>
          )}

          {/* Winners Hall — View All Winners */}
          {winners.length > 0 && (
            <section id="winners" className="mb-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-8"
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FiAward className="w-6 h-6 text-yellow-400" />
                  Winners Hall
                </h2>
                <span className="text-sm text-gray-500">{winners.length} winner{winners.length > 1 ? "s" : ""}</span>
              </motion.div>

              <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {winners.map((g, _i) => (
                  <motion.div key={g.id} variants={fadeScale}>
                    <Link href={`/giveaway/${g.slug}`}
                      className="group block relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative p-5 flex items-center gap-4">
                        {g.imageUrl && (
                          <div className="relative flex-shrink-0">
                            <img src={g.imageUrl} alt={g.title} className="w-16 h-16 rounded-xl object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                              <FiAward className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition mb-1">{g.title}</p>
                          <span className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                            Won by {g.winnerName}
                          </span>
                        </div>
                        <FiArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Legal Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center text-xs text-gray-600 max-w-xl mx-auto border-t border-white/5 pt-8"
          >
            <p>
              Joining is free. Completing required tasks is mandatory for eligibility.
              Supporting Luvrix does not affect chances of winning.{" "}
              <Link href="/giveaway-terms" className="underline text-gray-500 hover:text-gray-300 transition">Read full terms</Link>
            </p>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </Layout>
  );
}
