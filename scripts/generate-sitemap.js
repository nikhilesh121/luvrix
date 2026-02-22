const fs = require("fs-extra");
const path = require("path");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");

// Firebase Admin SDK for build-time data fetching
const admin = require("firebase-admin");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Initialize Firebase Admin
function initFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✓ Firebase Admin initialized");
    } else {
      console.log("⚠ serviceAccountKey.json not found - using static routes only");
      return null;
    }
  }
  return admin.firestore();
}

// Static pages configuration
const staticPages = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/blog", changefreq: "daily", priority: 0.8 },
  { url: "/manga", changefreq: "daily", priority: 0.8 },
  { url: "/categories", changefreq: "weekly", priority: 0.7 },
  { url: "/leaderboard", changefreq: "daily", priority: 0.7 },
  { url: "/giveaway", changefreq: "weekly", priority: 0.6 },
  { url: "/contact", changefreq: "monthly", priority: 0.5 },
  { url: "/about", changefreq: "monthly", priority: 0.5 },
  { url: "/policy/privacy", changefreq: "monthly", priority: 0.3 },
  { url: "/policy/terms", changefreq: "monthly", priority: 0.3 },
  { url: "/publishers", changefreq: "weekly", priority: 0.6 },
  { url: "/login", changefreq: "monthly", priority: 0.3 },
  { url: "/register", changefreq: "monthly", priority: 0.3 },
];

async function fetchBlogs(db) {
  if (!db) return [];
  try {
    const snapshot = await db.collection("blogs").where("status", "==", "approved").get();
    const blogs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) {
        blogs.push({
          slug: data.slug,
          updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        });
      }
    });
    console.log(`✓ Fetched ${blogs.length} blog posts`);
    return blogs;
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    return [];
  }
}

async function fetchManga(db) {
  if (!db) return [];
  try {
    const snapshot = await db.collection("manga").get();
    const manga = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) {
        manga.push({
          slug: data.slug,
          updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        });
      }
    });
    console.log(`✓ Fetched ${manga.length} manga entries`);
    return manga;
  } catch (error) {
    console.error("Error fetching manga:", error.message);
    return [];
  }
}

async function generateSitemapFile(filename, urls) {
  const stream = new SitemapStream({ hostname: SITE_URL });
  const data = await streamToPromise(Readable.from(urls).pipe(stream));
  const filepath = path.join(PUBLIC_DIR, filename);
  await fs.writeFile(filepath, data.toString());
  console.log(`✓ Generated ${filename} (${urls.length} URLs)`);
}

async function generateSitemapIndex() {
  const now = new Date().toISOString();
  const sitemaps = [
    { loc: `${SITE_URL}/sitemap.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-blog.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-manga.xml`, lastmod: now },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;

  const filepath = path.join(PUBLIC_DIR, "sitemap-index.xml");
  await fs.writeFile(filepath, xml);
  console.log("✓ Generated sitemap-index.xml");
}

async function generateSitemaps() {
  console.log("\n📍 Generating sitemaps...\n");

  // Ensure public directory exists
  await fs.ensureDir(PUBLIC_DIR);

  // Initialize Firebase
  const db = initFirebase();

  // Fetch dynamic content
  const [blogs, manga] = await Promise.all([fetchBlogs(db), fetchManga(db)]);

  const now = new Date().toISOString();

  // Generate main sitemap (static pages)
  const staticUrls = staticPages.map((page) => ({
    url: page.url,
    lastmod: now,
    changefreq: page.changefreq,
    priority: page.priority,
  }));
  await generateSitemapFile("sitemap.xml", staticUrls);

  // Generate blog sitemap
  const blogUrls = blogs.map((blog) => ({
    url: `/blog/${blog.slug}`,
    lastmod: blog.updatedAt.toISOString(),
    changefreq: "weekly",
    priority: 0.7,
  }));
  await generateSitemapFile("sitemap-blog.xml", blogUrls.length > 0 ? blogUrls : [{ url: "/blog", lastmod: now, changefreq: "daily", priority: 0.8 }]);

  // Generate manga sitemap
  const mangaUrls = manga.map((m) => ({
    url: `/manga/${m.slug}`,
    lastmod: m.updatedAt.toISOString(),
    changefreq: "weekly",
    priority: 0.7,
  }));
  await generateSitemapFile("sitemap-manga.xml", mangaUrls.length > 0 ? mangaUrls : [{ url: "/manga", lastmod: now, changefreq: "daily", priority: 0.8 }]);

  // Generate sitemap index
  await generateSitemapIndex();

  console.log("\n✅ All sitemaps generated successfully!\n");
}

generateSitemaps().catch((error) => {
  console.error("Sitemap generation failed:", error);
  process.exit(1);
});
