import Head from "next/head";
import Script from "next/script";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useState } from "react";
import { getSettings } from "../lib/api-client";
import { initGA, trackPageView } from "../lib/analytics";
import { useRouter } from "next/router";

export default function Layout({ children, title, description, keywords, image, canonical, type = "website", author, publishedTime, modifiedTime, noindex = false }) {
  const [settings, setSettings] = useState(null);
  const router = useRouter();

  // Fetch settings and initialize GA
  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      // Initialize Google Analytics with the settings ID
      const gaId = (data?.analyticsEnabled && data?.analyticsId) ? data.analyticsId : process.env.NEXT_PUBLIC_GA_ID;
      if (gaId && gaId.startsWith('G-')) {
        initGA(gaId);
      }
    });
  }, []);

  // Track page views on route change
  useEffect(() => {
    const analyticsId = (settings?.analyticsEnabled && settings?.analyticsId) ? settings.analyticsId : process.env.NEXT_PUBLIC_GA_ID;
    if (analyticsId) {
      trackPageView(router.asPath, title || 'Luvrix');
    }
  }, [router.asPath, settings, title]);

  const siteName = settings?.siteName || "Luvrix";
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const analyticsId = (settings?.analyticsEnabled && settings?.analyticsId) ? settings.analyticsId : process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description || "Luvrix - Your destination for anime, manga, technology news and creative stories. Read manga, write blogs, and join a community of creators."} />
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Robots */}
        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        )}
        
        {/* Canonical URL */}
        {canonical && <link rel="canonical" href={canonical} />}
        
        {/* Open Graph */}
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description || "Luvrix - Your destination for anime, manga, technology news and creative stories."} />
        <meta property="og:type" content={type} />
        <meta property="og:locale" content="en_US" />
        {image && <meta property="og:image" content={image} />}
        {image && <meta property="og:image:width" content="1200" />}
        {image && <meta property="og:image:height" content="630" />}
        {canonical && <meta property="og:url" content={canonical} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description || "Luvrix - Your destination for anime, manga, technology news and creative stories."} />
        {image && <meta name="twitter:image" content={image} />}
        
        {/* Article Meta (for blog posts) */}
        {type === "article" && author && <meta property="article:author" content={author} />}
        {type === "article" && publishedTime && <meta property="article:published_time" content={publishedTime} />}
        {type === "article" && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        
        {/* Theme Color */}
        <meta name="theme-color" content={settings?.themeColor || "#9333ea"} />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </Head>

      {/* Google Analytics - Using Next.js Script for optimal loading */}
      {analyticsId && analyticsId.startsWith('G-') && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
            strategy="afterInteractive"
            onError={(e) => {
              console.error('GA script failed to load:', e);
            }}
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${analyticsId}', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      {/* CSS Variables for Theme */}
      <style jsx global>{`
        :root {
          --primary-color: ${settings?.themeColor || "#ff0055"};
          --secondary-color: #1a1a2e;
          --accent-color: #edf2f7;
        }
      `}</style>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      {/* Ads Code */}
      {settings?.adsEnabled && settings?.adsCode && (
        <div dangerouslySetInnerHTML={{ __html: settings.adsCode }} />
      )}
    </>
  );
}
