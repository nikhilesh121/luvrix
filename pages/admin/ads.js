import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/firebase-client";
import { auth } from "../../lib/local-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSave, FiMonitor, FiToggleLeft, FiToggleRight, FiLayout, FiGrid,
  FiSquare, FiSidebar, FiMaximize, FiBox, FiImage, FiType, FiVideo,
  FiCode, FiPlus, FiTrash2, FiEdit2, FiEye, FiCheck, FiX,
  FiFileText
} from "react-icons/fi";

const AD_POSITIONS = [
  { id: "header_top", name: "Header Top", description: "Above the navigation bar", icon: FiLayout },
  { id: "header_below", name: "Below Header", description: "Below the navigation, above content", icon: FiGrid },
  { id: "sidebar_left", name: "Left Sidebar", description: "Fixed on the left side", icon: FiSidebar },
  { id: "sidebar_right", name: "Right Sidebar", description: "Fixed on the right side", icon: FiSidebar },
  { id: "content_top", name: "Content Top", description: "Above main content area", icon: FiBox },
  { id: "blog_top", name: "Blog Top", description: "Below blog hero, above article body", icon: FiBox },
  { id: "content_middle", name: "In-Content", description: "Between content paragraphs", icon: FiSquare },
  { id: "content_bottom", name: "Content Bottom", description: "Below main content area", icon: FiBox },
  { id: "blog_bottom", name: "Blog Bottom", description: "Below blog article, above comments", icon: FiBox },
  { id: "footer_above", name: "Above Footer", description: "Just before the footer", icon: FiLayout },
  { id: "footer_inside", name: "Footer Inside", description: "Within the footer area", icon: FiGrid },
  { id: "popup", name: "Popup/Modal", description: "Overlay popup ad", icon: FiMaximize },
  { id: "sticky_bottom", name: "Sticky Bottom", description: "Fixed at bottom of screen", icon: FiBox },
  { id: "between_posts", name: "Between Posts", description: "In blog/manga listings", icon: FiGrid },
];

const AD_TYPES = [
  { id: "banner", name: "Banner Ad", description: "Standard display banner", icon: FiImage, sizes: ["728x90", "320x50", "300x250", "336x280"] },
  { id: "native", name: "Native Ad", description: "Blends with content style", icon: FiType, sizes: ["Responsive"] },
  { id: "video", name: "Video Ad", description: "Video format advertisement", icon: FiVideo, sizes: ["16:9", "4:3"] },
  { id: "interstitial", name: "Interstitial", description: "Full-screen between pages", icon: FiMaximize, sizes: ["Full Screen"] },
  { id: "sticky", name: "Sticky/Anchor", description: "Fixed position ad", icon: FiBox, sizes: ["320x50", "728x90"] },
  { id: "custom", name: "Custom HTML", description: "Any custom ad code", icon: FiCode, sizes: ["Custom"] },
];

export default function AdminAds() {
  return (
    <AdminGuard>
      <AdsContent />
    </AdminGuard>
  );
}

const DEFAULT_ADS_TXT = `google.com, pub-9162211780712502, DIRECT, f08c47fec0942fa0
`;

const PAGE_TARGETS = [
  { id: "all", name: "All Pages" },
  { id: "home", name: "Homepage" },
  { id: "blog", name: "Blog Posts" },
  { id: "manga", name: "Manga Pages" },
  { id: "chapter", name: "Chapter Reader" },
  { id: "categories", name: "Categories" },
  { id: "user", name: "User Profiles" },
];

const DEVICE_TARGETS = [
  { id: "all", name: "All Devices" },
  { id: "desktop", name: "Desktop Only" },
  { id: "mobile", name: "Mobile Only" },
];

function AdsContent() {
  const [settings, setSettings] = useState({
    adsEnabled: false,
    adsCode: "",
    adPlacements: [],
    adsensePublisherId: "",
    adsenseMeta: "",
    adsTxt: DEFAULT_ADS_TXT,
    enableAutoAds: false,
    autoAdsExcludedRoutes: "/admin,/login,/register,/error,/create-blog,/edit-blog,/preview-blog,/dashboard",
    blogAdInterval: 4,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState("placements");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [newAd, setNewAd] = useState({
    position: "",
    type: "banner",
    code: "",
    enabled: true,
    name: "",
    size: "",
    devices: "all",
    pages: ["all"],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings({
        adsEnabled: data.adsEnabled || false,
        adsCode: data.adsCode || "",
        adPlacements: data.adPlacements || [],
        adsensePublisherId: data.adsensePublisherId || "",
        adsenseMeta: data.adsenseMeta || "",
        adsTxt: data.adsTxt || DEFAULT_ADS_TXT,
        enableAutoAds: data.enableAutoAds || false,
        autoAdsExcludedRoutes: data.autoAdsExcludedRoutes || "/admin,/login,/register,/error,/create-blog,/edit-blog,/preview-blog,/dashboard",
        blogAdInterval: data.blogAdInterval || 4,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateSettings(settings);

      // Also write ads.txt to disk
      try {
        const token = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/write-system-files", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ adsTxt: settings.adsTxt }),
        });
      } catch (e) { console.error("ads.txt write error:", e); }

      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated Ads Settings",
        targetId: "settings",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveError("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAd = () => {
    if (!newAd.position || !newAd.code) {
      alert("Please select a position and enter ad code");
      return;
    }
    const ad = {
      ...newAd,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSettings({
      ...settings,
      adPlacements: [...settings.adPlacements, ad],
    });
    setNewAd({ position: "", type: "banner", code: "", enabled: true, name: "", size: "", devices: "all", pages: ["all"] });
    setShowAddModal(false);
  };

  const handleUpdateAd = () => {
    if (!editingAd) return;
    setSettings({
      ...settings,
      adPlacements: settings.adPlacements.map((ad) =>
        ad.id === editingAd.id ? editingAd : ad
      ),
    });
    setEditingAd(null);
  };

  const handleDeleteAd = (id) => {
    if (confirm("Are you sure you want to delete this ad placement?")) {
      setSettings({
        ...settings,
        adPlacements: settings.adPlacements.filter((ad) => ad.id !== id),
      });
    }
  };

  const toggleAdEnabled = (id) => {
    setSettings({
      ...settings,
      adPlacements: settings.adPlacements.map((ad) =>
        ad.id === id ? { ...ad, enabled: !ad.enabled } : ad
      ),
    });
  };

  const getPositionInfo = (posId) => AD_POSITIONS.find((p) => p.id === posId);
  const getTypeInfo = (typeId) => AD_TYPES.find((t) => t.id === typeId);

  const tabs = [
    { id: "placements", label: "Ad Placements", icon: FiLayout },
    { id: "adsense", label: "AdSense Config", icon: FiCode },
    { id: "adstxt", label: "ads.txt", icon: FiFileText },
    { id: "global", label: "Global Settings", icon: FiMonitor },
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
                Ads Management
              </h1>
              <p className="text-gray-500">Full control over ad placements and types</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {/* Global Ads Toggle */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Ads</span>
                <button
                  onClick={() => setSettings({ ...settings, adsEnabled: !settings.adsEnabled })}
                  className={`p-1 rounded-lg transition ${
                    settings.adsEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {settings.adsEnabled ? <FiToggleRight className="w-8 h-8" /> : <FiToggleLeft className="w-8 h-8" />}
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-500 text-white font-semibold rounded-xl shadow-lg"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave />}
                Save All
              </motion.button>
            </div>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <FiCheck className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Settings saved successfully!</span>
            </motion.div>
          )}

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

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "placements" && (
                <motion.div key="placements" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  {/* Add New Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(true)}
                    className="mb-6 flex items-center gap-2 px-5 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary hover:text-primary transition-all w-full justify-center"
                  >
                    <FiPlus className="w-5 h-5" />
                    Add New Ad Placement
                  </motion.button>

                  {/* Placements Grid */}
                  {settings.adPlacements.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                      <FiLayout className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-bold text-gray-600 mb-2">No Ad Placements Yet</h3>
                      <p className="text-gray-400 mb-6">Add your first ad placement to start monetizing</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold"
                      >
                        <FiPlus /> Add Placement
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {settings.adPlacements.map((ad) => {
                        const posInfo = getPositionInfo(ad.position);
                        const typeInfo = getTypeInfo(ad.type);
                        const PosIcon = posInfo?.icon || FiSquare;
                        const TypeIcon = typeInfo?.icon || FiImage;
                        return (
                          <motion.div
                            key={ad.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                              ad.enabled ? "border-green-200 shadow-lg" : "border-gray-200 opacity-60"
                            }`}
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    ad.enabled ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gray-200"
                                  }`}>
                                    <PosIcon className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-gray-800">{ad.name || posInfo?.name}</h3>
                                    <p className="text-sm text-gray-500">{posInfo?.description}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleAdEnabled(ad.id)}
                                  className={`p-1.5 rounded-lg transition ${
                                    ad.enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {ad.enabled ? <FiToggleRight className="w-6 h-6" /> : <FiToggleLeft className="w-6 h-6" />}
                                </button>
                              </div>

                              <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                  <TypeIcon className="w-3 h-3" /> {typeInfo?.name}
                                </span>
                                {ad.size && (
                                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                                    {ad.size}
                                  </span>
                                )}
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <code className="text-xs text-gray-600 line-clamp-2">{ad.code.substring(0, 100)}...</code>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingAd(ad)}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
                                >
                                  <FiEdit2 className="w-4 h-4" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAd(ad.id)}
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 font-medium transition"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Position Reference */}
                  <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiEye className="text-primary" /> Available Ad Positions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {AD_POSITIONS.map((pos) => {
                        const Icon = pos.icon;
                        const isUsed = settings.adPlacements.some((a) => a.position === pos.id);
                        return (
                          <div
                            key={pos.id}
                            className={`p-3 rounded-xl border-2 transition ${
                              isUsed ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${isUsed ? "text-green-600" : "text-gray-400"}`} />
                              <span className="font-medium text-sm text-gray-700">{pos.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{pos.description}</p>
                            {isUsed && <span className="text-xs text-green-600 font-medium">● Active</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "adsense" && (
                <motion.div key="adsense" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="font-bold text-blue-800 mb-1">Google AdSense Configuration</h3>
                      <p className="text-sm text-blue-600">Configure your AdSense account. These values are injected into all public pages automatically.</p>
                    </div>

                    {/* Publisher ID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">AdSense Publisher ID</label>
                      <input
                        type="text"
                        value={settings.adsensePublisherId}
                        onChange={(e) => setSettings({ ...settings, adsensePublisherId: e.target.value.trim() })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono"
                        placeholder="ca-pub-9162211780712502"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your AdSense publisher ID (starts with ca-pub-)</p>
                    </div>

                    {/* Global AdSense Script */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Global AdSense Script (injected in &lt;head&gt;)</label>
                      <textarea
                        value={settings.adsCode}
                        onChange={(e) => setSettings({ ...settings, adsCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono text-sm"
                        rows={5}
                        placeholder={"<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>"}
                      />
                    </div>

                    {/* AdSense Meta Verification */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">AdSense Meta Verification Tag</label>
                      <textarea
                        value={settings.adsenseMeta}
                        onChange={(e) => setSettings({ ...settings, adsenseMeta: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono text-sm"
                        rows={3}
                        placeholder={"<meta name=\"google-adsense-account\" content=\"ca-pub-9162211780712502\">"}
                      />
                      <p className="text-xs text-gray-500 mt-1">Site verification meta tag from AdSense</p>
                    </div>

                    {/* Auto Ads Toggle */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Google Auto Ads</label>
                          <p className="text-xs text-gray-500 mt-0.5">Let Google automatically place ads on your pages. Works alongside manual placements.</p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, enableAutoAds: !settings.enableAutoAds })}
                          className={`p-1 rounded-full transition ${settings.enableAutoAds ? "text-green-600" : "text-gray-400"}`}
                        >
                          {settings.enableAutoAds ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
                        </button>
                      </div>
                      {settings.enableAutoAds && (
                        <div className="mt-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Excluded Routes (comma-separated)</label>
                          <input
                            type="text"
                            value={settings.autoAdsExcludedRoutes}
                            onChange={(e) => setSettings({ ...settings, autoAdsExcludedRoutes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono text-sm"
                            placeholder="/admin,/login,/register,/error"
                          />
                          <p className="text-xs text-gray-500 mt-1">Routes where Auto Ads will NOT appear (e.g. /admin,/login,/register)</p>
                        </div>
                      )}
                    </div>

                    {/* Quick Setup */}
                    {!settings.adsensePublisherId && (
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          adsensePublisherId: "ca-pub-9162211780712502",
                          adsCode: "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9162211780712502\" crossorigin=\"anonymous\"></script>",
                          adsenseMeta: "<meta name=\"google-adsense-account\" content=\"ca-pub-9162211780712502\">",
                        })}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold text-sm"
                      >
                        Auto-fill with default Publisher ID (ca-pub-9162211780712502)
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "adstxt" && (
                <motion.div key="adstxt" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <h3 className="font-bold text-green-800 mb-1">ads.txt Editor</h3>
                      <p className="text-sm text-green-600">Authorized digital sellers file. Changes are written directly to /ads.txt on save.</p>
                    </div>

                    <textarea
                      value={settings.adsTxt}
                      onChange={(e) => setSettings({ ...settings, adsTxt: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono text-sm"
                      rows={8}
                      placeholder="google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
                    />

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600"><strong>Format:</strong> domain, publisher-id, relationship, certification-id</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSettings({ ...settings, adsTxt: DEFAULT_ADS_TXT })}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
                      >
                        Reset to Default
                      </button>
                      <a
                        href="https://luvrix.com/ads.txt"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-700 transition"
                      >
                        Verify Live ads.txt
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "global" && (
                <motion.div key="global" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                    {/* Enable/Disable Ads */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <FiMonitor className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Enable All Ads</p>
                          <p className="text-sm text-gray-500">Master switch for all advertisements</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, adsEnabled: !settings.adsEnabled })}
                        className={`p-2 rounded-xl transition-all ${
                          settings.adsEnabled ? "bg-green-100 text-green-600 shadow-lg shadow-green-100" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {settings.adsEnabled ? <FiToggleRight className="w-10 h-10" /> : <FiToggleLeft className="w-10 h-10" />}
                      </button>
                    </div>

                    {/* Global Ad Code (AdSense) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Global Ad Script (AdSense Header Code)
                      </label>
                      <textarea
                        value={settings.adsCode}
                        onChange={(e) => setSettings({ ...settings, adsCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono text-sm"
                        rows={6}
                        placeholder={"<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>"}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        This code is loaded globally on all pages. Add your AdSense verification script here.
                      </p>
                    </div>

                    {/* Blog Ad Settings */}
                    <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <h3 className="font-bold text-amber-800 mb-3">Blog In-Content Ad Interval</h3>
                      <p className="text-sm text-amber-700 mb-3">Number of paragraphs between in-content ads on blog posts.</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={2}
                          max={20}
                          value={settings.blogAdInterval}
                          onChange={(e) => setSettings({ ...settings, blogAdInterval: parseInt(e.target.value) || 4 })}
                          className="w-24 px-3 py-2 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:outline-none text-center font-bold"
                        />
                        <span className="text-sm text-amber-700">paragraphs between ads</span>
                      </div>
                      <p className="text-xs text-amber-600 mt-2">Recommended: 3-6. Lower = more ads. Higher = better reading flow.</p>
                    </div>

                    {/* Ad Types Reference */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                      <h3 className="font-bold text-blue-800 mb-3">Supported Ad Types</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {AD_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <div key={type.id} className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                              <Icon className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm text-gray-700">{type.name}</p>
                                <p className="text-xs text-gray-500">{type.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {(showAddModal || editingAd) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => { setShowAddModal(false); setEditingAd(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                      {editingAd ? "Edit Ad Placement" : "Add New Ad Placement"}
                    </h2>
                    <button
                      onClick={() => { setShowAddModal(false); setEditingAd(null); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Name (Optional)</label>
                    <input
                      type="text"
                      value={editingAd ? editingAd.name : newAd.name}
                      onChange={(e) => editingAd 
                        ? setEditingAd({ ...editingAd, name: e.target.value })
                        : setNewAd({ ...newAd, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                      placeholder="e.g., Homepage Banner"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position *</label>
                    <select
                      value={editingAd ? editingAd.position : newAd.position}
                      onChange={(e) => editingAd
                        ? setEditingAd({ ...editingAd, position: e.target.value })
                        : setNewAd({ ...newAd, position: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                    >
                      <option value="">Select position...</option>
                      {AD_POSITIONS.map((pos) => (
                        <option key={pos.id} value={pos.id}>{pos.name} - {pos.description}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {AD_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = (editingAd ? editingAd.type : newAd.type) === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => editingAd
                              ? setEditingAd({ ...editingAd, type: type.id })
                              : setNewAd({ ...newAd, type: type.id })
                            }
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              isSelected
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 hover:border-gray-300 text-gray-600"
                            }`}
                          >
                            <Icon className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs font-medium">{type.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                    <input
                      type="text"
                      value={editingAd ? editingAd.size : newAd.size}
                      onChange={(e) => editingAd
                        ? setEditingAd({ ...editingAd, size: e.target.value })
                        : setNewAd({ ...newAd, size: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none"
                      placeholder="e.g., 728x90, 300x250, Responsive"
                    />
                  </div>

                  {/* Device Targeting */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Device Targeting</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DEVICE_TARGETS.map((d) => {
                        const isSelected = (editingAd ? editingAd.devices : newAd.devices) === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => editingAd
                              ? setEditingAd({ ...editingAd, devices: d.id })
                              : setNewAd({ ...newAd, devices: d.id })
                            }
                            className={`p-2.5 rounded-xl border-2 transition-all text-center text-xs font-medium ${
                              isSelected ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600"
                            }`}
                          >
                            {d.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Page Targeting */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Page Targeting</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAGE_TARGETS.map((p) => {
                        const currentPages = editingAd ? (editingAd.pages || ["all"]) : (newAd.pages || ["all"]);
                        const isSelected = currentPages.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              let newPages;
                              if (p.id === "all") {
                                newPages = ["all"];
                              } else {
                                newPages = isSelected
                                  ? currentPages.filter(x => x !== p.id)
                                  : [...currentPages.filter(x => x !== "all"), p.id];
                                if (newPages.length === 0) newPages = ["all"];
                              }
                              editingAd
                                ? setEditingAd({ ...editingAd, pages: newPages })
                                : setNewAd({ ...newAd, pages: newPages });
                            }}
                            className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                              isSelected ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
                            }`}
                          >
                            {isSelected ? "✓ " : ""}{p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ad Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Code *</label>
                    <textarea
                      value={editingAd ? editingAd.code : newAd.code}
                      onChange={(e) => editingAd
                        ? setEditingAd({ ...editingAd, code: e.target.value })
                        : setNewAd({ ...newAd, code: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none font-mono text-sm"
                      rows={6}
                      placeholder="Paste your ad code here..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => { setShowAddModal(false); setEditingAd(null); }}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingAd ? handleUpdateAd : handleAddAd}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-semibold shadow-lg"
                  >
                    {editingAd ? "Update" : "Add"} Placement
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
