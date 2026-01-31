import Head from "next/head";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";
const SITE_NAME = "Luvrix";

export default function SEOHead({
  title,
  description,
  keywords,
  focusKeyword,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noindex = false,
}) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || `${SITE_URL}/og-default.svg`;

  // Generate keywords string
  const keywordsString = focusKeyword 
    ? [focusKeyword, ...(keywords?.split(",") || []), ...tags].filter(Boolean).join(", ")
    : keywords;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description || `${SITE_NAME} - Your source for blogs and manga`} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      {author && <meta name="author" content={author} />}
      
      {/* Robots */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || `${SITE_NAME} - Your source for blogs and manga`} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific */}
      {type === "article" && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, i) => (
            <meta key={i} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || `${SITE_NAME} - Your source for blogs and manga`} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="theme-color" content="#6366f1" />
      <meta name="msapplication-TileColor" content="#6366f1" />
      
      {/* Structured Data for Website */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": type === "article" ? "Article" : "WebPage",
            name: title,
            description: description,
            url: fullUrl,
            image: ogImage,
            ...(type === "article" && {
              headline: title,
              author: author ? { "@type": "Person", name: author } : undefined,
              datePublished: publishedTime,
              dateModified: modifiedTime || publishedTime,
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/logo.png`,
                },
              },
            }),
          }),
        }}
      />
    </Head>
  );
}

// Blog Article Schema
export function BlogArticleSchema({ blog, url }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${url}`,
    },
    headline: blog.title,
    description: blog.seoDescription || blog.content?.replace(/<[^>]*>/g, "").slice(0, 160),
    image: blog.thumbnail || `${SITE_URL}/og-default.svg`,
    author: {
      "@type": "Person",
      name: blog.authorName || "Luvrix Author",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: blog.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    dateModified: blog.updatedAt?.toDate?.()?.toISOString() || blog.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    keywords: blog.focusKeyword || blog.seoKeywords || blog.category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Manga Schema
export function MangaSchema({ manga, url }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: manga.title,
    description: manga.seoDescription || manga.description,
    image: manga.coverUrl || `${SITE_URL}/og-default.svg`,
    url: `${SITE_URL}${url}`,
    author: {
      "@type": "Person",
      name: manga.author || "Unknown",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    numberOfPages: manga.totalChapters,
    genre: manga.genre || "Manga",
    inLanguage: "en",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Chapter Schema for Manga Chapters
export function ChapterSchema({ manga, chapterNumber, url }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `${manga.title} Chapter ${chapterNumber}`,
    description: `Read ${manga.title} Chapter ${chapterNumber} online. ${manga.seoDescription || manga.description || ""}`.slice(0, 160),
    isPartOf: {
      "@type": "Book",
      name: manga.title,
      author: {
        "@type": "Person",
        name: manga.author || "Unknown",
      },
    },
    position: chapterNumber,
    url: `${SITE_URL}${url}`,
    image: manga.coverUrl || `${SITE_URL}/og-default.svg`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Breadcrumb Schema
export function BreadcrumbSchema({ items }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Website Schema for Homepage
export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Your source for blogs and manga content",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    sameAs: [
      "https://facebook.com/luvrix",
      "https://twitter.com/luvrix",
      "https://instagram.com/luvrix",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
