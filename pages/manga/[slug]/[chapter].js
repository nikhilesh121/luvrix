import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { getMangaBySlug, getSettings } from "../../../lib/api-client";
import { generateChapterUrl } from "../../../utils/mangaRedirectGenerator";
import MangaRedirectBox from "../../../components/MangaRedirectBox";
import { BreadcrumbSchema, ChapterSchema } from "../../../components/SEOHead";

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

// Helper to apply SEO template with chapter-specific placeholders
const applyChapterTemplate = (template, data, chapNum) => {
  if (!template) return null;
  return template
    .replace(/{title}/g, data?.title || '')
    .replace(/{chapter}/g, chapNum || '')
    .replace(/{chapters}/g, data?.totalChapters || '')
    .replace(/{status}/g, data?.status || 'Ongoing')
    .replace(/{author}/g, data?.author || '')
    .replace(/{genre}/g, data?.genre || '');
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
    if (!url) return `${SITE_URL}/og-default.svg`;
    if (url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
  };
  const ogImage = manga?.coverUrl ? getAbsoluteImageUrl(manga.coverUrl) : `${SITE_URL}/og-default.svg`;

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
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={fullUrl} />
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
        
        {/* Robots */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={fullUrl} />
        
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
      
      {/* Chapter Schema for Search Engines */}
      {manga && <ChapterSchema manga={manga} chapterNumber={chapterNumber} url={pageUrl} />}
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Manga", url: "/manga" },
        { name: manga?.title, url: `/manga/${slug}` },
        { name: `Chapter ${chapterNumber}`, url: pageUrl },
      ]} />

      {settings?.adsEnabled && settings?.adsCode && (
        <div dangerouslySetInnerHTML={{ __html: settings.adsCode }} />
      )}

      <MangaRedirectBox
        mangaTitle={manga?.title}
        chapterNumber={chapterNumber}
        redirectUrl={redirectUrl}
        delay={3000}
        backUrl={`/manga/${slug}`}
      />
    </>
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
