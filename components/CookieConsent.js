import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiShield, FiCheck } from "react-icons/fi";
import Link from "next/link";
import { getApiUrl } from "../lib/api-config";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [cookieSettings, setCookieSettings] = useState(null);

  useEffect(() => {
    // Check if user already accepted cookies
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Fetch cookie settings from API
      fetchCookieSettings();
    }
  }, []);

  const fetchCookieSettings = async () => {
    try {
      const res = await fetch(getApiUrl("/api/settings/cookies/"));
      const data = await res.json();
      if (data.enabled !== false) {
        setCookieSettings(data);
        setShowBanner(true);
      }
    } catch (err) {
      // Default to showing banner
      setCookieSettings({ enabled: true, message: "We use cookies to enhance your experience." });
      setShowBanner(true);
    }
  };

  const recordConsent = (accepted, analytics, marketing) => {
    fetch(getApiUrl("/api/consent"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted, analytics, marketing }),
    }).catch(() => {});
  };

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      analytics: true,
      marketing: true,
    }));
    recordConsent(true, true, true);
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
      analytics: false,
      marketing: false,
    }));
    recordConsent(false, false, false);
    setShowBanner(false);
  };

  if (!showBanner || !cookieSettings?.enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-4xl mx-auto bg-[#1a1a24] border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Cookie Consent</h3>
                <p className="text-gray-400 text-sm">
                  {cookieSettings?.message || 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept", you consent to our use of cookies.'}
                </p>
                <Link href="/privacy" className="text-purple-400 text-sm hover:text-pink-400 transition-colors">
                  Learn more →
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={declineCookies}
                className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm font-medium transition-all"
              >
                Decline
              </button>
              <button
                onClick={acceptCookies}
                className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <FiCheck className="w-4 h-4" /> Accept
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
