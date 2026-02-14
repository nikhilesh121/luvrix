import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Critical SEO Meta Tags - Always Server Rendered */}
        <meta name="description" content="Luvrix - Read free manga, manhwa, manhua, blogs and stories online. Discover trending content, join giveaways, and connect with creators." />
        <meta name="keywords" content="manga, manhwa, manhua, free manga, read manga online, blogs, stories, giveaways, Luvrix" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        {/* NOTE: Canonical URL must be set per-page in Layout component, NOT here */}
        
        {/* Open Graph defaults */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Luvrix" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card defaults */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@luvrix" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="format-detection" content="telephone=no" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google AdSense meta — script loaded dynamically by Layout.js (admin-controlled) */}
        <meta name="google-adsense-account" content="ca-pub-9162211780712502" />
        {/* Bing Webmaster Verification — get code from https://www.bing.com/webmasters/ */}
        {/* TODO: Replace YOUR_BING_CODE with actual verification code from Bing Webmaster Tools */}
        {process.env.NEXT_PUBLIC_BING_VERIFICATION && (
          <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_VERIFICATION} />
        )}
        {/* Mobile App Compatibility */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Luvrix" />
        <meta name="application-name" content="Luvrix" />
        <meta name="theme-color" content="#9333ea" />
        <link rel="manifest" href="/manifest.json" />
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon1.svg" />
      </Head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Luvrix",
              "url": "https://luvrix.com/",
              "logo": "https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png",
              "sameAs": [
                "https://facebook.com/luvrix",
                "https://twitter.com/luvrix",
                "https://instagram.com/luvrix"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": "https://luvrix.com/contact/"
              }
            }),
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
