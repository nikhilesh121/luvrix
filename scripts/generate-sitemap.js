const fs = require("fs");
const path = require("path");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

// Static pages
const staticPages = [
  { url: "/", changefreq: "daily", priority: "1.0" },
  { url: "/about", changefreq: "monthly", priority: "0.8" },
  { url: "/contact", changefreq: "monthly", priority: "0.7" },
  { url: "/categories", changefreq: "weekly", priority: "0.8" },
  { url: "/manga", changefreq: "daily", priority: "0.9" },
  { url: "/leaderboard", changefreq: "daily", priority: "0.7" },
  { url: "/login", changefreq: "monthly", priority: "0.5" },
  { url: "/register", changefreq: "monthly", priority: "0.5" },
];

// Manga data file path (generated during build)
const mangaDataPath = path.join(__dirname, "..", "data", "manga-list.json");
const blogsDataPath = path.join(__dirname, "..", "data", "blogs-list.json");

function escapeXml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemap() {
  // Sitemap is now managed dynamically via Firebase
  // This script is kept for reference but does not generate static files
  // The sitemap is served from /sitemap.xml page which fetches from Firebase

  console.log('ℹ Sitemap is now managed dynamically via Firebase');
  console.log('ℹ Access sitemap at: /sitemap.xml');
  console.log('ℹ Manage sitemap in admin panel: /admin/sitemap');
  console.log('✓ Sitemap check complete!');
}

generateSitemap();
