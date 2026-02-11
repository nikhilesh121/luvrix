// Dynamic SSR sitemap pages — served at /sitemaps/posts/, /sitemaps/manga/, etc.
// Uses getServerSideProps to query MongoDB and return XML on every request.
// No file extension = Cloudflare CDN won't cache these URLs.
import { getDb } from "../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

function escapeXml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toISO(d) {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

// This component never renders — XML is sent directly via res
export default function SitemapPage() {
  return null;
}

export async function getServerSideProps({ params, res }) {
  const { type } = params;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Cloudflare-CDN-Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");

  try {
    const db = await getDb();
    let xml = "";

    switch (type) {
      case "posts": {
        const blogs = await db.collection("blogs")
          .find({ status: { $nin: ["draft", "pending", "hidden", "rejected", "deleted"] } })
          .project({ slug: 1, updatedAt: 1, createdAt: 1 })
          .sort({ updatedAt: -1 })
          .limit(50000)
          .toArray();
        const seen = new Set();
        const urls = [];
        for (const blog of blogs) {
          if (!blog.slug || seen.has(blog.slug)) continue;
          seen.add(blog.slug);
          urls.push(`  <url>\n    <loc>${escapeXml(SITE_URL)}/blog/${escapeXml(blog.slug)}</loc>\n    <lastmod>${toISO(blog.updatedAt || blog.createdAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
        }
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        break;
      }

      case "manga": {
        const manga = await db.collection("manga")
          .find({ status: { $nin: ["draft", "private"] } })
          .project({ slug: 1, updatedAt: 1, createdAt: 1 })
          .sort({ updatedAt: -1 })
          .limit(50000)
          .toArray();
        const seen = new Set();
        const urls = [];
        for (const m of manga) {
          if (!m.slug || seen.has(m.slug)) continue;
          seen.add(m.slug);
          urls.push(`  <url>\n    <loc>${escapeXml(SITE_URL)}/manga/${escapeXml(m.slug)}</loc>\n    <lastmod>${toISO(m.updatedAt || m.createdAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
        }
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        break;
      }

      case "categories": {
        const categories = await db.collection("blogs").distinct("category", { status: { $nin: ["draft", "pending", "hidden", "rejected", "deleted"] } });
        const urls = [];
        urls.push(`  <url>\n    <loc>${escapeXml(SITE_URL)}/categories</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
        for (const cat of categories) {
          if (!cat || typeof cat !== "string") continue;
          urls.push(`  <url>\n    <loc>${escapeXml(SITE_URL)}/categories?category=${escapeXml(encodeURIComponent(cat))}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
        }
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        break;
      }

      case "pages": {
        const staticPages = [
          { url: "/", changefreq: "daily", priority: "1.0" },
          { url: "/about", changefreq: "monthly", priority: "0.8" },
          { url: "/contact", changefreq: "monthly", priority: "0.7" },
          { url: "/categories", changefreq: "weekly", priority: "0.8" },
          { url: "/manga", changefreq: "daily", priority: "0.9" },
          { url: "/giveaway", changefreq: "daily", priority: "0.8" },
          { url: "/leaderboard", changefreq: "daily", priority: "0.7" },
          { url: "/publishers", changefreq: "weekly", priority: "0.7" },
          { url: "/privacy", changefreq: "yearly", priority: "0.3" },
          { url: "/terms", changefreq: "yearly", priority: "0.3" },
          { url: "/giveaway-terms", changefreq: "yearly", priority: "0.3" },
          { url: "/policy/privacy", changefreq: "yearly", priority: "0.3" },
          { url: "/policy/terms", changefreq: "yearly", priority: "0.3" },
          { url: "/policy/disclaimer", changefreq: "yearly", priority: "0.3" },
          { url: "/policy/dmca", changefreq: "yearly", priority: "0.3" },
        ];
        const urls = staticPages.map(p => `  <url>\n    <loc>${escapeXml(SITE_URL + p.url)}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`);
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        break;
      }

      case "giveaways": {
        const giveaways = await db.collection("giveaways")
          .find({ status: { $ne: "draft" } })
          .project({ slug: 1, status: 1, updatedAt: 1, createdAt: 1 })
          .sort({ updatedAt: -1 })
          .toArray();
        const seen = new Set();
        const urls = [];
        urls.push(`  <url>\n    <loc>${escapeXml(SITE_URL)}/giveaway</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`);
        for (const g of giveaways) {
          if (!g.slug || seen.has(g.slug)) continue;
          seen.add(g.slug);
          const priority = g.status === "active" ? "0.9" : "0.6";
          const changefreq = g.status === "active" ? "daily" : "weekly";
          urls.push(`  <url>\n    <loc>${escapeXml(SITE_URL)}/giveaway/${escapeXml(g.slug)}</loc>\n    <lastmod>${toISO(g.updatedAt || g.createdAt)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
        }
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        break;
      }

      default:
        res.statusCode = 404;
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    }

    res.write(xml);
    res.end();
  } catch (error) {
    console.error(`Sitemap ${type} error:`, error);
    res.statusCode = 500;
    res.write(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    res.end();
  }

  return { props: {} };
}
