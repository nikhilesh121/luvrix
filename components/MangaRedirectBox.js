import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MangaRedirectBox({ 
  mangaTitle, 
  chapterNumber, 
  redirectUrl, 
  delay = 3000 
}) {
  const [countdown, setCountdown] = useState(Math.ceil(delay / 1000));
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
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
  }, [redirectUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {mangaTitle}
          </h1>
          <p className="text-lg text-primary font-semibold">
            Chapter {chapterNumber}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            {redirecting ? "Redirecting now..." : "Redirecting in"}
          </p>
          {!redirecting && (
            <div className="text-5xl font-bold text-primary">
              {countdown}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={redirectUrl}
            className="block w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Read Now
          </a>
          <p className="text-xs text-gray-400">
            You will be redirected to the manga reading page automatically
          </p>
        </div>

        {/* Ad Space */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-400">Advertisement</p>
          <div id="manga-redirect-ad" className="min-h-[100px]"></div>
        </div>
      </motion.div>
    </div>
  );
}
