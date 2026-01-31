import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import "react-quill/dist/quill.snow.css";
import { AuthProvider } from "../context/AuthContext";
import { BlogCacheProvider } from "../context/BlogCacheContext";
import dynamic from 'next/dynamic';

const CookieConsent = dynamic(() => import('../components/CookieConsent'), { ssr: false });

// Google Analytics pageview tracking
const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
};

function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url) => {
      if (url !== router.asPath) {
        setLoading(true);
      }
    };
    const handleComplete = (url) => {
      setLoading(false);
      // Track pageview in Google Analytics
      pageview(url);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <AuthProvider>
      <BlogCacheProvider>
        {loading && <PageLoader />}
        <Component {...pageProps} />
        <CookieConsent />
      </BlogCacheProvider>
    </AuthProvider>
  );
}

export default MyApp;
