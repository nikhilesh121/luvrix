import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google AdSense Verification */}
        <meta name="google-adsense-account" content="ca-pub-9162211780712502" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9162211780712502"
          crossOrigin="anonymous"
        />
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
        {/* Mobile App Compatibility */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Luvrix" />
        <meta name="application-name" content="Luvrix" />
        <meta name="theme-color" content="#9333ea" />
        <link rel="manifest" href="/manifest.json" />
        {/* Favicon - Animated Lightning Logo */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
