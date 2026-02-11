import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { motion } from "framer-motion";
import { FiExternalLink, FiGlobe, FiBook, FiFileText, FiLayers, FiGrid, FiCheck, FiZap, FiSend, FiRefreshCw, FiGift, FiToggleLeft, FiToggleRight, FiClock } from "react-icons/fi";
import { getSettings, updateSettings } from "../../lib/api-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

const SITEMAPS = [
  { name: "Sitemap Index", url: "/sitemap.xml", description: "Main index linking all sitemaps", icon: FiLayers, color: "bg-gradient-to-br from-primary to-secondary", key: "Index" },
  { name: "Static Pages", url: "/sitemap-pages.xml", description: "Homepage, about, contact, policies", icon: FiGlobe, color: "bg-gradient-to-br from-blue-500 to-blue-600", key: "Pages" },
  { name: "Blog Posts", url: "/sitemap-posts.xml", description: "All approved blog posts", icon: FiFileText, color: "bg-gradient-to-br from-green-500 to-green-600", key: "Posts" },
  { name: "Manga", url: "/sitemap-manga.xml", description: "All manga main pages", icon: FiBook, color: "bg-gradient-to-br from-purple-500 to-purple-600", key: "Manga" },
  { name: "Categories", url: "/sitemap-categories.xml", description: "Blog category pages", icon: FiGrid, color: "bg-gradient-to-br from-orange-500 to-orange-600", key: "Categories" },
  { name: "Giveaways", url: "/sitemap-giveaways.xml", description: "Active and past giveaways", icon: FiGift, color: "bg-gradient-to-br from-pink-500 to-pink-600", key: "Giveaways" },
];

export default function SitemapAdmin() {
  return (
    <AdminGuard>
      <SitemapAdminContent />
    </AdminGuard>
  );
}

function SitemapAdminContent() {
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [sitemapCounts, setSitemapCounts] = useState({});
  const [lastPing, setLastPing] = useState(null);
  const [settings, setSettings] = useState(null);
  const [savingToggle, setSavingToggle] = useState(false);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      if (data?.lastGooglePing) setLastPing(data.lastGooglePing);
    });
  }, []);

  const toggleSitemapSetting = async (key) => {
    if (!settings || savingToggle) return;
    setSavingToggle(true);
    const newValue = settings[key] === false ? true : false;
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);
    try {
      await updateSettings({ [key]: newValue });
    } catch (error) {
      console.error("Failed to update setting:", error);
    } finally {
      setSavingToggle(false);
    }
  };

  const pingGoogle = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const response = await fetch("/api/sitemap/ping-google");
      const data = await response.json();
      if (data.success) {
        setPingResult("success");
        if (data.lastPing) setLastPing(data.lastPing);
      } else {
        setPingResult("error");
      }
    } catch (error) {
      console.error("Error pinging Google:", error);
      setPingResult("error");
    } finally {
      setPinging(false);
    }
  };

  const refreshSitemaps = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    const endpoints = [
      { name: "Index", url: "/api/sitemap/" },
      { name: "Pages", url: "/api/sitemap/pages/" },
      { name: "Posts", url: "/api/sitemap/posts/" },
      { name: "Manga", url: "/api/sitemap/manga/" },
      { name: "Categories", url: "/api/sitemap/categories/" },
      { name: "Giveaways", url: "/api/sitemap/giveaways/" },
    ];
    try {
      const results = await Promise.all(
        endpoints.map(async (ep) => {
          const res = await fetch(ep.url);
          const text = await res.text();
          const urlCount = (text.match(/<url>/g) || []).length || (text.match(/<sitemap>/g) || []).length;
          return { name: ep.name, ok: res.ok, urls: urlCount };
        })
      );
      const counts = {};
      results.forEach((r) => { counts[r.name] = r.urls; });
      setSitemapCounts(counts);
      setRefreshResult(results.every((r) => r.ok) ? "success" : "partial");
    } catch (error) {
      console.error("Error refreshing sitemaps:", error);
      setRefreshResult("error");
    } finally {
      setRefreshing(false);
    }
  };

  const totalUrls = Object.values(sitemapCounts).reduce((sum, c) => sum + (c || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Sitemap Manager</h1>
              <p className="text-gray-600">Enterprise dynamic sitemaps — fully DB-driven, no rebuild required</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshSitemaps}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiRefreshCw />
                )}
                Refresh Counts
              </button>
              <button
                onClick={pingGoogle}
                disabled={pinging}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {pinging ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend />
                )}
                Ping Google Now
              </button>
            </div>
          </div>

          {/* Last Ping Timestamp */}
          {lastPing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              Last Google Ping: <strong>{new Date(lastPing).toLocaleString()}</strong>
            </div>
          )}

          {/* Ping/Refresh Results */}
          {pingResult && (
            <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${pingResult === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {pingResult === "success" ? "✓ Google pinged successfully! Sitemap submitted for crawling." : "✗ Failed to ping Google. Try again."}
            </div>
          )}
          {refreshResult && (
            <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${refreshResult === "success" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
              {refreshResult === "success" ? (
                <div>
                  <p className="font-bold mb-2">✓ All sitemaps refreshed — {totalUrls} total URLs</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sitemapCounts).map(([name, count]) => (
                      <span key={name} className="px-2 py-1 bg-blue-100 rounded text-xs">{name}: {count} URLs</span>
                    ))}
                  </div>
                </div>
              ) : "⚠ Some sitemaps had issues refreshing."}
            </div>
          )}

          {/* Toggles Section */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sitemap Includes</h2>
            <p className="text-sm text-gray-500 mb-4">Toggle which content types are included in your sitemap index.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: "sitemapIncludeManga", label: "Include Manga", icon: FiBook },
                { key: "sitemapIncludeCategories", label: "Include Categories", icon: FiGrid },
                { key: "sitemapIncludeGiveaways", label: "Include Giveaways", icon: FiGift },
              ].map((toggle) => {
                const isEnabled = settings?.[toggle.key] !== false;
                const Icon = toggle.icon;
                return (
                  <button
                    key={toggle.key}
                    onClick={() => toggleSitemapSetting(toggle.key)}
                    disabled={savingToggle}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isEnabled ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                  >
                    <Icon className={`w-5 h-5 ${isEnabled ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${isEnabled ? "text-green-700" : "text-gray-500"}`}>{toggle.label}</span>
                    {isEnabled ? (
                      <FiToggleRight className="w-6 h-6 text-green-500 ml-auto" />
                    ) : (
                      <FiToggleLeft className="w-6 h-6 text-gray-400 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiZap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Dynamic Sitemap Architecture</h2>
                <p className="text-green-100 mb-3">
                  All sitemaps are powered by MongoDB queries. They update instantly when you publish content. No rebuild required. Scalable to 100k+ URLs.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ Auto-updates</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ Google ping</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ IndexNow</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ Self-hosted</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ 50k auto-split</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sitemap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SITEMAPS.map((sitemap) => {
              const Icon = sitemap.icon;
              const count = sitemapCounts[sitemap.key];
              return (
                <motion.a
                  key={sitemap.url}
                  href={`${SITE_URL}${sitemap.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${sitemap.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{sitemap.name}</h3>
                        {count !== undefined && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{count}</span>
                        )}
                        <FiExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{sitemap.description}</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{sitemap.url}</code>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: 1, title: "Publish Content", desc: "Add manga, blogs, or giveaways", color: "blue" },
                { step: 2, title: "Auto-Saved", desc: "Content saved to MongoDB", color: "purple" },
                { step: 3, title: "Sitemap Updates", desc: "Dynamic API generates XML on-demand", color: "green" },
                { step: 4, title: "Search Engines Notified", desc: "Google Ping + IndexNow auto-fired", color: "orange" },
              ].map((item) => (
                <div key={item.step} className="text-center p-4">
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <span className={`text-xl font-bold text-${item.color}-600`}>{item.step}</span>
                  </div>
                  <h3 className="font-medium text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Google Search Console + Server Status */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiCheck className="text-green-500" /> Submit to Google
              </h2>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-medium">1</span>
                  <span>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Search Console</a></span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-medium">2</span>
                  <span>Select your property: <code className="bg-gray-100 px-1 rounded">{SITE_URL}</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-medium">3</span>
                  <span>Go to Sitemaps → Add: <code className="bg-gray-100 px-2 py-1 rounded font-mono">/sitemap.xml</code></span>
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">API Endpoints</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-xs overflow-x-auto">
                {SITEMAPS.map((s) => (
                  <p key={s.url}>
                    <span className="text-gray-500">{s.name}:</span>{" "}
                    <a href={`${SITE_URL}${s.url}`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}{s.url}</a>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
