import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/api-client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSave, FiImage, FiDroplet, FiLayout, FiType, FiHome, FiBook, FiFileText,
  FiMail, FiChevronRight, FiCheck, FiZap, FiHeart, FiStar, FiTrendingUp, 
  FiGrid, FiLayers, FiEye, FiEdit3
} from "react-icons/fi";

const presetColors = [
  { name: "Pink", value: "#ff0055" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Cyan", value: "#06b6d4" },
];

const gradientPresets = [
  { name: "Sunset", from: "#ff0055", to: "#ff6b35" },
  { name: "Ocean", from: "#3b82f6", to: "#06b6d4" },
  { name: "Galaxy", from: "#8b5cf6", to: "#ec4899" },
  { name: "Night", from: "#1e293b", to: "#475569" },
];

const iconOptions = [
  { name: "Zap", icon: FiZap },
  { name: "Heart", icon: FiHeart },
  { name: "Star", icon: FiStar },
  { name: "Trending", icon: FiTrendingUp },
  { name: "Grid", icon: FiGrid },
  { name: "Layers", icon: FiLayers },
];

export default function AdminTheme() {
  return (
    <AdminGuard>
      <ThemeContent />
    </AdminGuard>
  );
}

function ThemeContent() {
  const [activeTab, setActiveTab] = useState("brand");
  const [settings, setSettings] = useState({
    // Brand
    siteName: "Luvrix",
    siteTagline: "Stories & Knowledge",
    logoUrl: "",
    faviconUrl: "",
    logoIcon: "Zap",
    // Colors
    themeColor: "#ff0055",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
    gradientFrom: "#ff0055",
    gradientTo: "#8b5cf6",
    headerBg: "#ffffff",
    footerBg: "#1e293b",
    bodyBg: "#f8fafc",
    cardBg: "#ffffff",
    headingColor: "#1e293b",
    textColor: "#475569",
    mutedColor: "#94a3b8",
    linkColor: "#ff0055",
    // Footer
    footerText: "© 2026 Luvrix.com - All Rights Reserved",
    footerDescription: "Your trusted source for blogs, manga, and entertainment.",
    // Header
    headerMenu: ["News", "Anime", "Manga", "Technology"],
    // Homepage
    heroTitle: "Discover Amazing Stories",
    heroSubtitle: "Explore blogs, manga, and more from our community",
    heroButtonText: "Get Started",
    heroButtonLink: "/register",
    featuredTitle: "Featured Posts",
    latestTitle: "Latest Articles",
    mangaTitle: "Popular Manga",
    leaderboardTitle: "Top Creators",
    // About
    aboutTitle: "About Luvrix",
    aboutDescription: "We are a community-driven platform for creators.",
    // Contact
    contactTitle: "Get in Touch",
    contactDescription: "Have questions? We'd love to hear from you.",
    contactEmail: "contact@luvrix.com",
    // Social
    socialFacebook: "",
    socialTwitter: "",
    socialInstagram: "",
    socialYoutube: "",
    socialDiscord: "",
    // Styles
    buttonRadius: "xl",
    cardRadius: "2xl",
    cardShadow: "lg",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "brand", label: "Brand", icon: FiZap },
    { id: "colors", label: "Colors", icon: FiDroplet },
    { id: "homepage", label: "Homepage", icon: FiHome },
    { id: "pages", label: "Pages", icon: FiFileText },
    { id: "footer", label: "Footer & Social", icon: FiMail },
    { id: "styles", label: "Styles", icon: FiLayout },
  ];

  const SelectedIcon = iconOptions.find(i => i.name === settings.logoIcon)?.icon || FiZap;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated Theme Settings",
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

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 px-4 md:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FiDroplet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white">Theme Customizer</h1>
                  <p className="text-slate-400 text-sm">Full control over your website appearance</p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : saved ? <><FiCheck className="w-5 h-5" /> Saved!</> : <><FiSave className="w-5 h-5" /> Save All</>}
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Tabs - Mobile horizontal scroll, Desktop vertical */}
              <div className="lg:w-56 shrink-0">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden lg:sticky lg:top-24">
                  <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
                    {tabs.map((tab) => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 lg:w-full px-4 py-3 lg:py-4 flex items-center gap-3 text-left transition-all border-b-2 lg:border-b-0 lg:border-l-4 ${
                          activeTab === tab.id ? "bg-purple-50 border-purple-500 text-purple-700" : "border-transparent text-slate-600 hover:bg-slate-50"
                        }`}>
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium text-sm whitespace-nowrap">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-6">
                {/* Brand Tab */}
                {activeTab === "brand" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FiZap className="text-purple-500" /> Brand Identity</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Site Name</label>
                          <input type="text" value={settings.siteName} onChange={(e) => updateSetting("siteName", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Luvrix" /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Tagline</label>
                          <input type="text" value={settings.siteTagline} onChange={(e) => updateSetting("siteTagline", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Stories & Knowledge" /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Logo URL</label>
                          <input type="url" value={settings.logoUrl} onChange={(e) => updateSetting("logoUrl", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder="https://..." /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Favicon URL</label>
                          <input type="url" value={settings.faviconUrl} onChange={(e) => updateSetting("faviconUrl", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder="https://..." /></div>
                      </div>
                      <div className="mt-6"><label className="text-sm font-semibold text-slate-700 mb-3 block">Logo Icon</label>
                        <div className="flex flex-wrap gap-3">
                          {iconOptions.map((opt) => (
                            <button key={opt.name} onClick={() => updateSetting("logoIcon", opt.name)}
                              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${settings.logoIcon === opt.name ? "border-purple-500 bg-purple-50 text-purple-600" : "border-slate-200 text-slate-400 hover:border-purple-300"}`}>
                              <opt.icon className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-2">Preview:</p>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${settings.gradientFrom}, ${settings.gradientTo})` }}>
                            <SelectedIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-lg font-black" style={{ color: settings.headingColor }}>{settings.siteName || "Luvrix"}</p>
                            <p className="text-xs" style={{ color: settings.mutedColor }}>{settings.siteTagline}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Colors Tab */}
                {activeTab === "colors" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6"><FiDroplet className="inline text-purple-500 mr-2" />Primary Colors</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{ key: "themeColor", label: "Primary" }, { key: "secondaryColor", label: "Secondary" }, { key: "accentColor", label: "Accent" }].map((c) => (
                          <div key={c.key}><label className="text-sm font-semibold text-slate-700 mb-2 block">{c.label}</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={settings[c.key]} onChange={(e) => updateSetting(c.key, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                              <input type="text" value={settings[c.key]} onChange={(e) => updateSetting(c.key, e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4"><label className="text-sm font-semibold text-slate-700 mb-3 block">Quick Presets</label>
                        <div className="flex flex-wrap gap-2">
                          {presetColors.map((color) => (
                            <button key={color.value} onClick={() => updateSetting("themeColor", color.value)}
                              className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${settings.themeColor === color.value ? "ring-2 ring-offset-2 ring-slate-400" : ""}`} style={{ backgroundColor: color.value }} title={color.name} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Gradient</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">From</label>
                          <div className="flex items-center gap-2"><input type="color" value={settings.gradientFrom} onChange={(e) => updateSetting("gradientFrom", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                            <input type="text" value={settings.gradientFrom} onChange={(e) => updateSetting("gradientFrom", e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" /></div></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">To</label>
                          <div className="flex items-center gap-2"><input type="color" value={settings.gradientTo} onChange={(e) => updateSetting("gradientTo", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                            <input type="text" value={settings.gradientTo} onChange={(e) => updateSetting("gradientTo", e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" /></div></div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {gradientPresets.map((g) => (
                          <button key={g.name} onClick={() => { updateSetting("gradientFrom", g.from); updateSetting("gradientTo", g.to); }}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow hover:scale-105 transition-all" style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}>{g.name}</button>
                        ))}
                      </div>
                      <div className="p-4 rounded-xl text-white text-center font-semibold" style={{ background: `linear-gradient(135deg, ${settings.gradientFrom}, ${settings.gradientTo})` }}>Gradient Preview</div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Background & Text Colors</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[{ key: "headerBg", label: "Header BG" }, { key: "footerBg", label: "Footer BG" }, { key: "bodyBg", label: "Body BG" }, { key: "cardBg", label: "Card BG" },
                          { key: "headingColor", label: "Headings" }, { key: "textColor", label: "Text" }, { key: "mutedColor", label: "Muted" }, { key: "linkColor", label: "Links" }].map((c) => (
                          <div key={c.key}><label className="text-xs font-semibold text-slate-600 mb-1 block">{c.label}</label>
                            <div className="flex items-center gap-1"><input type="color" value={settings[c.key]} onChange={(e) => updateSetting(c.key, e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                              <input type="text" value={settings[c.key]} onChange={(e) => updateSetting(c.key, e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" /></div></div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Homepage Tab */}
                {activeTab === "homepage" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6"><FiHome className="inline text-purple-500 mr-2" />Hero Section</h2>
                      <div className="space-y-4">
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Hero Title</label>
                          <input type="text" value={settings.heroTitle} onChange={(e) => updateSetting("heroTitle", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder="Discover Amazing Stories" /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Hero Subtitle</label>
                          <textarea value={settings.heroSubtitle} onChange={(e) => updateSetting("heroSubtitle", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" rows={2} placeholder="Explore blogs, manga, and more" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Button Text</label>
                            <input type="text" value={settings.heroButtonText} onChange={(e) => updateSetting("heroButtonText", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder="Get Started" /></div>
                          <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Button Link</label>
                            <input type="text" value={settings.heroButtonLink} onChange={(e) => updateSetting("heroButtonLink", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder="/register" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Section Titles</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[{ key: "featuredTitle", label: "Featured Section" }, { key: "latestTitle", label: "Latest Section" }, { key: "mangaTitle", label: "Manga Section" }, { key: "leaderboardTitle", label: "Leaderboard" }].map((s) => (
                          <div key={s.key}><label className="text-sm font-semibold text-slate-700 mb-2 block">{s.label}</label>
                            <input type="text" value={settings[s.key]} onChange={(e) => updateSetting(s.key, e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Pages Tab */}
                {activeTab === "pages" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6"><FiFileText className="inline text-purple-500 mr-2" />About Page</h2>
                      <div className="space-y-4">
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">About Title</label>
                          <input type="text" value={settings.aboutTitle} onChange={(e) => updateSetting("aboutTitle", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">About Description</label>
                          <textarea value={settings.aboutDescription} onChange={(e) => updateSetting("aboutDescription", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" rows={3} /></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Contact Page</h3>
                      <div className="space-y-4">
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Contact Title</label>
                          <input type="text" value={settings.contactTitle} onChange={(e) => updateSetting("contactTitle", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Contact Description</label>
                          <textarea value={settings.contactDescription} onChange={(e) => updateSetting("contactDescription", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" rows={2} /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Contact Email</label>
                          <input type="email" value={settings.contactEmail} onChange={(e) => updateSetting("contactEmail", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Footer & Social Tab */}
                {activeTab === "footer" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6"><FiMail className="inline text-purple-500 mr-2" />Footer Content</h2>
                      <div className="space-y-4">
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Footer Description</label>
                          <textarea value={settings.footerDescription} onChange={(e) => updateSetting("footerDescription", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" rows={2} /></div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-2 block">Copyright Text</label>
                          <input type="text" value={settings.footerText} onChange={(e) => updateSetting("footerText", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Social Media Links</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[{ key: "socialFacebook", label: "Facebook" }, { key: "socialTwitter", label: "Twitter/X" }, { key: "socialInstagram", label: "Instagram" }, { key: "socialYoutube", label: "YouTube" }, { key: "socialDiscord", label: "Discord" }].map((s) => (
                          <div key={s.key}><label className="text-sm font-semibold text-slate-700 mb-2 block">{s.label}</label>
                            <input type="url" value={settings[s.key]} onChange={(e) => updateSetting(s.key, e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder={`https://${s.label.toLowerCase()}.com/...`} /></div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Styles Tab */}
                {activeTab === "styles" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6"><FiLayout className="inline text-purple-500 mr-2" />Button Styles</h2>
                      <div><label className="text-sm font-semibold text-slate-700 mb-3 block">Border Radius</label>
                        <div className="flex flex-wrap gap-2">
                          {["sm", "md", "lg", "xl", "2xl", "full"].map((r) => (
                            <button key={r} onClick={() => updateSetting("buttonRadius", r)}
                              className={`px-4 py-2 border-2 rounded-lg transition-all ${settings.buttonRadius === r ? "border-purple-500 bg-purple-50 text-purple-600" : "border-slate-200 text-slate-500"}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-3">Preview:</p>
                        <button className={`px-6 py-2.5 font-semibold text-white rounded-${settings.buttonRadius}`} style={{ backgroundColor: settings.themeColor }}>Primary Button</button>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Card Styles</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div><label className="text-sm font-semibold text-slate-700 mb-3 block">Border Radius</label>
                          <div className="flex flex-wrap gap-2">
                            {["lg", "xl", "2xl", "3xl"].map((r) => (
                              <button key={r} onClick={() => updateSetting("cardRadius", r)}
                                className={`px-3 py-2 border-2 rounded-lg transition-all ${settings.cardRadius === r ? "border-purple-500 bg-purple-50 text-purple-600" : "border-slate-200 text-slate-500"}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700 mb-3 block">Shadow</label>
                          <div className="flex flex-wrap gap-2">
                            {["sm", "md", "lg", "xl", "2xl"].map((s) => (
                              <button key={s} onClick={() => updateSetting("cardShadow", s)}
                                className={`px-3 py-2 border-2 rounded-lg transition-all ${settings.cardShadow === s ? "border-purple-500 bg-purple-50 text-purple-600" : "border-slate-200 text-slate-500"}`}>{s}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
