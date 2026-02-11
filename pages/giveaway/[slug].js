import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";
import { useCountdown } from "../../components/GiveawayCard";
import ConfettiWinner from "../../components/ConfettiWinner";
import AnimatedCTA from "../../components/AnimatedCTA";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
  FiGift, FiClock, FiUsers, FiCheck, FiCheckCircle,
  FiArrowLeft, FiCopy, FiAward, FiTarget, FiShield,
  FiAlertCircle, FiHeart, FiSend, FiMapPin, FiPhone, FiUser,
  FiExternalLink, FiDollarSign,
} from "react-icons/fi";
import { initiatePayment } from "../../lib/api-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function GiveawayDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isLoggedIn } = useAuth();

  const [giveaway, setGiveaway] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Shipping form state (for winners)
  const [showShipping, setShowShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({ fullName: "", address: "", city: "", state: "", pincode: "", country: "India", phone: "" });
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);

  // Support payment state
  const [supportAmount, setSupportAmount] = useState(100);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Donors / support data
  const [supportData, setSupportData] = useState({ total: 0, count: 0, supporters: [] });

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const encodedSlug = encodeURIComponent(slug);
    setLoading(true);
    try {
      const [gRes, tRes, cRes] = await Promise.all([
        fetch(`/api/giveaways/${encodedSlug}`).then(r => r.ok ? r.json() : r.json().then(e => ({ error: e.error || "Not found" }))).catch(() => ({ error: "Network error" })),
        fetch(`/api/giveaways/${encodedSlug}/tasks`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`/api/giveaways/${encodedSlug}/participants?countOnly=true`).then(r => r.ok ? r.json() : { count: 0 }).catch(() => ({ count: 0 })),
      ]);
      if (gRes.error) { setError(gRes.error); setLoading(false); return; }
      setGiveaway(gRes);
      setTasks(Array.isArray(tRes) ? tRes : []);
      setParticipantCount(cRes?.count || 0);

      // Fetch winner info if winner selected
      if (gRes.status === "winner_selected" && gRes.id) {
        fetch(`/api/giveaways/${encodeURIComponent(gRes.id)}/winner-info`).then(r => r.ok ? r.json() : null).then(w => { if (w) setWinnerInfo(w); }).catch(() => {});
      }

      // Fetch support/donation data
      fetch(`/api/giveaways/${encodedSlug}/support`).then(r => r.ok ? r.json() : null).then(d => {
        if (d && !d.error) setSupportData(d);
      }).catch(() => {});
    } catch (err) {
      setError("Failed to load giveaway");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchMyStatus = useCallback(async () => {
    if (!slug || !isLoggedIn) return;
    try {
      const token = localStorage.getItem("luvrix_auth_token");
      if (!token) return;
      const res = await fetch(`/api/giveaways/${encodeURIComponent(slug)}/my-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyStatus(data);
    } catch (err) { console.error(err); }
  }, [slug, isLoggedIn]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchMyStatus(); }, [fetchMyStatus]);

  // Fetch existing shipping details if winner
  useEffect(() => {
    if (!giveaway || !isLoggedIn || !myStatus) return;
    const isWinner = giveaway.status === "winner_selected" && myStatus?.status === "winner";
    if (!isWinner) return;
    const token = localStorage.getItem("luvrix_auth_token");
    if (!token) return;
    fetch(`/api/giveaways/${giveaway.id}/shipping`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.shipping) {
        setShippingForm({
          fullName: d.shipping.fullName || "",
          address: d.shipping.address || "",
          city: d.shipping.city || "",
          state: d.shipping.state || "",
          pincode: d.shipping.pincode || "",
          country: d.shipping.country || "India",
          phone: d.shipping.phone || "",
        });
        setShippingSaved(true);
      }
    }).catch(() => {});
  }, [giveaway, isLoggedIn, myStatus]);

  const handleJoin = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setJoining(true);
    setError("");
    try {
      const token = localStorage.getItem("luvrix_auth_token");
      const res = await fetch(`/api/giveaways/${giveaway.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchMyStatus();
      setParticipantCount(c => c + 1);
    } catch (err) {
      setError(err.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompleting(taskId);
    try {
      const token = localStorage.getItem("luvrix_auth_token");
      const res = await fetch(`/api/giveaways/${giveaway.id}/complete-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchMyStatus();
    } catch (err) {
      alert(err.message || "Failed to complete task");
    } finally {
      setCompleting(null);
    }
  };

  const copyInviteLink = () => {
    if (!myStatus?.inviteCode) return;
    const link = `${SITE_URL}/giveaway/${giveaway.slug}?ref=${myStatus.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShippingSubmit = async () => {
    const { fullName, address, city, state, pincode, country, phone } = shippingForm;
    if (!fullName || !address || !city || !state || !pincode || !country || !phone) {
      alert("All fields are required"); return;
    }
    setShippingSaving(true);
    try {
      const token = localStorage.getItem("luvrix_auth_token");
      const res = await fetch(`/api/giveaways/${giveaway.id}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(shippingForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShippingSaved(true);
      setShowShipping(false);
    } catch (err) {
      alert(err.message || "Failed to save shipping details");
    } finally {
      setShippingSaving(false);
    }
  };

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!giveaway || !isLoggedIn || !user) return;
    fetch(`/api/favorites/check?userId=${user.uid}&itemId=${giveaway.id}&itemType=giveaway`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setIsFavorited(d.favorited); })
      .catch(() => {});
  }, [giveaway, isLoggedIn, user]);

  const toggleFavorite = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setFavLoading(true);
    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, itemId: giveaway.id, itemType: "giveaway" }),
      });
      const data = await res.json();
      if (res.ok) setIsFavorited(data.favorited);
    } catch (err) { console.error(err); }
    finally { setFavLoading(false); }
  };

  const handleSupportPayment = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!supportAmount || supportAmount < 1) { setSupportError("Please enter a valid amount"); return; }
    setSupportLoading(true);
    setSupportError("");
    try {
      const token = localStorage.getItem("luvrix_auth_token");

      // Record donation info (name/email/anonymous) before redirecting to PayU
      await fetch(`/api/giveaways/${encodeURIComponent(giveaway.slug)}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: supportAmount,
          donorName: donorName || user?.displayName || user?.name || "",
          donorEmail: donorEmail || user?.email || "",
          isAnonymous,
        }),
      });

      const response = await initiatePayment({
        amount: supportAmount.toString(),
        productInfo: `Giveaway Support: ${giveaway.title}`,
        firstName: donorName || user?.displayName || user?.name || "Supporter",
        email: donorEmail || user?.email,
        phone: "9999999999",
        userId: user?.uid,
        posts: 0,
      });
      if (!response.success) throw new Error(response.error || "Failed to initiate payment");

      // Create and submit PayU form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = response.payuUrl;
      const params = {
        key: response.key, txnid: response.txnId,
        amount: supportAmount.toString(),
        productinfo: `Giveaway Support: ${giveaway.title}`,
        firstname: user?.displayName || user?.name || "Supporter",
        email: user?.email, phone: "9999999999",
        surl: response.surl, furl: response.furl, hash: response.hash,
      };
      Object.entries(params).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = k; input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setSupportError(err.message || "Payment failed");
      setSupportLoading(false);
    }
  };

  const countdown = useCountdown(giveaway?.endDate);
  const progressPercent = giveaway?.targetParticipants
    ? Math.min(100, Math.round((participantCount / giveaway.targetParticipants) * 100))
    : 0;

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="w-14 h-14 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading giveaway...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (error || !giveaway) {
    return (
      <Layout title="Giveaway Not Found">
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <FiGift className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Giveaway Not Found</h1>
            <p className="text-gray-500 mb-6">{error || "This giveaway doesn't exist."}</p>
            <Link href="/giveaway" className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition">
              View All Giveaways
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const isUnlimited = giveaway.maxExtensions === -1;
  const isActive = giveaway.status === "active" && (!countdown.ended || isUnlimited);
  const hasWinner = giveaway.status === "winner_selected";
  const isWinner = myStatus?.status === "winner";

  // Determine CTA variant
  const ctaVariant = !myStatus?.joined ? "join"
    : myStatus.status === "winner" ? "winner"
    : myStatus.status === "eligible" ? "eligible"
    : "joined";

  const ctaText = !myStatus?.joined ? (joining ? "Joining..." : "Join Giveaway")
    : myStatus.status === "winner" ? "🎉 You Won!"
    : myStatus.status === "eligible" ? "✓ Eligible for Winning"
    : "Joined — Complete tasks to be eligible";

  return (
    <Layout title={giveaway.title} description={giveaway.prizeDetails}>
      <Head>
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/giveaway/${giveaway.slug}`} />
        <meta property="og:title" content={giveaway.title} />
        <meta property="og:description" content={giveaway.prizeDetails || giveaway.description} />
        <meta property="og:image" content={giveaway.imageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/giveaway/${giveaway.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={giveaway.title} />
        <meta name="twitter:image" content={giveaway.imageUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": giveaway.title,
          "description": giveaway.prizeDetails || giveaway.description,
          "image": giveaway.imageUrl,
          "startDate": giveaway.startDate,
          "endDate": giveaway.endDate,
          "eventStatus": hasWinner ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
          "location": { "@type": "VirtualLocation", "url": `${SITE_URL}/giveaway/${giveaway.slug}` },
          "organizer": { "@type": "Organization", "name": "Luvrix", "url": SITE_URL },
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR", "availability": isActive ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
        }) }} />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Animated Hero */}
        <div className="relative h-72 sm:h-80 lg:h-[420px] overflow-hidden">
          <motion.img
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={giveaway.imageUrl} alt={giveaway.title} className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/60 to-black/20" />

          {/* Animated gradient orbs */}
          <motion.div
            className="absolute top-10 right-[10%] w-32 h-32 rounded-full bg-purple-500/10 blur-[60px]"
            animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-20 left-[5%] w-24 h-24 rounded-full bg-pink-500/10 blur-[50px]"
            animate={{ y: [0, 15, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* Ended / Winner overlay effect */}
          {hasWinner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent"
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute bottom-0 left-0 right-0 p-6 sm:p-10"
          >
            <div className="max-w-4xl mx-auto">
              <Link href="/giveaway" className="text-white/60 text-sm hover:text-white transition mb-3 inline-flex items-center gap-1.5 backdrop-blur-sm bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <FiArrowLeft className="w-3.5 h-3.5" /> All Giveaways
              </Link>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-3 drop-shadow-lg tracking-tight">{giveaway.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {isActive && (
                  <span className="relative bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30">
                    <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30" />
                    <span className="relative">LIVE</span>
                  </span>
                )}
                {hasWinner && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-purple-500/30"
                  >
                    <FiAward className="w-3.5 h-3.5" /> WINNER ANNOUNCED
                  </motion.span>
                )}
                {countdown.ended && !hasWinner && !isUnlimited && <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30">ENDED</span>}
                {isUnlimited && !hasWinner && countdown.ended && (
                  <span className="bg-purple-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-purple-500/30 flex items-center gap-1">♾ OPEN</span>
                )}

                {/* View All Winners button */}
                <Link href="/giveaway#winners"
                  className="text-white/70 text-xs font-medium hover:text-white transition flex items-center gap-1.5 backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20">
                  <FiAward className="w-3 h-3" /> View All Winners
                </Link>

                {/* Favorite button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition backdrop-blur-sm border ${
                    isFavorited
                      ? "bg-pink-500/20 border-pink-500/30 text-pink-300"
                      : "bg-white/10 border-white/10 text-white/70 hover:text-white hover:border-white/20"
                  }`}
                >
                  <FiHeart className={`w-3 h-3 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Saved" : "Save"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-20">
          {/* Winner Announcement Banner — Stunning */}
          {hasWinner && winnerInfo?.name && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mb-6 relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 animate-[shimmer_3s_linear_infinite] bg-[length:200%_auto]" />
              <div className="relative m-[2px] bg-[#0e0e18] rounded-[14px] p-5">
                <ConfettiWinner winnerName={winnerInfo.name} winnerPhoto={winnerInfo.photoURL} show={hasWinner} />
              </div>
            </motion.div>
          )}

          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prize */}
              <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                <h2 className="font-bold text-white mb-3 flex items-center gap-2">
                  <FiGift className="text-purple-400" /> Prize
                </h2>
                <p className="text-gray-300">{giveaway.prizeDetails || "Physical prize to be announced!"}</p>
              </motion.div>

              {/* Description */}
              {giveaway.description && (
                <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                  <h2 className="font-bold text-white mb-3">About This Giveaway</h2>
                  <p className="text-gray-400 whitespace-pre-line">{giveaway.description}</p>
                </motion.div>
              )}

              {/* Tasks Section */}
              {tasks.length > 0 && (
                <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                  <h2 className="font-bold text-white mb-1 flex items-center gap-2">
                    <FiTarget className="text-blue-400" /> Tasks
                  </h2>
                  <p className="text-xs text-gray-500 mb-1">Complete tasks to earn points and become eligible</p>
                  {myStatus?.joined && (
                    <p className="text-xs text-purple-400 mb-4">Your points: <strong className="text-white">{myStatus.points || 0}</strong> {giveaway.requiredPoints ? `/ ${giveaway.requiredPoints} required` : ""}</p>
                  )}
                  <div className="space-y-3">
                    {tasks.map((task, i) => {
                      const isCompleted = myStatus?.completedTasks?.includes(task.id);
                      const taskIcon = {
                        facebook_like: "📘", facebook_follow: "📘",
                        instagram_follow: "📸",
                        youtube_like: "🎬", youtube_subscribe: "🎬",
                        twitter_follow: "🐦", twitter_like: "🐦",
                        visit_website: "🌐", join_telegram: "✈️", join_discord: "💬",
                        share_post: "🔗", invite: "👥", quiz: "❓",
                      }[task.type] || "⚡";
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center justify-between p-4 rounded-xl transition ${isCompleted ? "bg-green-900/20 border border-green-500/20" : "bg-white/[0.03] border border-white/5"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${isCompleted ? "bg-green-500/20" : "bg-purple-500/20"}`}>
                              {isCompleted ? <FiCheck className="w-4 h-4 text-green-400" /> : taskIcon}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${isCompleted ? "text-green-400 line-through" : "text-gray-200"}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">+{task.points} pts {task.required && "· Required"}</span>
                                {task.description && <span className="text-xs text-gray-600">· {task.description}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.metadata?.url && !isCompleted && (
                              <a href={task.metadata.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 bg-white/5 text-blue-400 rounded-lg hover:bg-white/10 transition border border-white/10 flex items-center gap-1">
                                <FiExternalLink className="w-3 h-3" /> Visit
                              </a>
                            )}
                            {myStatus?.joined && !isCompleted && isActive && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCompleteTask(task.id)} disabled={completing === task.id}
                                className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
                                {completing === task.id ? "..." : "Done ✓"}
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Invite Section */}
              {myStatus?.joined && giveaway.invitePointsEnabled && (
                <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                  <h2 className="font-bold text-white mb-3 flex items-center gap-2">
                    <FiUsers className="text-blue-400" /> Invite Friends
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Earn {giveaway.invitePointsPerReferral || 1} point(s) per invite. You have invited <strong className="text-white">{myStatus.inviteCount || 0}</strong> friends.
                  </p>
                  <div className="flex items-center gap-2">
                    <input type="text" readOnly
                      value={`${SITE_URL}/giveaway/${giveaway.slug}?ref=${myStatus.inviteCode}`}
                      className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400" />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyInviteLink}
                      className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-1.5 text-sm font-medium">
                      {copied ? <><FiCheck className="w-4 h-4" /> Copied</> : <><FiCopy className="w-4 h-4" /> Copy</>}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Winner Shipping Form */}
              {isWinner && (
                <motion.div variants={fadeUp}
                  className={`rounded-2xl p-6 border ${shippingSaved && !showShipping ? "bg-green-900/20 border-green-500/20" : "bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-purple-500/20"}`}>

                  {/* Already submitted — show summary + edit button */}
                  {shippingSaved && !showShipping && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-green-300 flex items-center gap-2">
                          <FiCheckCircle className="w-5 h-5" /> Shipping Details Submitted
                        </h2>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setShowShipping(true)}
                          className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition font-medium">
                          Edit Details
                        </motion.button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-400">Name: <span className="text-white">{shippingForm.fullName}</span></p>
                        <p className="text-gray-400">Phone: <span className="text-white">{shippingForm.phone}</span></p>
                        <p className="text-gray-400 col-span-2">Address: <span className="text-white">{shippingForm.address}, {shippingForm.city}, {shippingForm.state} — {shippingForm.pincode}, {shippingForm.country}</span></p>
                      </div>
                      <p className="text-xs text-green-400/70 mt-3">We will ship your prize soon. Check your email for updates.</p>
                    </>
                  )}

                  {/* Not yet submitted — show prompt */}
                  {!shippingSaved && !showShipping && (
                    <>
                      <h2 className="font-bold text-white mb-2 flex items-center gap-2">
                        <FiMapPin className="text-purple-400" /> Claim Your Prize
                      </h2>
                      <p className="text-sm text-gray-400 mb-4">Please provide your shipping details to receive your prize.</p>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowShipping(true)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-2">
                        <FiSend className="w-4 h-4" /> Submit Shipping Details
                      </motion.button>
                    </>
                  )}

                  {/* Form — shown for both new submit and edit */}
                  {showShipping && (
                    <>
                      <h2 className="font-bold text-white mb-2 flex items-center gap-2">
                        <FiMapPin className="text-purple-400" /> {shippingSaved ? "Edit Shipping Details" : "Claim Your Prize"}
                      </h2>
                      <p className="text-sm text-gray-400 mb-4">{shippingSaved ? "Update your shipping address below." : "Please provide your shipping details to receive your prize."}</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-400 mb-1 block"><FiUser className="inline w-3 h-3 mr-1" />Full Name</label>
                            <input type="text" value={shippingForm.fullName} onChange={e => setShippingForm(f => ({ ...f, fullName: e.target.value }))}
                              className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-400 mb-1 block"><FiPhone className="inline w-3 h-3 mr-1" />Phone</label>
                            <input type="tel" value={shippingForm.phone} onChange={e => setShippingForm(f => ({ ...f, phone: e.target.value }))}
                              className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1 block">Address</label>
                          <textarea value={shippingForm.address} onChange={e => setShippingForm(f => ({ ...f, address: e.target.value }))}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <input type="text" placeholder="City" value={shippingForm.city} onChange={e => setShippingForm(f => ({ ...f, city: e.target.value }))}
                            className="px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white placeholder-gray-600" />
                          <input type="text" placeholder="State" value={shippingForm.state} onChange={e => setShippingForm(f => ({ ...f, state: e.target.value }))}
                            className="px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white placeholder-gray-600" />
                          <input type="text" placeholder="Pincode" value={shippingForm.pincode} onChange={e => setShippingForm(f => ({ ...f, pincode: e.target.value }))}
                            className="px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white placeholder-gray-600" />
                          <input type="text" placeholder="Country" value={shippingForm.country} onChange={e => setShippingForm(f => ({ ...f, country: e.target.value }))}
                            className="px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white placeholder-gray-600" />
                        </div>
                        <p className="text-xs text-gray-500">Your details will be stored securely and used only for courier delivery.</p>
                        <div className="flex gap-2">
                          <motion.button whileTap={{ scale: 0.98 }} onClick={handleShippingSubmit} disabled={shippingSaving}
                            className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                            {shippingSaving ? "Saving..." : shippingSaved ? "Update" : "Submit"}
                          </motion.button>
                          <button onClick={() => setShowShipping(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Sponsor Banners */}
              {giveaway.sponsors?.length > 0 && (
                <motion.div variants={fadeUp} className="space-y-3">
                  {giveaway.sponsors.map((sp, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-white/5">
                      {sp.redirectUrl ? (
                        <a href={sp.redirectUrl} target="_blank" rel="noopener noreferrer" className="block group">
                          <img src={sp.bannerUrl} alt={sp.name || "Sponsor"} className="w-full h-auto object-cover group-hover:opacity-90 transition" />
                          {sp.name && (
                            <div className="px-4 py-2 bg-white/[0.03] text-xs text-gray-500 flex items-center justify-between">
                              <span>Sponsored by <strong className="text-gray-300">{sp.name}</strong></span>
                              <FiExternalLink className="w-3 h-3" />
                            </div>
                          )}
                        </a>
                      ) : (
                        <div>
                          <img src={sp.bannerUrl} alt={sp.name || "Sponsor"} className="w-full h-auto object-cover" />
                          {sp.name && (
                            <div className="px-4 py-2 bg-white/[0.03] text-xs text-gray-500">
                              Sponsored by <strong className="text-gray-300">{sp.name}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Donors List + Total Donation */}
              {supportData.count > 0 && (
                <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white flex items-center gap-2">
                      <FiDollarSign className="text-green-400" /> Supporters
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{supportData.count} donation{supportData.count !== 1 ? "s" : ""}</span>
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-bold rounded-full">
                        ₹{supportData.total?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {supportData.supporters?.slice(0, 20).map((s, i) => (
                      <motion.div
                        key={s.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition"
                      >
                        <div className="flex items-center gap-3">
                          {s.userPhoto ? (
                            <img src={s.userPhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <FiHeart className="w-3 h-3 text-purple-400" />
                            </div>
                          )}
                          <span className="text-sm text-gray-300">{s.userName}</span>
                        </div>
                        <span className="text-sm font-semibold text-green-400">₹{s.amount}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Support Section (ISOLATED — PayU Direct Payment) */}
              <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border-2 border-dashed border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <FiHeart className="w-5 h-5 text-pink-400" />
                  <h2 className="font-bold text-white">Support This Giveaway</h2>
                </div>
                <p className="text-sm text-gray-400 mb-3">Help us organize more giveaways for the community!</p>
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 mb-4">
                  <strong>Note:</strong> Supporting Luvrix is optional and does <strong>not</strong> affect eligibility or winning chances.
                </div>

                {/* Donor Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Your Name (optional)</label>
                    <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)}
                      placeholder={user?.displayName || user?.name || "Your name"}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email (optional)</label>
                    <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)}
                      placeholder={user?.email || "your@email.com"}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-white/5 text-white placeholder-gray-600" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30" />
                  <span className="text-xs text-gray-400">Show as Anonymous publicly</span>
                </label>

                {/* Preset amounts */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[50, 100, 200, 500].map(amt => (
                    <motion.button key={amt} whileTap={{ scale: 0.95 }}
                      onClick={() => setSupportAmount(amt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                        supportAmount === amt
                          ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20"
                          : "bg-white/5 text-gray-300 border-white/10 hover:border-pink-500/30"
                      }`}>
                      ₹{amt}
                    </motion.button>
                  ))}
                </div>

                {/* Manual amount input */}
                <div className="flex gap-2 items-center mb-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                    <input type="number" min={1} value={supportAmount}
                      onChange={e => setSupportAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none"
                      placeholder="Enter amount" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSupportPayment}
                    disabled={supportLoading || !supportAmount}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold text-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-pink-500/20">
                    {supportLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : (
                      <><FiHeart className="w-4 h-4" /> Support ₹{supportAmount || 0}</>
                    )}
                  </motion.button>
                </div>
                {supportError && <p className="text-xs text-red-400 mb-1">{supportError}</p>}
                <p className="text-[10px] text-gray-600">Secured by PayU. You will be redirected to complete payment.</p>
              </motion.div>

              {/* Legal Notice */}
              <motion.div variants={fadeUp} className="bg-blue-900/10 border border-blue-500/10 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <FiShield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300 mb-1">Fairness Guarantee</p>
                    <p className="text-xs text-blue-400/70">
                      Joining is free. Completing required tasks is mandatory for eligibility.
                      Supporting Luvrix does not affect chances of winning.
                      Winners are selected randomly from eligible participants.{" "}
                      <Link href="/giveaway-terms" className="underline text-blue-400 hover:text-blue-300">Read full terms</Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Countdown */}
              <motion.div variants={fadeUp} className="relative bg-[#12121a] rounded-2xl p-6 border border-white/5 overflow-hidden">
                {/* Animated glow behind timer */}
                {((!countdown.ended || isUnlimited) && !hasWinner) && (
                  <motion.div
                    animate={{ opacity: [0.15, 0.3, 0.15] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl pointer-events-none"
                  />
                )}
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    {hasWinner ? "Completed" : (countdown.ended && !isUnlimited) ? "Ended" : isUnlimited && countdown.ended ? "Open-Ended" : "Time Left"}
                    {((!countdown.ended || isUnlimited) && !hasWinner) && (
                      <motion.span
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-green-400 rounded-full ml-auto"
                      />
                    )}
                  </h3>
                  {isUnlimited && countdown.ended && !hasWinner ? (
                    <div className="text-center py-4">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2"
                      >
                        ♾
                      </motion.div>
                      <p className="text-sm font-semibold text-purple-300">No Time Limit</p>
                      <p className="text-xs text-gray-500 mt-1">Open until all participants join</p>
                    </div>
                  ) : !countdown.ended && !hasWinner ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { value: countdown.days, label: "Days", color: "from-purple-500/20 to-purple-600/10" },
                        { value: countdown.hours, label: "Hours", color: "from-blue-500/20 to-blue-600/10" },
                        { value: countdown.minutes, label: "Min", color: "from-pink-500/20 to-pink-600/10" },
                        { value: countdown.seconds, label: "Sec", color: "from-amber-500/20 to-amber-600/10" },
                      ].map((t, i) => (
                        <motion.div
                          key={t.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`bg-gradient-to-b ${t.color} rounded-xl p-3 border border-white/10`}
                        >
                          <motion.p
                            key={t.value}
                            initial={{ opacity: 0.5, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight"
                          >
                            {String(t.value).padStart(2, "0")}
                          </motion.p>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{t.label}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : hasWinner ? (
                    <div className="text-center py-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <FiAward className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                      </motion.div>
                      <p className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Winner Announced!</p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-red-400 font-semibold">Giveaway has ended</p>
                      <p className="text-xs text-gray-600 mt-1">Winner will be announced soon</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Participants Progress */}
              <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                  <FiUsers className="w-4 h-4" /> Participants
                </h3>
                <p className="text-2xl font-bold text-white mb-1">
                  {participantCount} <span className="text-sm font-normal text-gray-500">/ {giveaway.targetParticipants}</span>
                </p>
                <div className="w-full bg-white/5 rounded-full h-2.5 mb-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500">{progressPercent}% of target</p>
              </motion.div>

              {/* Total Donations Sidebar Card */}
              {supportData.total > 0 && (
                <motion.div variants={fadeUp} className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 rounded-2xl p-6 border border-green-500/10">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                    <FiDollarSign className="w-4 h-4 text-green-400" /> Donations
                  </h3>
                  <p className="text-2xl font-black text-green-400">₹{supportData.total?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{supportData.count} supporter{supportData.count !== 1 ? "s" : ""}</p>
                </motion.div>
              )}

              {/* Join / Status CTA */}
              <motion.div variants={fadeUp} className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-red-900/20 text-red-400 p-2 rounded-lg mb-3 text-xs border border-red-500/20">{error}</motion.div>
                )}

                {!myStatus?.joined ? (
                  <>
                    <AnimatedCTA onClick={handleJoin} disabled={joining || !isActive} variant={!isActive ? "disabled" : "join"}>
                      <FiGift className="w-5 h-5" /> {ctaText}
                    </AnimatedCTA>
                    <p className="text-xs text-center text-gray-500 mt-2">100% free · No purchase required</p>
                  </>
                ) : (
                  <div className="text-center">
                    <AnimatedCTA variant={ctaVariant}>
                      {ctaText}
                    </AnimatedCTA>

                    {myStatus.status === "participant" && (
                      <p className="text-xs text-amber-400 mt-3">
                        <FiAlertCircle className="inline w-3 h-3 mr-1" />
                        Joined — wait for announcement or complete tasks
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                      <span><strong className="text-white">{myStatus.points}</strong> pts</span>
                      {giveaway.invitePointsEnabled && <span><strong className="text-white">{myStatus.inviteCount || 0}</strong> invites</span>}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
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
