import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/firebase-client";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { FiSave, FiFileText, FiCode, FiDownload, FiCopy, FiCheck, FiRefreshCw } from "react-icons/fi";

const DEFAULT_ROBOTS_TXT = `# Robots.txt for Luvrix
# https://luvrix.com

User-agent: *
Allow: /
Allow: /blog
Allow: /manga
Allow: /categories
Allow: /about
Allow: /contact
Allow: /publishers
Allow: /leaderboard
Allow: /policy/

# Disallow admin and private pages
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /_next/
Disallow: /login/
Disallow: /register/

# Disallow internal chapter pages (chapters link directly to external sources)
Disallow: /manga/*/chapter*

# Disallow user-specific / transactional pages
Disallow: /profile/
Disallow: /favorites/
Disallow: /create-blog/
Disallow: /edit-blog/
Disallow: /preview-blog/
Disallow: /payment-success/
Disallow: /payment-failed/

# Disallow e-commerce / account paths
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/

# Block parameter-based crawling (spam / low-value URLs)
Disallow: /*?amp
Disallow: /*?noamp
Disallow: /*?share
Disallow: /*?add_to_wishlist
Disallow: /*?orderby
Disallow: /*?type
Disallow: /*?replytocom
Disallow: /*?product-page
Disallow: /*?nb

# Block feeds and pagination from crawling
Disallow: /feed/
Disallow: /*/feed/
Disallow: /page/
Disallow: /*/page/

# Crawl delay for polite crawling
Crawl-delay: 1

# Sitemaps
Sitemap: https://luvrix.com/sitemap.xml
Sitemap: https://luvrix.com/sitemap-pages.xml
Sitemap: https://luvrix.com/sitemap-posts.xml
Sitemap: https://luvrix.com/sitemap-manga.xml
Sitemap: https://luvrix.com/sitemap-categories.xml
`;

const DEFAULT_ADS_TXT = `google.com, pub-9162211780712502, DIRECT, f08c47fec0942fa0
`;

export default function SeoSettings() {
  return (
    <AdminGuard>
      <SeoSettingsContent />
    </AdminGuard>
  );
}

function SeoSettingsContent() {
  const [robotsTxt, setRobotsTxt] = useState(DEFAULT_ROBOTS_TXT);
  const [adsTxt, setAdsTxt] = useState(DEFAULT_ADS_TXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState({ robots: false, ads: false });
  
  // Centralized SEO Templates (single source of truth — used by all frontend pages)
  const [mangaSeoDefaults, setMangaSeoDefaults] = useState({
    titleTemplate: "{title} Manga | Luvrix",
    descriptionTemplate: "Read {title} manga online. Also known as {altNames}. Chapters 1 to {chapters} available. {genre} manga, {status}. Updated regularly on Luvrix.",
    focusKeywordTemplate: "{title} manga, read {title} online, {title} chapters, {altNames}",
    blogTitleTemplate: "{title} | Luvrix Blog",
    blogDescriptionTemplate: "Read {title} on Luvrix Blog. Discover the latest articles, guides, and news.",
    defaultOgImage: "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      if (data.robotsTxt) setRobotsTxt(data.robotsTxt);
      if (data.adsTxt) setAdsTxt(data.adsTxt);
      if (data.mangaSeoDefaults) setMangaSeoDefaults(prev => ({ ...prev, ...data.mangaSeoDefaults }));
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const [writeStatus, setWriteStatus] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setWriteStatus(null);
    try {
      // 1. Save to database
      await updateSettings({ robotsTxt, adsTxt, mangaSeoDefaults });

      // 2. Write files to disk (live sync)
      try {
        const token = (typeof auth.currentUser?.getIdToken === "function"
          ? await auth.currentUser.getIdToken()
          : null) || (typeof window !== "undefined" ? localStorage.getItem("luvrix_auth_token") : null);

        if (!token) {
          setWriteStatus({ type: "error", message: "Saved to DB but file write failed: No auth token available. Please re-login." });
        } else {
          const writeRes = await fetch("/api/admin/write-system-files", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ robotsTxt, adsTxt }),
          });
          const writeData = await writeRes.json();
          if (writeRes.ok && writeData.success) {
            setWriteStatus({ type: "success", message: "robots.txt & ads.txt updated live on server" });
          } else {
            setWriteStatus({ type: "error", message: `Saved to DB but file write failed: ${writeData.errors?.join(", ") || writeData.error || "Unknown error"}` });
          }
        }
      } catch (writeErr) {
        setWriteStatus({ type: "error", message: "Saved to DB but could not write files to disk: " + writeErr.message });
      }

      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated SEO Settings",
        targetId: "seo-settings",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      alert("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (type) => {
    const text = type === "robots" ? robotsTxt : adsTxt;
    await navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const handleDownload = (type) => {
    const text = type === "robots" ? robotsTxt : adsTxt;
    const filename = type === "robots" ? "robots.txt" : "ads.txt";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = (type) => {
    if (type === "robots") {
      setRobotsTxt(DEFAULT_ROBOTS_TXT);
    } else {
      setAdsTxt(DEFAULT_ADS_TXT);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SEO Settings</h1>
          <p className="text-gray-600 mb-8">Manage global SEO templates, robots.txt and ads.txt files</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="max-w-4xl space-y-6">
              {/* Global SEO Templates — Single Source of Truth */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiFileText className="text-purple-500" /> Global SEO Templates
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  Set default SEO templates for all manga and blog pages. Individual manga/blog SEO overrides will take priority over these.
                </p>
                <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Available placeholders:</strong>{" "}
                    <code className="bg-purple-100 px-1 rounded">{"{title}"}</code>,{" "}
                    <code className="bg-purple-100 px-1 rounded">{"{altNames}"}</code>,{" "}
                    <code className="bg-purple-100 px-1 rounded">{"{chapters}"}</code>,{" "}
                    <code className="bg-purple-100 px-1 rounded">{"{genre}"}</code>,{" "}
                    <code className="bg-purple-100 px-1 rounded">{"{status}"}</code>,{" "}
                    <code className="bg-purple-100 px-1 rounded">{"{author}"}</code>
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Manga Section Header */}
                  <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Manga Page Defaults</h3>

                  {/* Manga Title Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manga Title Template</label>
                    <input
                      type="text"
                      value={mangaSeoDefaults.titleTemplate}
                      onChange={(e) => setMangaSeoDefaults({ ...mangaSeoDefaults, titleTemplate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="{title} Manga | Luvrix"
                    />
                    <p className="text-xs text-gray-500 mt-1">Example: "Swordmaster's Youngest Son Manga | Luvrix"</p>
                  </div>

                  {/* Manga Description Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manga Description Template</label>
                    <textarea
                      value={mangaSeoDefaults.descriptionTemplate}
                      onChange={(e) => setMangaSeoDefaults({ ...mangaSeoDefaults, descriptionTemplate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-20"
                      placeholder="Read {title} manga online. Also known as {altNames}. Chapters 1 to {chapters} available."
                    />
                    <p className="text-xs text-gray-500 mt-1">Use {"{altNames}"} for alternative names — auto-extracted from the manga's description field or alternativeNames field.</p>
                  </div>

                  {/* Focus Keyword Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keywords Template</label>
                    <input
                      type="text"
                      value={mangaSeoDefaults.focusKeywordTemplate}
                      onChange={(e) => setMangaSeoDefaults({ ...mangaSeoDefaults, focusKeywordTemplate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="{title} manga, read {title} online, {title} chapters, {altNames}"
                    />
                  </div>

                  {/* Blog Section Header */}
                  <h3 className="text-md font-semibold text-gray-700 border-b pb-2 mt-6">Blog Page Defaults</h3>

                  {/* Blog Title Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title Template</label>
                    <input
                      type="text"
                      value={mangaSeoDefaults.blogTitleTemplate}
                      onChange={(e) => setMangaSeoDefaults({ ...mangaSeoDefaults, blogTitleTemplate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="{title} | Luvrix Blog"
                    />
                  </div>

                  {/* Blog Description Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blog Description Template</label>
                    <textarea
                      value={mangaSeoDefaults.blogDescriptionTemplate}
                      onChange={(e) => setMangaSeoDefaults({ ...mangaSeoDefaults, blogDescriptionTemplate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-16"
                      placeholder="Read {title} on Luvrix Blog."
                    />
                  </div>

                  {/* Default OG Image */}
                  <h3 className="text-md font-semibold text-gray-700 border-b pb-2 mt-6">Default Images</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default OG Image URL</label>
                    <input
                      type="text"
                      value={mangaSeoDefaults.defaultOgImage}
                      onChange={(e) => setMangaSeoDefaults({ ...mangaSeoDefaults, defaultOgImage: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="https://res.cloudinary.com/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Used when a page has no specific image. Must be 1200×630 PNG/JPG.</p>
                  </div>

                  {/* How it works */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mt-4">
                    <div className="flex items-start gap-2">
                      <FiFileText className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800">How it works:</p>
                        <ul className="text-sm text-purple-700 mt-1 space-y-1">
                          <li>• These templates apply globally when manga/blogs have no custom SEO fields set</li>
                          <li>• Per-manga overrides (in Manage Manga) take priority over these defaults</li>
                          <li>• {"{altNames}"} is auto-extracted from the manga's Alternative Names field or Description</li>
                          <li>• Changes here take effect immediately on all pages using default templates</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* robots.txt */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiFileText className="text-blue-500" /> robots.txt
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReset("robots")}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      <FiRefreshCw className="w-4 h-4" /> Reset
                    </button>
                    <button
                      onClick={() => handleCopy("robots")}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      {copied.robots ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                      {copied.robots ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleDownload("robots")}
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1"
                    >
                      <FiDownload className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Controls how search engine crawlers access your site. Changes are written directly to the server on save.
                </p>

                <textarea
                  value={robotsTxt}
                  onChange={(e) => setRobotsTxt(e.target.value)}
                  className="w-full h-80 font-mono text-sm p-4 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter robots.txt content..."
                />

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> Add <code className="bg-blue-100 px-1 rounded">Allow: /manga/*</code> to ensure all manga pages are indexed.
                  </p>
                </div>
              </div>

              {/* ads.txt */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiCode className="text-green-500" /> ads.txt
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReset("ads")}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      <FiRefreshCw className="w-4 h-4" /> Reset
                    </button>
                    <button
                      onClick={() => handleCopy("ads")}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      {copied.ads ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                      {copied.ads ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleDownload("ads")}
                      className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-1"
                    >
                      <FiDownload className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Authorized digital sellers file for ad networks. Add your AdSense and other ad network entries here.
                </p>

                <textarea
                  value={adsTxt}
                  onChange={(e) => setAdsTxt(e.target.value)}
                  className="w-full h-40 font-mono text-sm p-4 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter ads.txt content..."
                />

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Format:</strong> <code className="bg-green-100 px-1 rounded">domain, publisher-id, relationship, certification-id</code>
                  </p>
                </div>
              </div>

              {/* Live Sync Status */}
              {writeStatus && (
                <div className={`p-4 rounded-xl border ${
                  writeStatus.type === "success" 
                    ? "bg-green-50 border-green-200" 
                    : writeStatus.type === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <p className={`text-sm font-medium ${
                    writeStatus.type === "success" ? "text-green-700" : writeStatus.type === "error" ? "text-red-700" : "text-yellow-700"
                  }`}>
                    {writeStatus.type === "success" ? "✓" : writeStatus.type === "error" ? "✗" : "⚠"} {writeStatus.message}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <a href="https://luvrix.com/robots.txt" target="_blank" rel="noreferrer" className="text-blue-600 underline">Verify robots.txt</a>
                    <a href="https://luvrix.com/ads.txt" target="_blank" rel="noreferrer" className="text-blue-600 underline">Verify ads.txt</a>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Live File Sync</h2>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Auto-sync enabled:</strong> When you save, robots.txt and ads.txt are written directly to the server. No manual upload needed.
                  </p>
                  <div className="mt-2 text-xs text-green-600 space-y-1">
                    <p>• robots.txt → <code className="bg-green-100 px-1 rounded">/public/robots.txt</code></p>
                    <p>• ads.txt → <code className="bg-green-100 px-1 rounded">/public/ads.txt</code></p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSave />
                  )}
                  Save Settings
                </button>
                {saved && (
                  <span className="text-green-600 font-medium">✓ Saved successfully!</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
