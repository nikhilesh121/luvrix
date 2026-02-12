import Head from "next/head";
import Script from "next/script";
import Header from "./Header";
import Footer from "./Footer";
import AdRenderer from "./AdRenderer";
import { useEffect, useState } from "react";
import { getSettings } from "../lib/api-client";
import { initGA, trackPageView, trackInternalPageView } from "../lib/analytics";
import { useRouter } from "next/router";
import useWatchTime from "../hooks/useWatchTime";

export default function Layout({ children, title, description, keywords, image, canonical, type = "website", author, publishedTime, modifiedTime, noindex = false }) {
  const [settings, setSettings] = useState(null);
  const router = useRouter();

  // Track active watch time (visibility-aware)
  useWatchTime();

  // Fetch settings and initialize GA
  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      // Initialize Google Analytics with the settings ID
      const gaId = (data?.analyticsEnabled && data?.analyticsId) ? data.analyticsId : process.env.NEXT_PUBLIC_GA_ID;
      if (gaId && gaId.startsWith("G-")) {
        initGA(gaId);
      }
    });
  }, []);

  // Track page views on route change
  useEffect(() => {
    const analyticsId = (settings?.analyticsEnabled && settings?.analyticsId) ? settings.analyticsId : process.env.NEXT_PUBLIC_GA_ID;
    if (analyticsId) {
      trackPageView(router.asPath, title || "Luvrix");
    }
    // Log page view to our own analytics (non-blocking)
    trackInternalPageView(router.asPath);
  }, [router.asPath, settings, title]);

  // Track unique visitor for platform stats
  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("_lv_tracked")) {
      fetch("/api/stats/platform", { method: "POST" }).catch(() => {});
      sessionStorage.setItem("_lv_tracked", "1");
    }
  }, []);

  const siteName = settings?.siteName || "Luvrix";
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const analyticsId = (settings?.analyticsEnabled && settings?.analyticsId) ? settings.analyticsId : process.env.NEXT_PUBLIC_GA_ID;
  const faviconUrl = settings?.faviconUrl || "https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description || "Luvrix - Read blogs, manga & stories from creators worldwide. Write, share, and discover amazing content. Free platform for writers and readers."} />
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        
        {/* Robots */}
        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        )}
        
        {/* Canonical URL — ensure trailing slash matches next.config trailingSlash:true */}
        {canonical && <link rel="canonical" href={canonical.includes('?') ? canonical : (canonical.endsWith('/') ? canonical : canonical + '/')} />}
        
        {/* Open Graph */}
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description || "Luvrix - Read blogs, manga & stories from creators worldwide. Write, share, and discover amazing content."} />
        <meta property="og:type" content={type} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={image || "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        {canonical && <meta property="og:url" content={canonical} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description || "Luvrix - Read blogs, manga & stories from creators worldwide. Write, share, and discover amazing content."} />
        <meta name="twitter:image" content={image || "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png"} />
        
        {/* Article Meta (for blog posts) */}
        {type === "article" && author && <meta property="article:author" content={author} />}
        {type === "article" && publishedTime && <meta property="article:published_time" content={publishedTime} />}
        {type === "article" && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        
        {/* Theme Color */}
        <meta name="theme-color" content={settings?.themeColor || "#9333ea"} />
        
        {/* AdSense Meta Verification */}
        {settings?.adsEnabled && settings?.adsenseMeta && (
          <meta name="google-adsense-account" content={settings.adsensePublisherId || ""} />
        )}
        
        {/* Google Search Console Verification */}
        {settings?.gscVerificationCode && (
          <meta name="google-site-verification" content={settings.gscVerificationCode} />
        )}
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {settings?.adsEnabled && <link rel="preconnect" href="https://pagead2.googlesyndication.com" />}
      </Head>

      {/* AdSense Global Script */}
      {settings?.adsEnabled && settings?.adsensePublisherId && (
        <Script
          id="adsense-script"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsensePublisherId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}

      {/* Auto Ads — admin-controlled, route-excluded, CLS-safe */}
      {settings?.adsEnabled && settings?.enableAutoAds && settings?.adsensePublisherId && (() => {
        const raw = settings?.autoAdsExcludedRoutes || "/admin,/login,/register,/error,/create-blog,/edit-blog,/preview-blog,/dashboard";
        const excludedRoutes = typeof raw === "string" ? raw.split(",").map(r => r.trim()).filter(Boolean) : raw;
        const isExcluded = excludedRoutes.some(r => router.asPath.startsWith(r));
        if (isExcluded) return null;
        return (
          <Script id="adsense-auto-ads" strategy="afterInteractive">
            {`(window.adsbygoogle = window.adsbygoogle || []).push({ google_ad_client: "${settings.adsensePublisherId}", enable_page_level_ads: true });`}
          </Script>
        );
      })()}

      {/* Google Analytics - Using Next.js Script for optimal loading */}
      {analyticsId && analyticsId.startsWith("G-") && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
            strategy="afterInteractive"
            onError={(e) => {
              console.error("GA script failed to load:", e);
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
        {/* Ad: Header Top */}
        <AdRenderer position="header_top" settings={settings} />
        
        <Header />
        
        {/* Ad: Below Header */}
        <AdRenderer position="header_below" settings={settings} />
        
        <main className="flex-1">
          {/* Ad: Content Top */}
          <AdRenderer position="content_top" settings={settings} className="max-w-7xl mx-auto px-4" />
          
          {children}
          
          {/* Ad: Content Bottom */}
          <AdRenderer position="content_bottom" settings={settings} className="max-w-7xl mx-auto px-4" />
        </main>
        
        {/* Ad: Above Footer */}
        <AdRenderer position="footer_above" settings={settings} />
        
        <Footer />
        
        {/* Ad: Footer Inside */}
        <AdRenderer position="footer_inside" settings={settings} />
      </div>

      {/* Ad: Sticky Bottom */}
      {settings?.adsEnabled && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <AdRenderer position="sticky_bottom" settings={settings} />
          </div>
        </div>
      )}
    </>
  );
}
