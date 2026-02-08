import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { getMangaBySlug, getSettings } from "../../../lib/api-client";
import { generateChapterUrl } from "../../../utils/mangaRedirectGenerator";
import MangaRedirectBox from "../../../components/MangaRedirectBox";
import { BreadcrumbSchema, ChapterSchema } from "../../../components/SEOHead";
import AdRenderer from "../../../components/AdRenderer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

// Helper to serialize timestamps for SSR
const serializeData = (obj) => {
  if (!obj) return null;
  const serialized = { ...obj };
  for (const key in serialized) {
    if (serialized[key]?.toDate) {
      serialized[key] = serialized[key].toDate().toISOString();
    } else if (serialized[key]?.seconds) {
      serialized[key] = new Date(serialized[key].seconds * 1000).toISOString();
    }
  }
  return serialized;
};

// Helper to format slug to title (e.g., "astral-pet-store" -> "Astral Pet Store")
const formatSlugToTitle = (slug) => {
  if (!slug) return "";
  return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

// Helper to extract alternative names from manga data
const getAltNames = (data) => {
  if (data?.alternativeNames) return data.alternativeNames;
  if (data?.description) {
    const match = data.description.match(/(?:also known as|alternative names?|other names?)[:\s]+([^.\n]+)/i);
    if (match) return match[1].trim();
  }
  return '';
};

// Helper to apply SEO template with chapter-specific placeholders
const applyChapterTemplate = (template, data, chapNum) => {
  if (!template) return null;
  const altNames = getAltNames(data);
  let result = template
    .replace(/{title}/g, data?.title || '')
    .replace(/{altNames}/g, altNames)
    .replace(/{chapter}/g, chapNum || '')
    .replace(/{chapters}/g, data?.totalChapters || '')
    .replace(/{status}/g, data?.status || 'Ongoing')
    .replace(/{author}/g, data?.author || '')
    .replace(/{genre}/g, data?.genre || '');
  result = result.replace(/Also known as\s*\.\s*/gi, '').replace(/\s{2,}/g, ' ').trim();
  return result;
};

export default function ChapterPage({ initialManga, initialSettings, initialChapterNumber }) {
  const router = useRouter();
  const { slug, chapter } = router.query;
  const [manga, setManga] = useState(initialManga);
  const [chapterNumber, setChapterNumber] = useState(initialChapterNumber);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(!initialManga);
  const [error, setError] = useState(null);

  // Format slug to readable title for SEO (from URL)
  const formattedSlugTitle = formatSlugToTitle(slug);
  const urlChapterMatch = chapter?.match(/chapter-(\d+)/);
  const urlChapterNumber = urlChapterMatch ? parseInt(urlChapterMatch[1], 10) : null;
  
  // SEO values - use manga data if loaded, otherwise use formatted slug from URL
  const currentChapterNum = chapterNumber || urlChapterNumber;
  const globalSeo = settings?.mangaSeoDefaults || {};
  
  const seoTitle = manga?.chapterSeoTitle 
    ? manga.chapterSeoTitle.replace("{chapter}", currentChapterNum).replace("{title}", manga.title)
    : (manga ? applyChapterTemplate(globalSeo.chapterTitleTemplate, manga, currentChapterNum) : null)
    || (manga?.title ? `${manga.title} Chapter ${currentChapterNum} - Read Online Free` : `${formattedSlugTitle} Chapter ${urlChapterNumber} - Read Online Free`);
  
  // Generate SEO description from manga description if not explicitly set
  const generateChapterDescription = () => {
    if (manga?.chapterSeoDescription) {
      return manga.chapterSeoDescription.replace("{chapter}", currentChapterNum).replace("{title}", manga.title);
    }
    if (manga && applyChapterTemplate(globalSeo.chapterDescriptionTemplate, manga, currentChapterNum)) {
      return applyChapterTemplate(globalSeo.chapterDescriptionTemplate, manga, currentChapterNum);
    }
    if (manga?.description) {
      const plainText = manga.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const shortDesc = plainText.slice(0, 120) + (plainText.length > 120 ? "..." : "");
      return `Read ${manga.title} Chapter ${currentChapterNum} online. ${shortDesc}`;
    }
    return `Read ${manga?.title || formattedSlugTitle} Chapter ${currentChapterNum || urlChapterNumber} online for free. High-quality images, fast loading.`;
  };
  const seoDescription = generateChapterDescription();
  
  const seoKeywords = `${manga?.title || formattedSlugTitle} chapter ${currentChapterNum}, read ${manga?.title || formattedSlugTitle} ${currentChapterNum}`;
  
  const pageUrl = `/manga/${slug}/chapter-${currentChapterNum}`;
  const fullUrl = `${SITE_URL}${pageUrl}`;

  // Ensure absolute image URL for SEO
  const getAbsoluteImageUrl = (url) => {
    if (!url) return "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";
    if (url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
  };
  const ogImage = manga?.coverUrl ? getAbsoluteImageUrl(manga.coverUrl) : "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";

  useEffect(() => {
    async function fetchData() {
      // If we have SSR data, just generate redirect URL
      if (initialManga && initialChapterNumber) {
        const url = generateChapterUrl(initialManga, initialChapterNumber);
        setRedirectUrl(url);
        return;
      }

      if (!chapter || !slug) return;

      setLoading(true);
      setError(null);

      const match = chapter.match(/chapter-(\d+)/);
      if (!match) {
        setError("Invalid chapter format");
        setLoading(false);
        return;
      }

      const chapNum = parseInt(match[1], 10);
      setChapterNumber(chapNum);

      try {
        const [mangaData, settingsData] = await Promise.all([
          getMangaBySlug(slug),
          getSettings()
        ]);
        
        if (!mangaData) {
          setError("Manga not found");
          setLoading(false);
          return;
        }

        if (chapNum < 1 || chapNum > mangaData.totalChapters) {
          setError(`Chapter ${chapNum} does not exist`);
          setLoading(false);
          return;
        }

        setManga(mangaData);
        setSettings(settingsData);

        const url = generateChapterUrl(mangaData, chapNum);
        setRedirectUrl(url);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load chapter");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [chapter, slug, initialManga, initialChapterNumber]);

  // Loading state with SEO from URL
  if (loading) {
    return (
      <>
        <Head>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={`${SITE_URL}/manga/${slug}`} />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={fullUrl} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading {formattedSlugTitle} Chapter {urlChapterNumber}...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>{error} | Luvrix</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-4">Error</h1>
            <p className="mb-6">{error}</p>
            <Link
              href={`/manga/${slug}`}
              className="px-6 py-3 bg-white text-primary rounded-lg font-semibold inline-block"
            >
              Back to Manga
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        
        {/* Robots — noindex: chapter pages are not indexable (external redirect architecture) */}
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${SITE_URL}/manga/${slug}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={`${manga?.title || formattedSlugTitle} Chapter ${currentChapterNum}`} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="1200" />
        <meta property="og:site_name" content="Luvrix" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      
      {/* No structured data — page is noindex, chapters link directly to external source */}

      {settings?.adsEnabled && settings?.adsCode && (
        <div dangerouslySetInnerHTML={{ __html: settings.adsCode }} />
      )}

      <MangaRedirectBox
        mangaTitle={manga?.title}
        chapterNumber={chapterNumber}
        redirectUrl={redirectUrl}
        autoRedirect={manga?.autoRedirect === true}
        redirectDelay={manga?.redirectDelay || settings?.mangaRedirectDelay || 5}
        backUrl={`/manga/${slug}`}
      />

      <ChapterContent
        mangaTitle={manga?.title || formattedSlugTitle}
        chapterNumber={currentChapterNum}
        genre={manga?.genre}
        author={manga?.author}
        status={manga?.status}
        totalChapters={manga?.totalChapters}
        description={manga?.description}
        settings={settings}
      />
    </>
  );
}

function AnimatedSection({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ChapterContent({ mangaTitle, chapterNumber, genre, author, status, totalChapters, description, settings }) {
  const plainDesc = (description || "").replace(/<[^>]*>/g, "").trim();
  const shortDesc = plainDesc.slice(0, 200) || `${mangaTitle} is a captivating ${genre || "manga"} series that has garnered a dedicated following among readers worldwide.`;

  const sections = [
    {
      icon: "📖",
      title: `Chapter ${chapterNumber} Overview`,
      iconBg: "bg-violet-100",
      bar: "bg-violet-500",
      content: (
        <>
          <p>Welcome to the comprehensive guide for <strong>{mangaTitle} Chapter {chapterNumber}</strong>. This chapter continues the gripping narrative that fans have come to love, delivering intense plot developments and meaningful character interactions. {shortDesc}</p>
          <p>In this installment, readers will discover pivotal moments that shape the future direction of the storyline. Whether you are a long-time follower or a newcomer exploring the series for the first time, Chapter {chapterNumber} offers essential context and thrilling revelations that connect directly to the overarching plot of {mangaTitle}.</p>
        </>
      ),
    },
    {
      icon: "⚔️",
      title: "Detailed Plot Summary",
      iconBg: "bg-blue-100",
      bar: "bg-blue-500",
      content: (
        <>
          <p>Chapter {chapterNumber} of {mangaTitle} opens with a powerful sequence that immediately draws the reader into the current story arc. The pacing masterfully balances exposition with action, ensuring that each panel serves a clear narrative purpose. Tension builds steadily as relationships between key characters are tested by new challenges and revelations.</p>
          <p>As the chapter unfolds, critical information is revealed that recontextualizes earlier events in the series. The author weaves together multiple plot threads with precision, rewarding attentive readers who have followed the story from the beginning. The stakes escalate significantly, setting the stage for what promises to be an even more dramatic continuation.</p>
          <p>The closing scenes of Chapter {chapterNumber} leave readers with a compelling cliffhanger that raises urgent questions about the direction of the narrative. This technique has become a hallmark of {mangaTitle}, keeping audiences eagerly anticipating each new release.</p>
        </>
      ),
    },
    {
      icon: "🎭",
      title: "Character Development & Analysis",
      iconBg: "bg-rose-100",
      bar: "bg-rose-500",
      content: (
        <>
          <p>One of the greatest strengths of {mangaTitle} is its rich character development, and Chapter {chapterNumber} is no exception. The protagonists face moral dilemmas that force them to confront their deepest beliefs and motivations. This internal conflict adds layers of complexity to characters who are already well-established within the series.</p>
          <p>Supporting characters also receive meaningful screen time in this chapter, with their individual arcs intersecting with the main storyline in surprising ways. The dynamic between allies and antagonists shifts in subtle but important ways, creating an atmosphere of uncertainty that keeps readers engaged. {author ? `Author ${author} demonstrates exceptional skill in balancing multiple character perspectives without losing narrative coherence.` : "The mangaka demonstrates exceptional skill in balancing multiple character perspectives without losing narrative coherence."}</p>
          <p>The emotional depth presented in this chapter resonates powerfully with the audience. Moments of vulnerability, determination, and sacrifice are portrayed with nuance, making the characters feel authentic and relatable despite the fantastical setting of the story.</p>
        </>
      ),
    },
    {
      icon: "🎨",
      title: "Art Style & Visual Storytelling",
      iconBg: "bg-amber-100",
      bar: "bg-amber-500",
      content: (
        <>
          <p>The visual presentation in Chapter {chapterNumber} maintains the high standard that {mangaTitle} is known for. Action sequences are choreographed with dynamic panel layouts that guide the reader's eye naturally through each scene. The use of contrast between detailed close-ups and sweeping wide shots creates a cinematic reading experience.</p>
          <p>Particularly noteworthy in this chapter is the attention to environmental detail. Backgrounds are rendered with care, establishing atmosphere and mood that complement the emotional beats of the story. Character expressions are drawn with subtlety, conveying complex emotions through minimal but effective artistic choices.</p>
        </>
      ),
    },
    {
      icon: "🔮",
      title: "Series Context & What to Expect Next",
      iconBg: "bg-emerald-100",
      bar: "bg-emerald-500",
      content: (
        <>
          <p>{mangaTitle} currently has {totalChapters || "multiple"} chapters available{status ? ` and is ${status.toLowerCase()}` : ""}{genre ? `. As a ${genre} series, it` : ". It"} continues to attract new readers while maintaining its dedicated fanbase. Chapter {chapterNumber} plays a crucial role in the larger narrative, bridging earlier story arcs with upcoming developments.</p>
          <p>For readers who are up to date, the events of this chapter carry significant implications for the future of the series. The seeds planted here are likely to bloom in upcoming chapters, making this an essential installment that should not be skipped. We recommend reading closely and paying attention to the details, as they may become relevant in surprising ways as the story progresses.</p>
          <p>Whether you are reading {mangaTitle} for the action, the character drama, or the intricate world-building, Chapter {chapterNumber} delivers on all fronts. It stands as a testament to the quality storytelling that has made this series a standout in its genre.</p>
        </>
      ),
    },
  ];

  return (
    <article className="relative overflow-hidden bg-white">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500" />

      <div className="px-4 py-12 md:py-20">
        {/* Hero title */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-full text-purple-700 text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              {genre || "Manga"} — Chapter {chapterNumber}{totalChapters ? ` of ${totalChapters}` : ""}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight"
          >
            {mangaTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-500 font-medium"
          >
            Chapter {chapterNumber} — Full Summary &amp; Analysis
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-1 w-20 mx-auto mt-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </div>

        {/* Content sections with ads */}
        <div className="max-w-3xl mx-auto space-y-6">
          {sections.map((sec, i) => (
            <React.Fragment key={i}>
              <AnimatedSection delay={i * 0.08}>
                <div className={`relative rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${sec.iconBg}`}>
                      {sec.icon}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 m-0">{sec.title}</h2>
                  </div>
                  <div className={`w-12 h-1 rounded-full mb-5 ${sec.bar}`} />
                  <div className="prose prose-base md:prose-lg max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-gray-900">
                    {sec.content}
                  </div>
                </div>
              </AnimatedSection>
              {i === 1 && <AdRenderer position="content_middle" settings={settings} className="my-4" />}
              {i === 3 && <AdRenderer position="content_middle" settings={settings} className="my-4" />}
            </React.Fragment>
          ))}
        </div>

        {/* Tags */}
        <AnimatedSection delay={0.3} className="max-w-3xl mx-auto mt-10">
          <div className="flex flex-wrap justify-center gap-2">
            {[mangaTitle, `Chapter ${chapterNumber}`, genre, "Read Online", "Manga", status].filter(Boolean).map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </article>
  );
}

// Server-side data fetching for SEO
export async function getServerSideProps(context) {
  const { slug, chapter } = context.params;
  
  if (!slug || !chapter) {
    return { props: { initialManga: null, initialSettings: null, initialChapterNumber: null } };
  }

  const match = chapter.match(/chapter-(\d+)/);
  if (!match) {
    return { props: { initialManga: null, initialSettings: null, initialChapterNumber: null } };
  }

  const chapNum = parseInt(match[1], 10);

  try {
    const { getMangaBySlug, getSettings } = await import("../../../lib/api-client");
    
    const [mangaData, settingsData] = await Promise.all([
      getMangaBySlug(slug),
      getSettings()
    ]);
    
    if (!mangaData) {
      return { props: { initialManga: null, initialSettings: null, initialChapterNumber: chapNum } };
    }

    // Serialize timestamps for SSR
    const serializeData = (obj) => {
      if (!obj) return null;
      const serialized = { ...obj };
      for (const key in serialized) {
        if (serialized[key]?.toDate) {
          serialized[key] = serialized[key].toDate().toISOString();
        } else if (serialized[key]?.seconds) {
          serialized[key] = new Date(serialized[key].seconds * 1000).toISOString();
        }
      }
      return serialized;
    };

    return {
      props: {
        initialManga: serializeData(mangaData),
        initialSettings: serializeData(settingsData),
        initialChapterNumber: chapNum,
      },
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return { props: { initialManga: null, initialSettings: null, initialChapterNumber: null } };
  }
}
