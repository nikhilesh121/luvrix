const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const googleTrends = require("google-trends-api");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();

// Helper to get OpenAI API key (from Firestore settings or environment)
async function getOpenAIClient() {
  let apiKey = process.env.OPENAI_API_KEY;
  
  // Try to get from Firestore settings
  try {
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (settingsDoc.exists && settingsDoc.data().openaiApiKey) {
      apiKey = settingsDoc.data().openaiApiKey;
    }
  } catch (err) {
    console.log("Using environment API key");
  }
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  
  return new OpenAI({ apiKey });
}

const SITE_URL = "https://luvrix.com";

/* -----------------------------
   Helper: XML Response
----------------------------- */
function sendXml(res, xml) {
  res.set("Content-Type", "application/xml");
  // Short cache (5 minutes) so new content appears quickly
  res.set("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(xml);
}

/* -----------------------------
   PING GOOGLE MANUALLY
   Can be called to refresh sitemap indexing
----------------------------- */
exports.pingGoogle = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    const response = await axios.get(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    
    console.log("Manual Google ping successful");
    res.status(200).json({ 
      success: true, 
      message: "Google pinged successfully",
      sitemapUrl: sitemapUrl
    });
  } catch (error) {
    console.error("Error pinging Google:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/* -----------------------------
   MAIN SITEMAP INDEX
   /sitemap.xml
----------------------------- */
exports.sitemapIndex = functions.https.onRequest((req, res) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-manga.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-chapters.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-posts.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-categories.xml</loc>
  </sitemap>
</sitemapindex>`;

  sendXml(res, xml);
});

/* -----------------------------
   PAGES SITEMAP
   /sitemap-pages.xml
----------------------------- */
exports.sitemapPages = functions.https.onRequest((req, res) => {
  const pages = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "/about", priority: "0.7", changefreq: "monthly" },
    { path: "/contact", priority: "0.7", changefreq: "monthly" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
    { path: "/manga", priority: "0.9", changefreq: "daily" },
    { path: "/leaderboard", priority: "0.6", changefreq: "weekly" },
    { path: "/categories", priority: "0.8", changefreq: "weekly" },
    { path: "/login", priority: "0.5", changefreq: "monthly" },
    { path: "/register", priority: "0.5", changefreq: "monthly" },
    { path: "/policy/privacy", priority: "0.3", changefreq: "yearly" },
    { path: "/policy/terms", priority: "0.3", changefreq: "yearly" },
    { path: "/policy/dmca", priority: "0.3", changefreq: "yearly" },
    { path: "/policy/disclaimer", priority: "0.3", changefreq: "yearly" },
  ];

  const urls = pages
    .map(
      (p) => `
  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join("");

  sendXml(
    res,
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
  );
});

/* -----------------------------
   MANGA SITEMAP
   /sitemap-manga.xml
----------------------------- */
exports.sitemapManga = functions.https.onRequest(async (req, res) => {
  try {
    const snap = await db.collection("manga").get();

    let urls = "";
    snap.forEach((doc) => {
      const manga = doc.data();
      if (manga.slug) {
        const lastmod = manga.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
        urls += `
  <url>
    <loc>${SITE_URL}/manga/${manga.slug}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      }
    });

    sendXml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
    );
  } catch (error) {
    console.error("Error generating manga sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

/* -----------------------------
   CHAPTERS SITEMAP
   /sitemap-chapters.xml
----------------------------- */
exports.sitemapChapters = functions.https.onRequest(async (req, res) => {
  try {
    const snap = await db.collection("manga").get();

    let urls = "";

    snap.forEach((doc) => {
      const manga = doc.data();
      if (manga.slug) {
        const total = manga.totalChapters || 0;

        for (let i = 1; i <= total; i++) {
          urls += `
  <url>
    <loc>${SITE_URL}/manga/${manga.slug}/chapter-${i}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        }
      }
    });

    sendXml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
    );
  } catch (error) {
    console.error("Error generating chapters sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

/* -----------------------------
   BLOG POSTS SITEMAP
   /sitemap-posts.xml
----------------------------- */
exports.sitemapPosts = functions.https.onRequest(async (req, res) => {
  try {
    const snap = await db.collection("blogs").where("status", "==", "approved").get();

    let urls = "";
    snap.forEach((doc) => {
      const blog = doc.data();
      if (blog.slug) {
        const lastmod = blog.updatedAt?.toDate?.()?.toISOString?.() || 
                        blog.createdAt?.toDate?.()?.toISOString?.() || 
                        new Date().toISOString();
        urls += `
  <url>
    <loc>${SITE_URL}/blog/${blog.slug}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    });

    sendXml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
    );
  } catch (error) {
    console.error("Error generating posts sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

/* -----------------------------
   CATEGORIES SITEMAP
   /sitemap-categories.xml
----------------------------- */
exports.sitemapCategories = functions.https.onRequest(async (req, res) => {
  try {
    // Get unique categories from blogs
    const snap = await db.collection("blogs").where("status", "==", "approved").get();

    const categories = new Set();
    snap.forEach((doc) => {
      const blog = doc.data();
      if (blog.category) {
        categories.add(blog.category);
      }
    });

    let urls = "";
    categories.forEach((cat) => {
      const slug = encodeURIComponent(cat);
      urls += `
  <url>
    <loc>${SITE_URL}/categories?category=${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    sendXml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
    );
  } catch (error) {
    console.error("Error generating categories sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

/* -----------------------------
   AUTO PING GOOGLE ON NEW BLOG
----------------------------- */
exports.onBlogCreated = functions.firestore
  .document("blogs/{blogId}")
  .onCreate(async (snap, context) => {
    const blog = snap.data();
    
    // Only ping if blog is approved
    if (blog.status === "approved") {
      try {
        const sitemapUrl = `${SITE_URL}/sitemap.xml`;
        await axios.get(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
        );
        console.log("Google pinged successfully for new blog:", blog.slug);
      } catch (error) {
        console.error("Error pinging Google:", error);
      }
    }
  });

/* -----------------------------
   AUTO PING GOOGLE ON BLOG APPROVED
----------------------------- */
exports.onBlogUpdated = functions.firestore
  .document("blogs/{blogId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Ping Google when blog gets approved
    if (before.status !== "approved" && after.status === "approved") {
      try {
        const sitemapUrl = `${SITE_URL}/sitemap.xml`;
        await axios.get(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
        );
        console.log("Google pinged successfully for approved blog:", after.slug);
      } catch (error) {
        console.error("Error pinging Google:", error);
      }
    }
  });

/* -----------------------------
   AUTO PING GOOGLE ON NEW MANGA
----------------------------- */
exports.onMangaCreated = functions.firestore
  .document("manga/{mangaId}")
  .onCreate(async (snap, context) => {
    const manga = snap.data();
    
    try {
      const sitemapUrl = `${SITE_URL}/sitemap.xml`;
      await axios.get(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      );
      console.log("Google pinged successfully for new manga:", manga.slug);
    } catch (error) {
      console.error("Error pinging Google:", error);
    }
  });

/* -----------------------------
   AUTO PING GOOGLE ON MANGA UPDATED (NEW CHAPTERS)
----------------------------- */
exports.onMangaUpdated = functions.firestore
  .document("manga/{mangaId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Ping Google when new chapters are added
    if ((after.totalChapters || 0) > (before.totalChapters || 0)) {
      try {
        const sitemapUrl = `${SITE_URL}/sitemap.xml`;
        await axios.get(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
        );
        console.log("Google pinged successfully for manga update:", after.slug, "- New chapters:", after.totalChapters);
      } catch (error) {
        console.error("Error pinging Google:", error);
      }
    }
  });

/* -----------------------------
   TRENDING TOPICS API
   Returns daily trending topics from Google Trends
----------------------------- */
exports.trendingTopics = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const geo = req.query.geo || req.body?.geo || "US";
    
    // Try to fetch from Google Trends with retry
    let results;
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        results = await googleTrends.dailyTrends({ 
          geo,
          hl: "en-US",
        });
        break;
      } catch (err) {
        lastError = err;
        retries--;
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    if (!results) {
      throw lastError || new Error("Failed to fetch trends after retries");
    }
    
    // Check if result is HTML (error page) instead of JSON
    if (typeof results === 'string' && results.trim().startsWith('<!')) {
      throw new Error("Google Trends returned an error page. Please try again later.");
    }
    
    const data = JSON.parse(results);
    
    if (!data.default || !data.default.trendingSearchesDays || !data.default.trendingSearchesDays[0]) {
      throw new Error("Invalid response structure from Google Trends");
    }
    
    const topics = data.default.trendingSearchesDays[0].trendingSearches.map((t) => ({
      title: t.title.query,
      traffic: t.formattedTraffic || "N/A",
      relatedQueries: t.relatedQueries?.map(q => q.query) || [],
      articles: t.articles?.slice(0, 3).map(a => ({
        title: a.title,
        url: a.url,
        source: a.source,
      })) || [],
    }));

    res.json({ success: true, topics, geo });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      tip: "Google Trends may be rate limiting. Try again in a few minutes or try a different country."
    });
  }
});

/* -----------------------------
   AI BLOG DRAFT GENERATOR
   Generates a blog draft using OpenAI
----------------------------- */
exports.generateBlogDraft = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { topic, adminId, category, tone } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }

    if (!adminId) {
      res.status(400).json({ error: "Admin ID is required" });
      return;
    }

    const selectedTone = tone || "informative and engaging";
    const selectedCategory = category || "General";

    const prompt = `You are an expert blog writer. Write a complete blog post about: "${topic}"

Requirements:
- Write in a ${selectedTone} tone
- Natural, human-like writing style
- Helpful, informative, and engaging content
- SEO optimized with proper heading structure (H2, H3)
- Minimum 1500 words
- Use HTML formatting for the content (headings, paragraphs, lists, bold, etc.)
- Do NOT include the main H1 title in the content (it will be added separately)

Respond in this exact JSON format:
{
  "title": "Blog Title Here",
  "seoTitle": "SEO Optimized Title (60 chars max)",
  "seoDescription": "Meta description for SEO (155 chars max)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "excerpt": "A brief 2-3 sentence summary of the article",
  "content": "<h2>First Section</h2><p>Content here...</p>..."
}

Only respond with valid JSON, no markdown code blocks or extra text.`;

    // Get OpenAI client with API key from settings or environment
    const openai = await getOpenAIClient();
    
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = aiResponse.choices[0].message.content.trim();
    
    // Parse AI response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      res.status(500).json({ error: "Failed to parse AI response", raw: responseText });
      return;
    }

    // Generate slug from title
    const slug = parsedResponse.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    // Save draft to Firestore
    const draftData = {
      topic,
      title: parsedResponse.title,
      slug,
      content: parsedResponse.content,
      excerpt: parsedResponse.excerpt || "",
      seoTitle: parsedResponse.seoTitle || parsedResponse.title,
      seoDescription: parsedResponse.seoDescription || "",
      keywords: parsedResponse.keywords || [],
      category: selectedCategory,
      status: "draft",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: adminId,
      isAIGenerated: true,
    };

    const draftRef = await db.collection("blogDrafts").add(draftData);

    res.json({ 
      success: true, 
      draftId: draftRef.id,
      draft: {
        id: draftRef.id,
        ...draftData,
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error generating blog draft:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -----------------------------
   GET ALL BLOG DRAFTS
----------------------------- */
exports.getBlogDrafts = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const status = req.query.status || "draft";
    
    let query = db.collection("blogDrafts");
    if (status !== "all") {
      query = query.where("status", "==", status);
    }
    
    const snap = await query.orderBy("createdAt", "desc").get();
    
    const drafts = [];
    snap.forEach((doc) => {
      drafts.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      });
    });

    res.json({ success: true, drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -----------------------------
   PUBLISH BLOG DRAFT
   Moves draft to blogs collection
----------------------------- */
exports.publishBlogDraft = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { draftId, adminId, authorName, authorPhoto } = req.body;

    if (!draftId) {
      res.status(400).json({ error: "Draft ID is required" });
      return;
    }

    // Get the draft
    const draftDoc = await db.collection("blogDrafts").doc(draftId).get();
    
    if (!draftDoc.exists) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }

    const draft = draftDoc.data();

    // Create blog entry
    const blogData = {
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
      excerpt: draft.excerpt || "",
      category: draft.category || "General",
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      keywords: draft.keywords || [],
      thumbnail: draft.thumbnail || "",
      authorId: adminId,
      authorName: authorName || "Admin",
      authorPhoto: authorPhoto || "",
      status: "approved",
      views: 0,
      monthlyViews: 0,
      isAIGenerated: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add to blogs collection
    const blogRef = await db.collection("blogs").add(blogData);

    // Update draft status
    await db.collection("blogDrafts").doc(draftId).update({
      status: "published",
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedBlogId: blogRef.id,
    });

    // Ping Google (sitemap will auto-update)
    try {
      const sitemapUrl = `${SITE_URL}/sitemap.xml`;
      await axios.get(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      );
      console.log("Google pinged for published blog:", draft.slug);
    } catch (pingError) {
      console.error("Error pinging Google:", pingError);
    }

    res.json({ 
      success: true, 
      blogId: blogRef.id,
      message: "Blog published successfully"
    });
  } catch (error) {
    console.error("Error publishing draft:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -----------------------------
   DELETE BLOG DRAFT
----------------------------- */
exports.deleteBlogDraft = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const draftId = req.body?.draftId || req.query.draftId;

    if (!draftId) {
      res.status(400).json({ error: "Draft ID is required" });
      return;
    }

    await db.collection("blogDrafts").doc(draftId).delete();

    res.json({ success: true, message: "Draft deleted successfully" });
  } catch (error) {
    console.error("Error deleting draft:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
