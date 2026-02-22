import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/firebase-client";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { 
  FiSave, FiDroplet, FiLayout, FiType, FiHome, FiBook, FiFileText,
  FiMail, FiCheck, FiZap, FiHeart, FiStar, FiTrendingUp, 
  FiGrid, FiLayers, FiEye, FiSun, FiMoon
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

// Blog reading color presets — deep to light shades
const textColorPresets = {
  light: [
    { name: "Near Black", value: "#111827" },
    { name: "Dark Gray", value: "#1f2937" },
    { name: "Gray 700", value: "#374151" },
    { name: "Gray 600", value: "#4b5563" },
    { name: "Gray 500", value: "#6b7280" },
    { name: "Slate 700", value: "#334155" },
    { name: "Slate 600", value: "#475569" },
    { name: "Zinc 700", value: "#3f3f46" },
    { name: "Stone 700", value: "#44403c" },
    { name: "Neutral 700", value: "#404040" },
  ],
  dark: [
    { name: "White", value: "#ffffff" },
    { name: "Gray 50", value: "#f9fafb" },
    { name: "Gray 100", value: "#f3f4f6" },
    { name: "Gray 200", value: "#e5e7eb" },
    { name: "Gray 300", value: "#d1d5db" },
    { name: "Gray 400", value: "#9ca3af" },
    { name: "Slate 200", value: "#e2e8f0" },
    { name: "Slate 300", value: "#cbd5e1" },
    { name: "Zinc 200", value: "#e4e4e7" },
    { name: "Stone 200", value: "#e7e5e4" },
  ],
};

const headingColorPresets = {
  light: [
    { name: "Black", value: "#000000" },
    { name: "Near Black", value: "#111827" },
    { name: "Gray 800", value: "#1f2937" },
    { name: "Gray 900", value: "#030712" },
    { name: "Slate 900", value: "#0f172a" },
    { name: "Slate 800", value: "#1e293b" },
    { name: "Zinc 900", value: "#18181b" },
    { name: "Stone 900", value: "#1c1917" },
  ],
  dark: [
    { name: "White", value: "#ffffff" },
    { name: "Gray 50", value: "#f9fafb" },
    { name: "Gray 100", value: "#f3f4f6" },
    { name: "Gray 200", value: "#e5e7eb" },
    { name: "Slate 100", value: "#f1f5f9" },
    { name: "Slate 200", value: "#e2e8f0" },
    { name: "Zinc 100", value: "#f4f4f5" },
    { name: "Stone 100", value: "#f5f5f4" },
  ],
};

// Typography spacing presets
const spacingPresets = [
  { label: "0", value: "0" },
  { label: "0.25", value: "0.25rem" },
  { label: "0.5", value: "0.5rem" },
  { label: "0.75", value: "0.75rem" },
  { label: "1", value: "1rem" },
  { label: "1.25", value: "1.25rem" },
  { label: "1.5", value: "1.5rem" },
  { label: "2", value: "2rem" },
  { label: "2.25", value: "2.25rem" },
  { label: "2.5", value: "2.5rem" },
  { label: "3", value: "3rem" },
  { label: "3.5", value: "3.5rem" },
  { label: "4", value: "4rem" },
];

const lineHeightPresets = [
  { label: "Tight (1.25)", value: "1.25" },
  { label: "Snug (1.375)", value: "1.375" },
  { label: "Normal (1.5)", value: "1.5" },
  { label: "Relaxed (1.625)", value: "1.625" },
  { label: "Loose (2)", value: "2" },
  { label: "Extra Loose (2.25)", value: "2.25" },
];

const letterSpacingPresets = [
  { label: "Tighter (-0.05em)", value: "-0.05em" },
  { label: "Tight (-0.025em)", value: "-0.025em" },
  { label: "Normal (0)", value: "0em" },
  { label: "Wide (0.01em)", value: "0.01em" },
  { label: "Wider (0.025em)", value: "0.025em" },
  { label: "Widest (0.05em)", value: "0.05em" },
  { label: "Extra Wide (0.1em)", value: "0.1em" },
];

const wordSpacingPresets = [
  { label: "Normal (0)", value: "0em" },
  { label: "Slight (0.02em)", value: "0.02em" },
  { label: "Wide (0.05em)", value: "0.05em" },
  { label: "Wider (0.1em)", value: "0.1em" },
  { label: "Widest (0.15em)", value: "0.15em" },
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
    // Blog Reading
    defaultTheme: "light",
    blogTextColorLight: "#374151",
    blogTextColorDark: "#e5e7eb",
    blogHeadingColorLight: "#111827",
    blogHeadingColorDark: "#f3f4f6",
    blogLinkColorLight: "#ff0055",
    blogLinkColorDark: "#ff0055",
    // Typography Spacing
    blogH1MarginTop: "2.5rem",
    blogH1MarginBottom: "1.25rem",
    blogH2MarginTop: "2.25rem",
    blogH2MarginBottom: "1rem",
    blogH3MarginTop: "2rem",
    blogH3MarginBottom: "0.75rem",
    blogParagraphMarginBottom: "1.25rem",
    blogLineHeight: "2",
    blogLetterSpacing: "0.01em",
    blogWordSpacing: "0.02em",
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
    { id: "blog-reading", label: "Blog Reading", icon: FiBook },
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

                {/* Blog Reading Tab */}
                {activeTab === "blog-reading" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    {/* Default Theme Mode */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FiEye className="text-purple-500" /> Default Theme Mode</h2>
                      <p className="text-sm text-slate-500 mb-4">Choose which mode new visitors see by default (users can still switch manually)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => updateSetting("defaultTheme", "light")}
                          className={`p-5 rounded-xl border-2 text-center transition-all ${settings.defaultTheme === "light" ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200" : "border-slate-200 hover:border-slate-300"}`}>
                          <FiSun className={`w-8 h-8 mx-auto mb-2 ${settings.defaultTheme === "light" ? "text-amber-500" : "text-slate-400"}`} />
                          <p className="font-bold text-slate-800">Light Mode</p>
                          <p className="text-xs text-slate-500 mt-1">Clean white background</p>
                        </button>
                        <button onClick={() => updateSetting("defaultTheme", "dark")}
                          className={`p-5 rounded-xl border-2 text-center transition-all ${settings.defaultTheme === "dark" ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200" : "border-slate-200 hover:border-slate-300"}`}>
                          <FiMoon className={`w-8 h-8 mx-auto mb-2 ${settings.defaultTheme === "dark" ? "text-indigo-500" : "text-slate-400"}`} />
                          <p className="font-bold text-slate-800">Dark Mode</p>
                          <p className="text-xs text-slate-500 mt-1">Dark background, easier on eyes</p>
                        </button>
                      </div>
                    </div>

                    {/* Light Mode Colors */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><FiSun className="text-amber-500" /> Light Mode — Blog Colors</h2>
                      <p className="text-sm text-slate-500 mb-6">Colors used when reading blogs in light mode</p>
                      <div className="space-y-6">
                        {/* Text Color Light */}
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">Body Text Color</label>
                          <div className="flex items-center gap-3 mb-3">
                            <input type="color" value={settings.blogTextColorLight} onChange={(e) => updateSetting("blogTextColorLight", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={settings.blogTextColorLight} onChange={(e) => updateSetting("blogTextColorLight", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="#374151" />
                            <span className="text-xs text-slate-400">Custom hex code</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {textColorPresets.light.map((c) => (
                              <button key={c.value} onClick={() => updateSetting("blogTextColorLight", c.value)} title={c.name}
                                className={`group relative w-9 h-9 rounded-lg transition-all hover:scale-110 ${settings.blogTextColorLight === c.value ? "ring-2 ring-offset-2 ring-purple-400 scale-110" : "ring-1 ring-slate-200"}`}
                                style={{ backgroundColor: c.value }}>
                                {settings.blogTextColorLight === c.value && <FiCheck className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Heading Color Light */}
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">Heading Color</label>
                          <div className="flex items-center gap-3 mb-3">
                            <input type="color" value={settings.blogHeadingColorLight} onChange={(e) => updateSetting("blogHeadingColorLight", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={settings.blogHeadingColorLight} onChange={(e) => updateSetting("blogHeadingColorLight", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="#111827" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {headingColorPresets.light.map((c) => (
                              <button key={c.value} onClick={() => updateSetting("blogHeadingColorLight", c.value)} title={c.name}
                                className={`group relative w-9 h-9 rounded-lg transition-all hover:scale-110 ${settings.blogHeadingColorLight === c.value ? "ring-2 ring-offset-2 ring-purple-400 scale-110" : "ring-1 ring-slate-200"}`}
                                style={{ backgroundColor: c.value }}>
                                {settings.blogHeadingColorLight === c.value && <FiCheck className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Link Color Light */}
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">Link Color</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={settings.blogLinkColorLight} onChange={(e) => updateSetting("blogLinkColorLight", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={settings.blogLinkColorLight} onChange={(e) => updateSetting("blogLinkColorLight", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="#ff0055" />
                            <div className="flex flex-wrap gap-2">
                              {presetColors.slice(0, 6).map((c) => (
                                <button key={c.value} onClick={() => updateSetting("blogLinkColorLight", c.value)} title={c.name}
                                  className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${settings.blogLinkColorLight === c.value ? "ring-2 ring-offset-1 ring-purple-400" : ""}`}
                                  style={{ backgroundColor: c.value }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dark Mode Colors */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><FiMoon className="text-indigo-500" /> Dark Mode — Blog Colors</h2>
                      <p className="text-sm text-slate-500 mb-6">Colors used when reading blogs in dark mode</p>
                      <div className="space-y-6">
                        {/* Text Color Dark */}
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">Body Text Color</label>
                          <div className="flex items-center gap-3 mb-3">
                            <input type="color" value={settings.blogTextColorDark} onChange={(e) => updateSetting("blogTextColorDark", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={settings.blogTextColorDark} onChange={(e) => updateSetting("blogTextColorDark", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="#e5e7eb" />
                            <span className="text-xs text-slate-400">Custom hex code</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {textColorPresets.dark.map((c) => (
                              <button key={c.value} onClick={() => updateSetting("blogTextColorDark", c.value)} title={c.name}
                                className={`group relative w-9 h-9 rounded-lg transition-all hover:scale-110 ${settings.blogTextColorDark === c.value ? "ring-2 ring-offset-2 ring-purple-400 scale-110" : "ring-1 ring-slate-200"}`}
                                style={{ backgroundColor: c.value }}>
                                {settings.blogTextColorDark === c.value && <FiCheck className="w-4 h-4 absolute inset-0 m-auto" style={{ color: c.value === "#ffffff" || c.value === "#f9fafb" || c.value === "#f3f4f6" || c.value === "#e5e7eb" ? "#374151" : "#ffffff" }} />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Heading Color Dark */}
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">Heading Color</label>
                          <div className="flex items-center gap-3 mb-3">
                            <input type="color" value={settings.blogHeadingColorDark} onChange={(e) => updateSetting("blogHeadingColorDark", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={settings.blogHeadingColorDark} onChange={(e) => updateSetting("blogHeadingColorDark", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="#f3f4f6" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {headingColorPresets.dark.map((c) => (
                              <button key={c.value} onClick={() => updateSetting("blogHeadingColorDark", c.value)} title={c.name}
                                className={`group relative w-9 h-9 rounded-lg transition-all hover:scale-110 ${settings.blogHeadingColorDark === c.value ? "ring-2 ring-offset-2 ring-purple-400 scale-110" : "ring-1 ring-slate-200"}`}
                                style={{ backgroundColor: c.value }}>
                                {settings.blogHeadingColorDark === c.value && <FiCheck className="w-4 h-4 absolute inset-0 m-auto" style={{ color: "#374151" }} />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Link Color Dark */}
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-3 block">Link Color</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={settings.blogLinkColorDark} onChange={(e) => updateSetting("blogLinkColorDark", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                            <input type="text" value={settings.blogLinkColorDark} onChange={(e) => updateSetting("blogLinkColorDark", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="#ff0055" />
                            <div className="flex flex-wrap gap-2">
                              {presetColors.slice(0, 6).map((c) => (
                                <button key={c.value} onClick={() => updateSetting("blogLinkColorDark", c.value)} title={c.name}
                                  className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${settings.blogLinkColorDark === c.value ? "ring-2 ring-offset-1 ring-purple-400" : ""}`}
                                  style={{ backgroundColor: c.value }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Typography Spacing */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><FiType className="text-emerald-500" /> Typography Spacing</h2>
                      <p className="text-sm text-slate-500 mb-6">Control spacing around headings, paragraphs, and text properties for blog content</p>

                      {/* Heading Spacing */}
                      <div className="space-y-5">
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">Heading Margins</h3>
                        {[
                          { label: "H1 — Margin Top", key: "blogH1MarginTop" },
                          { label: "H1 — Margin Bottom", key: "blogH1MarginBottom" },
                          { label: "H2 — Margin Top", key: "blogH2MarginTop" },
                          { label: "H2 — Margin Bottom", key: "blogH2MarginBottom" },
                          { label: "H3 — Margin Top", key: "blogH3MarginTop" },
                          { label: "H3 — Margin Bottom", key: "blogH3MarginBottom" },
                          { label: "Paragraph — Margin Bottom", key: "blogParagraphMarginBottom" },
                        ].map((item) => (
                          <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label className="text-sm font-semibold text-slate-700 w-52 shrink-0">{item.label}</label>
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                value={spacingPresets.find(p => p.value === settings[item.key]) ? settings[item.key] : "__custom__"}
                                onChange={(e) => { if (e.target.value !== "__custom__") updateSetting(item.key, e.target.value); }}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 max-w-[180px]"
                              >
                                {spacingPresets.map((p) => (
                                  <option key={p.value} value={p.value}>{p.label} rem</option>
                                ))}
                                {!spacingPresets.find(p => p.value === settings[item.key]) && (
                                  <option value="__custom__">Custom</option>
                                )}
                              </select>
                              <input
                                type="text"
                                value={settings[item.key]}
                                onChange={(e) => updateSetting(item.key, e.target.value)}
                                className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                                placeholder="e.g. 2.5rem"
                              />
                            </div>
                          </div>
                        ))}

                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2 mt-6">Text Properties</h3>

                        {/* Line Height */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-sm font-semibold text-slate-700 w-52 shrink-0">Line Height</label>
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={lineHeightPresets.find(p => p.value === settings.blogLineHeight) ? settings.blogLineHeight : "__custom__"}
                              onChange={(e) => { if (e.target.value !== "__custom__") updateSetting("blogLineHeight", e.target.value); }}
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 max-w-[220px]"
                            >
                              {lineHeightPresets.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                              {!lineHeightPresets.find(p => p.value === settings.blogLineHeight) && (
                                <option value="__custom__">Custom</option>
                              )}
                            </select>
                            <input
                              type="text"
                              value={settings.blogLineHeight}
                              onChange={(e) => updateSetting("blogLineHeight", e.target.value)}
                              className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                              placeholder="e.g. 2"
                            />
                          </div>
                        </div>

                        {/* Letter Spacing */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-sm font-semibold text-slate-700 w-52 shrink-0">Letter Spacing</label>
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={letterSpacingPresets.find(p => p.value === settings.blogLetterSpacing) ? settings.blogLetterSpacing : "__custom__"}
                              onChange={(e) => { if (e.target.value !== "__custom__") updateSetting("blogLetterSpacing", e.target.value); }}
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 max-w-[220px]"
                            >
                              {letterSpacingPresets.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                              {!letterSpacingPresets.find(p => p.value === settings.blogLetterSpacing) && (
                                <option value="__custom__">Custom</option>
                              )}
                            </select>
                            <input
                              type="text"
                              value={settings.blogLetterSpacing}
                              onChange={(e) => updateSetting("blogLetterSpacing", e.target.value)}
                              className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                              placeholder="e.g. 0.01em"
                            />
                          </div>
                        </div>

                        {/* Word Spacing */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-sm font-semibold text-slate-700 w-52 shrink-0">Word Spacing</label>
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={wordSpacingPresets.find(p => p.value === settings.blogWordSpacing) ? settings.blogWordSpacing : "__custom__"}
                              onChange={(e) => { if (e.target.value !== "__custom__") updateSetting("blogWordSpacing", e.target.value); }}
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 max-w-[220px]"
                            >
                              {wordSpacingPresets.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                              {!wordSpacingPresets.find(p => p.value === settings.blogWordSpacing) && (
                                <option value="__custom__">Custom</option>
                              )}
                            </select>
                            <input
                              type="text"
                              value={settings.blogWordSpacing}
                              onChange={(e) => updateSetting("blogWordSpacing", e.target.value)}
                              className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                              placeholder="e.g. 0.02em"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><FiEye className="text-purple-500" /> Live Preview</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Light Preview */}
                        <div className="rounded-xl p-5 border border-slate-200" style={{ backgroundColor: "#ffffff" }}>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Light Mode</p>
                          <h3 className="font-bold" style={{ color: settings.blogHeadingColorLight, fontSize: "1.5rem", marginTop: settings.blogH1MarginTop, marginBottom: settings.blogH1MarginBottom }}>Sample Blog Heading</h3>
                          <h4 className="font-bold" style={{ color: settings.blogHeadingColorLight, fontSize: "1.125rem", marginTop: settings.blogH2MarginTop, marginBottom: settings.blogH2MarginBottom }}>Sub-heading Example</h4>
                          <p style={{ color: settings.blogTextColorLight, lineHeight: settings.blogLineHeight, letterSpacing: settings.blogLetterSpacing, wordSpacing: settings.blogWordSpacing, marginBottom: settings.blogParagraphMarginBottom, fontSize: "0.875rem" }}>
                            This is how your blog body text will look in light mode. Adjust the spacing above to control margins, line height, and letter spacing.
                          </p>
                          <a className="text-sm font-medium underline" style={{ color: settings.blogLinkColorLight }}>Sample link text</a>
                        </div>
                        {/* Dark Preview */}
                        <div className="rounded-xl p-5 border border-slate-700" style={{ backgroundColor: "#111827" }}>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">Dark Mode</p>
                          <h3 className="font-bold" style={{ color: settings.blogHeadingColorDark, fontSize: "1.5rem", marginTop: settings.blogH1MarginTop, marginBottom: settings.blogH1MarginBottom }}>Sample Blog Heading</h3>
                          <h4 className="font-bold" style={{ color: settings.blogHeadingColorDark, fontSize: "1.125rem", marginTop: settings.blogH2MarginTop, marginBottom: settings.blogH2MarginBottom }}>Sub-heading Example</h4>
                          <p style={{ color: settings.blogTextColorDark, lineHeight: settings.blogLineHeight, letterSpacing: settings.blogLetterSpacing, wordSpacing: settings.blogWordSpacing, marginBottom: settings.blogParagraphMarginBottom, fontSize: "0.875rem" }}>
                            This is how your blog body text will look in dark mode. Adjust the spacing above to control margins, line height, and letter spacing.
                          </p>
                          <a className="text-sm font-medium underline" style={{ color: settings.blogLinkColorDark }}>Sample link text</a>
                        </div>
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
