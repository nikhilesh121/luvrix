import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BOT_UA = /bot|crawl|spider|slurp|bingbot|googlebot|yandex|baidu|duckduck|semrush|ahref/i;

export default function MangaRedirectBox({
  mangaTitle,
  chapterNumber,
  redirectUrl,
  autoRedirect = false,
  redirectDelay = 5,
  backUrl,
}) {
  const [countdown, setCountdown] = useState(redirectDelay);
  const [redirecting, setRedirecting] = useState(false);
  const [isBot, setIsBot] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && BOT_UA.test(navigator.userAgent)) {
      setIsBot(true);
    }
  }, []);

  useEffect(() => {
    if (!autoRedirect || isBot || !redirectUrl) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRedirecting(true);
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRedirect, redirectUrl, isBot]);

  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{mangaTitle}</h2>
          <p className="text-lg text-primary font-semibold">Chapter {chapterNumber}</p>
        </div>

        {autoRedirect && !isBot && (
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              {redirecting ? "Redirecting now..." : `Redirecting in ${countdown}s`}
            </p>
            {!redirecting && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: redirectDelay, ease: "linear" }}
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <a
            href={redirectUrl}
            rel="nofollow noopener"
            className="block w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition text-lg"
          >
            Read Now →
          </a>
          {backUrl && (
            <a href={backUrl} className="block text-sm text-gray-500 hover:text-primary transition">
              ← Back to Manga
            </a>
          )}
          {!autoRedirect && (
            <p className="text-xs text-gray-400">Click the button above to read this chapter</p>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-400">Advertisement</p>
          <div id="manga-redirect-ad" className="min-h-[100px]"></div>
        </div>
      </motion.div>
    </div>
  );
}
