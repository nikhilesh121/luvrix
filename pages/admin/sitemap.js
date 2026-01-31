import { useState } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { motion } from "framer-motion";
import { FiExternalLink, FiGlobe, FiBook, FiFileText, FiLayers, FiGrid, FiCheck, FiZap, FiSend } from "react-icons/fi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

const SITEMAPS = [
  {
    name: "Sitemap Index",
    url: "/sitemap.xml",
    description: "Main index linking all sitemaps",
    icon: FiLayers,
    color: "bg-gradient-to-br from-primary to-secondary",
  },
  {
    name: "Static Pages",
    url: "/sitemap-pages.xml",
    description: "Homepage, about, contact, policies",
    icon: FiGlobe,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    name: "Manga",
    url: "/sitemap-manga.xml",
    description: "All manga main pages",
    icon: FiBook,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    name: "Chapters",
    url: "/sitemap-chapters.xml",
    description: "All manga chapter pages",
    icon: FiBook,
    color: "bg-gradient-to-br from-purple-400 to-purple-500",
  },
  {
    name: "Blog Posts",
    url: "/sitemap-posts.xml",
    description: "All approved blog posts",
    icon: FiFileText,
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    name: "Categories",
    url: "/sitemap-categories.xml",
    description: "Blog category pages",
    icon: FiGrid,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
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

  const pingGoogle = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      // Use local API to ping Google
      const response = await fetch("/api/sitemap/ping-google");
      const data = await response.json();
      if (data.success) {
        setPingResult("success");
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

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Sitemap Manager</h1>
              <p className="text-gray-600">Dynamic sitemaps powered by API Routes</p>
            </div>
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
              Ping Google
            </button>
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
                  Your sitemaps are powered by local API routes on your VPS server. They update automatically 
                  when you add new manga, chapters, or blog posts. No rebuild required!
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ Auto-updates</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ Google ping</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✓ Self-hosted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sitemap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SITEMAPS.map((sitemap) => {
              const Icon = sitemap.icon;
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
                        <FiExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{sitemap.description}</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {sitemap.url}
                      </code>
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
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">Publish Content</h3>
                <p className="text-sm text-gray-500">Add manga or approve blog posts</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-purple-600">2</span>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">Auto-Saved</h3>
                <p className="text-sm text-gray-500">Content saved to MongoDB</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-green-600">3</span>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">Sitemap Updates</h3>
                <p className="text-sm text-gray-500">Local API generates sitemaps</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-orange-600">4</span>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">Google Pinged</h3>
                <p className="text-sm text-gray-500">Click button to notify Google</p>
              </div>
            </div>
          </div>

          {/* Google Search Console */}
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
                  <span>Go to Sitemaps → Add sitemap</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-medium">4</span>
                  <span>Enter: <code className="bg-gray-100 px-2 py-1 rounded font-mono">/sitemap.xml</code></span>
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Server Status</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>✓ Self-Hosted on VPS!</strong> Sitemaps are generated locally from your MongoDB database.
                </p>
              </div>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">✓</span>
                  <span>MongoDB database running on server</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">✓</span>
                  <span>API routes serving dynamic sitemaps</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">✓</span>
                  <span>No external dependencies required</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">→</span>
                  <span>Test: <a href={`${SITE_URL}/sitemap.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap.xml</a></span>
                </li>
              </ol>
            </div>
          </div>

          {/* Local API URLs */}
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Local API Endpoints</h2>
            <p className="text-sm text-gray-500 mb-4">These sitemaps are served directly from your VPS server.</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-xs overflow-x-auto">
              <p><span className="text-gray-500">Index:</span> <a href={`${SITE_URL}/sitemap.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap.xml</a></p>
              <p><span className="text-gray-500">Pages:</span> <a href={`${SITE_URL}/sitemap-pages.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap-pages.xml</a></p>
              <p><span className="text-gray-500">Manga:</span> <a href={`${SITE_URL}/sitemap-manga.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap-manga.xml</a></p>
              <p><span className="text-gray-500">Chapters:</span> <a href={`${SITE_URL}/sitemap-chapters.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap-chapters.xml</a></p>
              <p><span className="text-gray-500">Posts:</span> <a href={`${SITE_URL}/sitemap-posts.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap-posts.xml</a></p>
              <p><span className="text-gray-500">Categories:</span> <a href={`${SITE_URL}/sitemap-categories.xml`} target="_blank" className="text-blue-600 hover:underline">{SITE_URL}/sitemap-categories.xml</a></p>
            </div>
          </div>

          {pingResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg ${pingResult === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {pingResult === "success" 
                ? "✓ Google ping initiated! Check the opened tab for confirmation." 
                : "✗ Failed to ping Google. Please try again."}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
