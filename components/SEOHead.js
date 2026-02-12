import Head from "next/head";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";
const SITE_NAME = "Luvrix";
const OG_DEFAULT_IMAGE = "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";

export function getAbsoluteImageUrl(url) {
  if (!url) return OG_DEFAULT_IMAGE;
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
}

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
  const fullUrl = url ? `${SITE_URL}${url.endsWith('/') ? url : url + '/'}` : `${SITE_URL}/`;
  const ogImage = getAbsoluteImageUrl(image);

  // Generate keywords string
  const keywordsString = focusKeyword 
    ? [focusKeyword, ...(keywords?.split(",") || []), ...tags].filter(Boolean).join(", ")
    : keywords;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description || `${SITE_NAME} - Read blogs, manga, and stories from creators worldwide. Free platform for writers and readers.`} />
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
      <meta property="og:description" content={description || `${SITE_NAME} - Read blogs, manga, and stories from creators worldwide. Free platform for writers and readers.`} />
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
      <meta name="twitter:description" content={description || `${SITE_NAME} - Read blogs, manga, and stories from creators worldwide. Free platform for writers and readers.`} />
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
                  url: "https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png",
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
  const blogUrl = url?.endsWith('/') ? url : `${url}/`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${blogUrl}`,
    },
    headline: blog.title,
    description: blog.seoDescription || blog.content?.replace(/<[^>]*>/g, "").slice(0, 160),
    image: {
      "@type": "ImageObject",
      url: getAbsoluteImageUrl(blog.thumbnail),
      width: 1200,
      height: 630,
    },
    thumbnailUrl: getAbsoluteImageUrl(blog.thumbnail),
    author: {
      "@type": "Person",
      name: blog.authorName || "Luvrix Author",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: "https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png",
      },
    },
    datePublished: (typeof blog.createdAt === 'string' ? blog.createdAt : blog.createdAt?.toDate?.()?.toISOString()) || new Date().toISOString(),
    dateModified: (typeof blog.updatedAt === 'string' ? blog.updatedAt : blog.updatedAt?.toDate?.()?.toISOString()) || (typeof blog.createdAt === 'string' ? blog.createdAt : blog.createdAt?.toDate?.()?.toISOString()) || new Date().toISOString(),
    keywords: blog.focusKeyword || blog.seoKeywords || blog.category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Manga Schema — CreativeWorkSeries with numberOfEpisodes for chapter count signals
export function MangaSchema({ manga, url }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: manga.title,
    description: manga.seoDescription || manga.description,
    image: {
      "@type": "ImageObject",
      url: getAbsoluteImageUrl(manga.coverUrl),
      width: 800,
      height: 1200,
    },
    thumbnailUrl: getAbsoluteImageUrl(manga.coverUrl),
    url: `${SITE_URL}${url?.endsWith('/') ? url : url + '/'}`,
    author: {
      "@type": "Person",
      name: manga.author || "Unknown",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    numberOfEpisodes: manga.totalChapters,
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
    image: {
      "@type": "ImageObject",
      url: getAbsoluteImageUrl(manga.coverUrl),
      width: 800,
      height: 1200,
    },
    thumbnailUrl: getAbsoluteImageUrl(manga.coverUrl),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: "https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png",
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
      item: `${SITE_URL}${item.url?.endsWith('/') ? item.url : item.url + '/'}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// CollectionPage Schema for Categories & Manga Listing
export function CollectionPageSchema({ title, description, url, items = [] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: description,
    url: `${SITE_URL}${url?.endsWith('/') ? url : url + '/'}`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    ...(items.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.slice(0, 30).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: `${SITE_URL}${item.url}`,
          ...(item.image && {
            image: {
              "@type": "ImageObject",
              url: getAbsoluteImageUrl(item.image),
            },
          }),
        })),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ProfilePage Schema for User Profiles
export function ProfilePageSchema({ user, url }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: user?.name || "Luvrix User",
      url: `${SITE_URL}${url}`,
      ...(user?.photoURL && {
        image: {
          "@type": "ImageObject",
          url: getAbsoluteImageUrl(user.photoURL),
        },
      }),
      ...(user?.bio && { description: user.bio }),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
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
    url: `${SITE_URL}/`,
    description: "Read blogs, manga, and stories from creators worldwide. Free platform for writers and readers.",
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
