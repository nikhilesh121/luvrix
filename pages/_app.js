import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import "react-quill/dist/quill.snow.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { BlogCacheProvider } from "../context/BlogCacheContext";
import { SocketProvider, useSocket } from "../context/SocketContext";
import { trackPageView, initGA } from "../lib/analytics";
import { getSettings } from "../lib/api-client";
import dynamic from 'next/dynamic';

const CookieConsent = dynamic(() => import('../components/CookieConsent'), { ssr: false });

// Initialize GA on app load
let gaInitialized = false;
const initializeGA = async () => {
  if (gaInitialized) return;
  try {
    const settings = await getSettings();
    const gaId = (settings?.analyticsEnabled && settings?.analyticsId) ? settings.analyticsId : process.env.NEXT_PUBLIC_GA_ID;
    if (gaId && gaId.startsWith('G-')) {
      initGA(gaId);
      gaInitialized = true;
    }
  } catch (error) {
    console.error('Failed to initialize GA:', error);
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

// Inner component to use hooks
function AppContent({ Component, pageProps, loading }) {
  const router = useRouter();
  const { user } = useAuth();
  const { emitPageView, emitPageLeave, isConnected } = useSocket();

  // Track page views for socket analytics
  useEffect(() => {
    if (isConnected) {
      const currentPage = router.asPath;
      emitPageView(currentPage, user?.uid);

      return () => {
        emitPageLeave(currentPage);
      };
    }
  }, [router.asPath, isConnected, user?.uid, emitPageView, emitPageLeave]);

  return (
    <>
      {loading && <PageLoader />}
      <Component {...pageProps} />
      <CookieConsent />
    </>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Initialize GA on mount
  useEffect(() => {
    initializeGA();
  }, []);

  useEffect(() => {
    const handleStart = (url) => {
      if (url !== router.asPath) {
        setLoading(true);
      }
    };
    const handleComplete = (url) => {
      setLoading(false);
      // Track pageview in Google Analytics
      trackPageView(url, document.title);
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
      <SocketProvider>
        <BlogCacheProvider>
          <AppContent Component={Component} pageProps={pageProps} loading={loading} />
        </BlogCacheProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default MyApp;
