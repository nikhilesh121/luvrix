import { useState, useEffect, useCallback } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import {
  listGiveaways, createGiveaway, updateGiveawayApi, deleteGiveaway,
  getGiveawayTasks, addGiveawayTask, removeGiveawayTask,
  getGiveawayParticipants, selectGiveawayWinner, createLog,
  getGiveawayWinnerInfo,
} from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiEdit3, FiTrash2, FiSave, FiGift, FiUsers, FiAward,
  FiSearch, FiCheckCircle, FiAlertCircle, FiImage,
  FiLink, FiEye, FiLock,
  FiShuffle, FiTarget, FiList, FiMapPin, FiHeart,
  FiPhone,
} from "react-icons/fi";

export default function AdminGiveaways() {
  return (
    <AdminGuard>
      <GiveawaysContent />
    </AdminGuard>
  );
}

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  upcoming: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  ended: "bg-amber-100 text-amber-700",
  winner_selected: "bg-purple-100 text-purple-700",
};

const TASK_TYPES = [
  { value: "facebook_like", label: "Like Facebook Page", icon: "📘", defaultTitle: "Like our Facebook Page", needsUrl: true, placeholder: "https://facebook.com/yourpage" },
  { value: "facebook_follow", label: "Follow on Facebook", icon: "📘", defaultTitle: "Follow us on Facebook", needsUrl: true, placeholder: "https://facebook.com/yourpage" },
  { value: "instagram_follow", label: "Follow on Instagram", icon: "📸", defaultTitle: "Follow us on Instagram", needsUrl: true, placeholder: "https://instagram.com/yourhandle" },
  { value: "youtube_like", label: "Like YouTube Video", icon: "🎬", defaultTitle: "Like our YouTube Video", needsUrl: true, placeholder: "https://youtube.com/watch?v=..." },
  { value: "youtube_subscribe", label: "Subscribe on YouTube", icon: "🎬", defaultTitle: "Subscribe to our YouTube Channel", needsUrl: true, placeholder: "https://youtube.com/@yourchannel" },
  { value: "twitter_follow", label: "Follow on X / Twitter", icon: "🐦", defaultTitle: "Follow us on X", needsUrl: true, placeholder: "https://x.com/yourhandle" },
  { value: "twitter_like", label: "Like a Tweet / Post", icon: "🐦", defaultTitle: "Like our post on X", needsUrl: true, placeholder: "https://x.com/user/status/..." },
  { value: "visit_website", label: "Visit a Website", icon: "🌐", defaultTitle: "Visit our Website", needsUrl: true, placeholder: "https://example.com" },
  { value: "join_telegram", label: "Join Telegram Group", icon: "✈️", defaultTitle: "Join our Telegram Group", needsUrl: true, placeholder: "https://t.me/yourgroup" },
  { value: "join_discord", label: "Join Discord Server", icon: "💬", defaultTitle: "Join our Discord Server", needsUrl: true, placeholder: "https://discord.gg/invite" },
  { value: "share_post", label: "Share a Post", icon: "🔗", defaultTitle: "Share this giveaway", needsUrl: false },
  { value: "invite", label: "Invite Friends", icon: "👥", defaultTitle: "Invite friends to join", needsUrl: false },
  { value: "quiz", label: "Answer a Quiz", icon: "❓", defaultTitle: "Answer the quiz correctly", needsUrl: false },
  { value: "custom", label: "Custom Task", icon: "⚡", defaultTitle: "", needsUrl: false, placeholder: "" },
];

function GiveawaysContent() {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | form | detail
  const [editingGiveaway, setEditingGiveaway] = useState(null);
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", imageUrl: "", prizeDetails: "",
    mode: "random", requiredPoints: 0, targetParticipants: 100,
    startDate: "", endDate: "", maxExtensions: 0, status: "draft",
    invitePointsEnabled: false, invitePointsCap: 10, invitePointsPerReferral: 1,
    winnerSelectionMode: "SYSTEM_RANDOM",
    supportEnabled: true,
    sponsors: [],
  });

  const fetchGiveaways = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listGiveaways();
      setGiveaways(data || []);
    } catch (err) {
      console.error("Error fetching giveaways:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGiveaways(); }, [fetchGiveaways]);

  const resetForm = () => {
    setForm({
      title: "", description: "", imageUrl: "", prizeDetails: "",
      mode: "random", requiredPoints: 0, targetParticipants: 100,
      startDate: "", endDate: "", maxExtensions: 0, status: "draft",
      invitePointsEnabled: false, invitePointsCap: 10, invitePointsPerReferral: 1,
      winnerSelectionMode: "SYSTEM_RANDOM",
      supportEnabled: true,
      sponsors: [],
    });
    setEditingGiveaway(null);
    setError("");
  };

  const openCreate = () => { resetForm(); setView("form"); };

  const openEdit = (g) => {
    setEditingGiveaway(g);
    setForm({
      title: g.title || "", description: g.description || "",
      imageUrl: g.imageUrl || "", prizeDetails: g.prizeDetails || "",
      mode: g.mode || "random", requiredPoints: g.requiredPoints || 0,
      targetParticipants: g.targetParticipants || 100,
      startDate: g.startDate ? new Date(g.startDate).toISOString().slice(0, 16) : "",
      endDate: g.endDate ? new Date(g.endDate).toISOString().slice(0, 16) : "",
      maxExtensions: g.maxExtensions || 0, status: g.status || "draft",
      invitePointsEnabled: g.invitePointsEnabled || false,
      invitePointsCap: g.invitePointsCap || 10,
      invitePointsPerReferral: g.invitePointsPerReferral || 1,
      winnerSelectionMode: g.winnerSelectionMode || "SYSTEM_RANDOM",
      supportEnabled: g.supportEnabled !== undefined ? g.supportEnabled : true,
      sponsors: g.sponsors || [],
    });
    setView("form");
  };

  const openDetail = (g) => { setSelectedGiveaway(g); setView("detail"); };

  const handleSave = async () => {
    if (!form.title.trim()) return setError("Title is required");
    if (!form.imageUrl.trim()) return setError("Image URL is required");
    if (!form.startDate || !form.endDate) return setError("Start and end dates are required");

    setSaving(true);
    setError("");
    try {
      if (editingGiveaway) {
        await updateGiveawayApi(editingGiveaway.id, form);
      } else {
        await createGiveaway(form);
      }
      await createLog({
        adminId: auth.currentUser?.uid,
        action: editingGiveaway ? "Updated Giveaway" : "Created Giveaway",
        targetId: editingGiveaway?.id || "new",
        details: form.title,
      });
      await fetchGiveaways();
      setView("list");
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this draft giveaway?")) return;
    try {
      await deleteGiveaway(id);
      await fetchGiveaways();
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <div className="admin-layout p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FiGift className="text-purple-500" /> Giveaways
                </h1>
                <p className="text-gray-500 mt-1">Manage giveaways, tasks, and winners</p>
              </div>
              <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
                <FiPlus className="w-4 h-4" /> Create
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-48" />
                ))}
              </div>
            ) : giveaways.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <FiGift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No giveaways yet</h3>
                <p className="text-gray-400 mb-6">Create your first giveaway to get started</p>
                <button onClick={openCreate} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
                  Create Giveaway
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {giveaways.map((g) => (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
                    <div className="flex">
                      {g.imageUrl && (
                        <div className="w-28 h-full min-h-[120px] flex-shrink-0">
                          <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900 line-clamp-1">{g.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status] || STATUS_COLORS.draft}`}>
                            {g.status?.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{g.prizeDetails || "No prize details"}</p>
                        <div className="text-xs text-gray-400 mb-3">
                          {g.endDate && `Ends: ${new Date(g.endDate).toLocaleDateString()}`}
                          {g.mode === "task_gated" && ` · Task-gated (${g.requiredPoints} pts)`}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openDetail(g)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1">
                            <FiEye className="w-3 h-3" /> View
                          </button>
                          <button onClick={() => openEdit(g)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                            disabled={g.status === "winner_selected"}>
                            <FiEdit3 className="w-3 h-3" /> Edit
                          </button>
                          {g.status === "draft" && (
                            <button onClick={() => handleDelete(g.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
                              <FiTrash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FORM VIEW (Create / Edit) ──
  if (view === "form") {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <div className="admin-layout p-4 sm:p-8">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => { setView("list"); resetForm(); }} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
              ← Back to list
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{editingGiveaway ? "Edit Giveaway" : "Create Giveaway"}</h1>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="Win a PlayStation 5!" />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Image URL *</label>
                <input type="text" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="https://..." />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Preview" className="mt-2 rounded-xl w-full h-40 object-cover" />
                )}
              </div>

              {/* Prize Details */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Prize Details (physical items only)</label>
                <textarea value={form.prizeDetails} onChange={e => setForm(f => ({ ...f, prizeDetails: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl" rows={2} placeholder="Brand new PlayStation 5 console with controller" />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl" rows={3} placeholder="Details about the giveaway..." />
              </div>

              {/* Mode */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setForm(f => ({ ...f, mode: "random" }))}
                    className={`p-4 rounded-xl border-2 text-center transition ${form.mode === "random" ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}>
                    <FiShuffle className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="font-semibold text-sm">Random</p>
                    <p className="text-xs text-gray-500">All participants eligible</p>
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, mode: "task_gated" }))}
                    className={`p-4 rounded-xl border-2 text-center transition ${form.mode === "task_gated" ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}>
                    <FiTarget className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="font-semibold text-sm">Task-Gated</p>
                    <p className="text-xs text-gray-500">Must earn points</p>
                  </button>
                </div>
              </div>

              {/* Required Points (task_gated only) */}
              {form.mode === "task_gated" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Required Points for Eligibility</label>
                  <input type="number" value={form.requiredPoints} onChange={e => setForm(f => ({ ...f, requiredPoints: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl" min={0} />
                </div>
              )}

              {/* Target Participants */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Target Participants</label>
                <input type="number" value={form.targetParticipants} onChange={e => setForm(f => ({ ...f, targetParticipants: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl" min={1} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Start Date *</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">End Date *</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                </div>
              </div>

              {/* End Date Extension Days */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">End Date Extension</label>
                <p className="text-xs text-gray-400 mb-1.5">
                  {form.maxExtensions === -1
                    ? "Giveaway will continue indefinitely until all users have joined or you manually end it."
                    : "Number of days the giveaway end date can be extended after it ends (0 = no extension)"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 0, label: "None" },
                    { value: 3, label: "3 days" },
                    { value: 7, label: "7 days" },
                    { value: 14, label: "14 days" },
                    { value: 30, label: "30 days" },
                    { value: -1, label: "Unlimited" },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, maxExtensions: opt.value }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                        form.maxExtensions === opt.value
                          ? opt.value === -1
                            ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/20"
                            : "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {opt.value === -1 && "♾ "}{opt.label}
                    </button>
                  ))}
                </div>
                {form.maxExtensions > 0 && form.maxExtensions !== -1 && (
                  <div className="mt-2">
                    <input type="number" value={form.maxExtensions}
                      onChange={e => setForm(f => ({ ...f, maxExtensions: Math.max(0, Number(e.target.value)) }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" min={0}
                      placeholder="Custom days..." />
                  </div>
                )}
              </div>

              {/* Winner Selection Mode */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Winner Selection Mode</label>
                <p className="text-xs text-gray-400 mb-2">Choose how the winner will be selected when the giveaway ends</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setForm(f => ({ ...f, winnerSelectionMode: "SYSTEM_RANDOM" }))}
                    className={`p-4 rounded-xl border-2 text-center transition ${form.winnerSelectionMode === "SYSTEM_RANDOM" ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                    <FiShuffle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="font-semibold text-sm">Auto Random</p>
                    <p className="text-xs text-gray-500">System picks winner automatically</p>
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, winnerSelectionMode: "ADMIN_RANDOM" }))}
                    className={`p-4 rounded-xl border-2 text-center transition ${form.winnerSelectionMode === "ADMIN_RANDOM" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                    <FiAward className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="font-semibold text-sm">Manual by Admin</p>
                    <p className="text-xs text-gray-500">Admin selects winner manually</p>
                  </button>
                </div>
              </div>

              {/* Sponsor Banners */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiImage className="text-pink-500" /> Sponsor Banners</h3>
                <p className="text-xs text-gray-400 mb-3">Add sponsor banners that will be displayed on the giveaway page. Redirect URL is optional.</p>
                {form.sponsors.map((sp, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input type="text" value={sp.bannerUrl} placeholder="Banner image URL *"
                        onChange={e => { const s = [...form.sponsors]; s[i] = { ...s[i], bannerUrl: e.target.value }; setForm(f => ({ ...f, sponsors: s })); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <input type="text" value={sp.redirectUrl || ""} placeholder="Redirect URL (optional)"
                        onChange={e => { const s = [...form.sponsors]; s[i] = { ...s[i], redirectUrl: e.target.value }; setForm(f => ({ ...f, sponsors: s })); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <input type="text" value={sp.name || ""} placeholder="Sponsor name (optional)"
                        onChange={e => { const s = [...form.sponsors]; s[i] = { ...s[i], name: e.target.value }; setForm(f => ({ ...f, sponsors: s })); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, sponsors: f.sponsors.filter((_, j) => j !== i) }))}
                      className="p-2 text-red-400 hover:text-red-600 mt-1"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, sponsors: [...f.sponsors, { bannerUrl: "", redirectUrl: "", name: "" }] }))}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium mt-1">
                  <FiPlus className="w-4 h-4" /> Add Sponsor
                </button>
              </div>

              {/* Invite Settings */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiUsers className="text-blue-500" /> Invite Settings</h3>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input type="checkbox" checked={form.invitePointsEnabled} onChange={e => setForm(f => ({ ...f, invitePointsEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Enable invite-based points</span>
                </label>
                {form.invitePointsEnabled && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Points per referral</label>
                      <input type="number" value={form.invitePointsPerReferral} onChange={e => setForm(f => ({ ...f, invitePointsPerReferral: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" min={1} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Max invite points cap</label>
                      <input type="number" value={form.invitePointsCap} onChange={e => setForm(f => ({ ...f, invitePointsCap: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" min={1} />
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl">
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              {/* Support Section Toggle */}
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl border border-pink-100">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block">Support / Donation Section</label>
                  <p className="text-xs text-gray-500 mt-0.5">Allow visitors to donate and support this giveaway</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, supportEnabled: !f.supportEnabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.supportEnabled ? "bg-pink-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.supportEnabled ? "translate-x-6" : ""}`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                  <FiSave className="w-4 h-4" /> {saving ? "Saving..." : "Save Giveaway"}
                </button>
                <button onClick={() => { setView("list"); resetForm(); }}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW (Tasks, Participants, Winner) ──
  if (view === "detail" && selectedGiveaway) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <div className="admin-layout p-4 sm:p-8">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => { setView("list"); setSelectedGiveaway(null); }}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">← Back to list</button>
            <GiveawayDetail giveaway={selectedGiveaway} onRefresh={async () => {
              await fetchGiveaways();
              const updated = (await listGiveaways()).find(g => g.id === selectedGiveaway.id);
              if (updated) setSelectedGiveaway(updated);
            }} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── DETAIL SUB-COMPONENT ──
function GiveawayDetail({ giveaway, onRefresh }) {
  const [tab, setTab] = useState("tasks"); // tasks | participants | winner | shipping | donations
  const [tasks, setTasks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ type: "custom", title: "", description: "", points: 1, required: false, url: "", timerDuration: 0 });

  // Winner
  // winnerMode is always SYSTEM_RANDOM for now
  const [winnerLoading, setWinnerLoading] = useState(false);
  const [winnerError, setWinnerError] = useState("");
  const [winnerInfo, setWinnerInfo] = useState(null);

  // Shipping
  const [shippingData, setShippingData] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Donations
  const [donationData, setDonationData] = useState({ total: 0, count: 0, supporters: [] });
  const [loadingDonations, setLoadingDonations] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const data = await getGiveawayTasks(giveaway.id);
      setTasks(data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingTasks(false); }
  }, [giveaway.id]);

  const fetchParticipants = useCallback(async () => {
    setLoadingParticipants(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await getGiveawayParticipants(giveaway.id, params);
      setParticipants(data?.participants || []);
      setParticipantCount(data?.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoadingParticipants(false); }
  }, [giveaway.id, statusFilter, searchQuery]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { if (tab === "participants" || tab === "winner") fetchParticipants(); }, [tab, fetchParticipants]);
  useEffect(() => {
    if (giveaway.status === "winner_selected" && giveaway.id) {
      getGiveawayWinnerInfo(giveaway.id).then(w => setWinnerInfo(w)).catch(() => {});
    }
  }, [giveaway.id, giveaway.status]);

  useEffect(() => {
    if (tab === "shipping" && giveaway.status === "winner_selected") {
      setLoadingShipping(true);
      const token = localStorage.getItem("luvrix_auth_token");
      fetch(`/api/giveaways/${giveaway.id}/shipping-details`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => setShippingData(d.shipping || null)).catch(() => {}).finally(() => setLoadingShipping(false));
    }
  }, [tab, giveaway.id, giveaway.status]);

  useEffect(() => {
    if (tab === "donations") {
      setLoadingDonations(true);
      const token = localStorage.getItem("luvrix_auth_token");
      fetch(`/api/giveaways/${giveaway.id}/support`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => setDonationData(d || { total: 0, count: 0, supporters: [] })).catch(() => {}).finally(() => setLoadingDonations(false));
    }
  }, [tab, giveaway.id]);

  const handleAddTask = async () => {
    if (!taskForm.title.trim()) return;
    const taskData = {
      type: taskForm.type,
      title: taskForm.title,
      description: taskForm.description,
      points: taskForm.points,
      required: taskForm.required,
      metadata: { ...(taskForm.url ? { url: taskForm.url } : {}), ...(taskForm.timerDuration > 0 ? { timerDuration: Number(taskForm.timerDuration) } : {}) },
    };
    try {
      await addGiveawayTask(giveaway.id, taskData);
      setTaskForm({ type: "custom", title: "", description: "", points: 1, required: false, url: "", timerDuration: 0 });
      setShowTaskForm(false);
      await fetchTasks();
    } catch (err) { alert(err.message); }
  };

  const handleRemoveTask = async (taskId) => {
    if (!confirm("Remove this task?")) return;
    try {
      await removeGiveawayTask(giveaway.id, taskId);
      await fetchTasks();
    } catch (err) { alert(err.message); }
  };

  const handleSelectWinner = async (userId) => {
    const mode = userId ? "ADMIN_RANDOM" : "SYSTEM_RANDOM";
    const confirmMsg = mode === "SYSTEM_RANDOM"
      ? "Select a random winner from all eligible participants?"
      : "Select this user as the winner? This action is permanent and will be logged.";
    if (!confirm(confirmMsg)) return;

    setWinnerLoading(true);
    setWinnerError("");
    try {
      await selectGiveawayWinner(giveaway.id, {
        mode,
        winnerUserId: userId || undefined,
      });
      await onRefresh();
    } catch (err) {
      setWinnerError(err.message || "Failed to select winner");
    } finally {
      setWinnerLoading(false);
    }
  };

  const isLocked = giveaway.status === "winner_selected";
  const tabs = [
    { id: "tasks", label: "Tasks", icon: FiList },
    { id: "participants", label: `Participants (${participantCount})`, icon: FiUsers },
    { id: "winner", label: "Winner", icon: FiAward },
    { id: "shipping", label: "Shipping", icon: FiMapPin },
    { id: "donations", label: "Donations", icon: FiHeart },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          {giveaway.imageUrl && (
            <img src={giveaway.imageUrl} alt={giveaway.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{giveaway.title}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[giveaway.status]}`}>
                {giveaway.status?.replace("_", " ")}
              </span>
              {isLocked && <FiLock className="w-4 h-4 text-amber-500" title="Locked — winner selected" />}
            </div>
            <p className="text-sm text-gray-500 mb-2">{giveaway.prizeDetails}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Mode: <strong className="text-gray-600">{giveaway.mode}</strong></span>
              {giveaway.mode === "task_gated" && <span>Required: <strong className="text-gray-600">{giveaway.requiredPoints} pts</strong></span>}
              <span>Target: <strong className="text-gray-600">{giveaway.targetParticipants}</strong></span>
              {giveaway.endDate && <span>Ends: <strong className="text-gray-600">{new Date(giveaway.endDate).toLocaleDateString()}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition flex-1 justify-center ${tab === t.id ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Tasks</h2>
            {!isLocked && (
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="text-sm px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition flex items-center gap-1">
                <FiPlus className="w-3.5 h-3.5" /> Add Task
              </button>
            )}
          </div>

          {/* Add Task Form */}
          <AnimatePresence>
            {showTaskForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  {/* Quick-add preset grid */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Quick Add Task</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {TASK_TYPES.filter(t => t.value !== "custom").map(t => (
                        <button key={t.value} type="button"
                          onClick={() => {
                            const tt = TASK_TYPES.find(x => x.value === t.value);
                            setTaskForm(f => ({
                              ...f,
                              type: t.value,
                              title: tt?.defaultTitle || "",
                              url: "",
                            }));
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition text-left ${
                            taskForm.type === t.value
                              ? "bg-purple-100 border-purple-300 text-purple-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-purple-200 hover:bg-purple-50"
                          }`}
                        >
                          <span className="text-base">{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                        <select value={taskForm.type} onChange={e => {
                          const tt = TASK_TYPES.find(x => x.value === e.target.value);
                          setTaskForm(f => ({
                            ...f,
                            type: e.target.value,
                            title: tt?.defaultTitle || f.title,
                            url: "",
                          }));
                        }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Points</label>
                        <input type="number" value={taskForm.points} onChange={e => setTaskForm(f => ({ ...f, points: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" min={1} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Title *</label>
                    <input type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Follow us on Instagram" />
                  </div>

                  {/* URL field — shown for social/URL-based tasks */}
                  {(() => {
                    const tt = TASK_TYPES.find(x => x.value === taskForm.type);
                    return tt?.needsUrl ? (
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          <FiLink className="inline w-3 h-3 mr-1" />URL *
                        </label>
                        <input type="url" value={taskForm.url} onChange={e => setTaskForm(f => ({ ...f, url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder={tt.placeholder || "https://..."} />
                      </div>
                    ) : null;
                  })()}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Description (optional)</label>
                      <input type="text" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Additional instructions" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">⏱ Visit Timer (seconds)</label>
                      <select value={taskForm.timerDuration} onChange={e => setTaskForm(f => ({ ...f, timerDuration: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        <option value={0}>No timer</option>
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={45}>45 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={90}>1.5 minutes</option>
                        <option value={120}>2 minutes</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-0.5">User must stay on the task page for this duration</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taskForm.required} onChange={e => setTaskForm(f => ({ ...f, required: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700">Required for eligibility</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={handleAddTask} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">Add Task</button>
                    <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task List */}
          {loadingTasks ? (
            <div className="py-8 text-center text-gray-400">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No tasks added yet</div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const tt = TASK_TYPES.find(x => x.value === task.type);
                return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${task.required ? "bg-red-100" : "bg-blue-100"}`}>
                      {tt?.icon || "⚡"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">{tt?.label || task.type} · {task.points} pts {task.required && "· Required"}</p>
                        {task.metadata?.url && (
                          <a href={task.metadata.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                            <FiLink className="w-3 h-3" /> Link
                          </a>
                        )}
                        {task.metadata?.timerDuration > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">⏱ {task.metadata.timerDuration}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isLocked && (
                    <button onClick={() => handleRemoveTask(task.id)} className="text-red-400 hover:text-red-600 transition">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {tab === "participants" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Search by name or email..." />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
              <option value="all">All</option>
              <option value="participant">Participant</option>
              <option value="eligible">Eligible</option>
              <option value="winner">Winner</option>
            </select>
          </div>

          {loadingParticipants ? (
            <div className="py-8 text-center text-gray-400">Loading...</div>
          ) : participants.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No participants found</div>
          ) : (
            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {p.user?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.user?.name || p.userId}</p>
                      <p className="text-xs text-gray-400">{p.user?.email || ""} · {p.points} pts · {p.inviteCount} invites</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "eligible" ? "bg-green-100 text-green-700"
                    : p.status === "winner" ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Winner Tab */}
      {tab === "winner" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {isLocked ? (
            <div className="text-center py-8">
              <FiAward className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Winner Selected!</h3>

              {winnerInfo?.name ? (
                <div className="flex items-center justify-center gap-4 mb-4 p-4 bg-purple-50 rounded-xl max-w-sm mx-auto">
                  {winnerInfo.photoURL ? (
                    <img src={winnerInfo.photoURL} alt={winnerInfo.name} className="w-14 h-14 rounded-full object-cover border-2 border-purple-300" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xl">
                      {winnerInfo.name[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-lg">{winnerInfo.name}</p>
                    {winnerInfo.username && <p className="text-sm text-gray-500">@{winnerInfo.username}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 mb-4">Winner ID: <strong>{giveaway.winnerId}</strong></p>
              )}

              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm">
                <FiLock className="w-4 h-4" /> Selection logged in audit trail
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-gray-800 mb-4">Select Winner</h2>
              {winnerError && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{winnerError}</div>}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
                <strong>Important:</strong> Winners can only be selected from <strong>eligible</strong> participants.
                This action is permanent and will be logged in the audit trail.
              </div>

              {/* Auto Random */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Automatic Random Selection</h3>
                <p className="text-xs text-gray-500 mb-3">System picks a random winner from all eligible participants</p>
                <button onClick={() => handleSelectWinner()} disabled={winnerLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  <FiShuffle className="w-4 h-4" /> {winnerLoading ? "Selecting..." : "Pick Random Winner"}
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Manual Selection (Admin)</h3>
                <p className="text-xs text-gray-500 mb-3">Select a specific eligible participant as winner</p>

                {/* Show eligible participants */}
                {loadingParticipants ? (
                  <div className="py-4 text-center text-gray-400">Loading eligible participants...</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {participants.filter(p => p.status === "eligible").length === 0 ? (
                      <div className="py-4 text-center text-gray-400">No eligible participants yet</div>
                    ) : (
                      participants.filter(p => p.status === "eligible").map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                              {p.user?.name?.[0] || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{p.user?.name || p.userId}</p>
                              <p className="text-xs text-gray-400">{p.user?.email} · {p.points} pts</p>
                            </div>
                          </div>
                          <button onClick={() => handleSelectWinner(p.userId)} disabled={winnerLoading}
                            className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
                            Select as Winner
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Shipping Tab */}
      {tab === "shipping" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiMapPin className="text-purple-500" /> Winner Shipping Details
          </h2>

          {giveaway.status !== "winner_selected" ? (
            <div className="py-8 text-center text-gray-400">
              <FiMapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No winner selected yet</p>
              <p className="text-sm mt-1">Shipping details will appear here after a winner is selected and submits their info</p>
            </div>
          ) : loadingShipping ? (
            <div className="py-8 text-center text-gray-400">Loading shipping details...</div>
          ) : !shippingData ? (
            <div className="py-8 text-center">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
              <p className="font-medium text-gray-700">Winner has not submitted shipping details yet</p>
              <p className="text-sm text-gray-400 mt-1">The winner will be prompted to submit their shipping address</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
                <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Shipping details submitted by winner</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label>
                  <p className="text-gray-900 font-medium">{shippingData.fullName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Phone</label>
                  <p className="text-gray-900 font-medium flex items-center gap-1.5"><FiPhone className="w-3.5 h-3.5 text-gray-400" />{shippingData.phone}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Full Address</label>
                <p className="text-gray-900">{shippingData.address}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {shippingData.city}, {shippingData.state} — {shippingData.pincode}, {shippingData.country}
                </p>
              </div>

              {shippingData.createdAt && (
                <p className="text-xs text-gray-400">Submitted on {new Date(shippingData.createdAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Donations Tab */}
      {tab === "donations" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FiHeart className="text-pink-500" /> Donations
            </h2>
            {donationData.total > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{donationData.supporters?.length || 0} supporter{(donationData.supporters?.length || 0) !== 1 ? "s" : ""} · {donationData.count} donation{donationData.count !== 1 ? "s" : ""}</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-sm rounded-full">
                  ₹{donationData.total?.toLocaleString() || 0}
                </span>
              </div>
            )}
          </div>

          {loadingDonations ? (
            <div className="py-8 text-center text-gray-400">Loading donations...</div>
          ) : !donationData.supporters?.length ? (
            <div className="py-8 text-center text-gray-400">
              <FiHeart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No donations yet</p>
              <p className="text-sm mt-1">Supporters will appear here when they donate</p>
            </div>
          ) : (
            <div className="space-y-2">
              {donationData.supporters.map((s, i) => (
                <div key={s.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {s.userPhoto ? (
                      <img src={s.userPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                        <FiHeart className="w-3.5 h-3.5 text-pink-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {s.donorName || s.userName || "Anonymous"}
                        {s.isAnonymous && <span className="text-xs text-gray-400 ml-1">(Anonymous publicly)</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.donorEmail || s.userEmail || "No email"}
                        {s.createdAt && ` · ${new Date(s.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">₹{s.amount}</span>
                    {s.donationCount > 1 && <p className="text-[10px] text-gray-400">{s.donationCount} donations</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
