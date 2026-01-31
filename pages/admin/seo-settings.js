import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/api-client";

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

# Disallow admin and private pages
Disallow: /admin
Disallow: /dashboard
Disallow: /api
Disallow: /_next
Disallow: /login
Disallow: /register

# Crawl delay for polite crawling
Crawl-delay: 1

# Sitemap
Sitemap: https://luvrix.com/sitemap.xml
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
  
  // Global SEO Templates
  const [globalSEO, setGlobalSEO] = useState({
    defaultMangaTitle: "Read {title} Manga Online Free - Luvrix",
    defaultChapterTitle: "{title} Chapter {n} - Read Online Free",
    defaultMangaDescription: "Read {title} manga online for free. Get the latest chapters in HD quality only on Luvrix.",
    defaultChapterDescription: "Read {title} Chapter {n} online for free in HD quality. Enjoy the latest manga chapters on Luvrix.",
    defaultOgImage: "https://luvrix.com/default-cover.jpg",
    defaultBlogTitle: "{title} - Luvrix Blog",
    defaultBlogDescription: "Read {title} on Luvrix Blog. Discover the latest articles and news.",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      if (data.robotsTxt) setRobotsTxt(data.robotsTxt);
      if (data.adsTxt) setAdsTxt(data.adsTxt);
      if (data.globalSEO) setGlobalSEO({ ...globalSEO, ...data.globalSEO });
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ robotsTxt, adsTxt, globalSEO });
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated SEO Settings",
        targetId: "seo-settings",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (type) => {
    const text = type === 'robots' ? robotsTxt : adsTxt;
    await navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const handleDownload = (type) => {
    const text = type === 'robots' ? robotsTxt : adsTxt;
    const filename = type === 'robots' ? 'robots.txt' : 'ads.txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = (type) => {
    if (type === 'robots') {
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
              {/* Global SEO Templates */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiFileText className="text-purple-500" /> Global SEO Templates
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Set default SEO templates for manga and blog pages. Use <code className="bg-gray-100 px-1 rounded">{"{title}"}</code> for content title and <code className="bg-gray-100 px-1 rounded">{"{n}"}</code> for chapter number.
                </p>

                <div className="space-y-4">
                  {/* Manga Title Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Manga Title Template
                    </label>
                    <input
                      type="text"
                      value={globalSEO.defaultMangaTitle}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultMangaTitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Read {title} Manga Online Free - Luvrix"
                    />
                  </div>

                  {/* Chapter Title Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Chapter Title Template
                    </label>
                    <input
                      type="text"
                      value={globalSEO.defaultChapterTitle}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultChapterTitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="{title} Chapter {n} - Read Online Free"
                    />
                  </div>

                  {/* Manga Description Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Manga Description Template
                    </label>
                    <textarea
                      value={globalSEO.defaultMangaDescription}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultMangaDescription: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-20"
                      placeholder="Read {title} manga online for free..."
                    />
                  </div>

                  {/* Chapter Description Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Chapter Description Template
                    </label>
                    <textarea
                      value={globalSEO.defaultChapterDescription}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultChapterDescription: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-20"
                      placeholder="Read {title} Chapter {n} online for free..."
                    />
                  </div>

                  {/* Default OG Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default OG Image URL
                    </label>
                    <input
                      type="text"
                      value={globalSEO.defaultOgImage}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultOgImage: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="https://luvrix.com/default-cover.jpg"
                    />
                  </div>

                  {/* Blog Title Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Blog Title Template
                    </label>
                    <input
                      type="text"
                      value={globalSEO.defaultBlogTitle}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultBlogTitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="{title} - Luvrix Blog"
                    />
                  </div>

                  {/* Blog Description Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Blog Description Template
                    </label>
                    <textarea
                      value={globalSEO.defaultBlogDescription}
                      onChange={(e) => setGlobalSEO({ ...globalSEO, defaultBlogDescription: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-20"
                      placeholder="Read {title} on Luvrix Blog..."
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Variables:</strong> Use <code className="bg-purple-100 px-1 rounded">{"{title}"}</code> for manga/blog title, <code className="bg-purple-100 px-1 rounded">{"{n}"}</code> for chapter number
                  </p>
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
                      onClick={() => handleReset('robots')}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      <FiRefreshCw className="w-4 h-4" /> Reset
                    </button>
                    <button
                      onClick={() => handleCopy('robots')}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      {copied.robots ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                      {copied.robots ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDownload('robots')}
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1"
                    >
                      <FiDownload className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Controls how search engine crawlers access your site. After saving, download and upload to your server&apos;s public folder.
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
                      onClick={() => handleReset('ads')}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      <FiRefreshCw className="w-4 h-4" /> Reset
                    </button>
                    <button
                      onClick={() => handleCopy('ads')}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      {copied.ads ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                      {copied.ads ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDownload('ads')}
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

              {/* Instructions */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Deployment Instructions</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">How to Update Files:</h3>
                    <ol className="text-sm text-yellow-700 space-y-2 list-decimal list-inside">
                      <li>Edit the content above and click &quot;Save Settings&quot;</li>
                      <li>Click &quot;Download&quot; to get the updated file</li>
                      <li>Upload the file to your server&apos;s <code className="bg-yellow-100 px-1 rounded">public_html/</code> folder</li>
                      <li>Verify at <code className="bg-yellow-100 px-1 rounded">https://luvrix.com/robots.txt</code></li>
                    </ol>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">File Locations on Server:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• robots.txt → <code className="bg-gray-200 px-1 rounded">/public_html/robots.txt</code></li>
                      <li>• ads.txt → <code className="bg-gray-200 px-1 rounded">/public_html/ads.txt</code></li>
                    </ul>
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
