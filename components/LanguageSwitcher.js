import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FiGlobe, FiChevronDown, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

export default function LanguageSwitcher({ compact = false }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState("en");
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load saved locale from localStorage or use router locale
    const savedLocale = localStorage.getItem("preferredLocale");
    if (savedLocale && languages.some(l => l.code === savedLocale)) {
      setCurrentLocale(savedLocale);
    } else if (router.locale) {
      setCurrentLocale(router.locale);
    }
  }, [router.locale]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (localeCode) => {
    // Save to localStorage for persistence
    localStorage.setItem("preferredLocale", localeCode);
    setCurrentLocale(localeCode);
    setIsOpen(false);

    // Update router locale if using next-intl routing
    if (router.locale !== localeCode) {
      router.push(router.pathname, router.asPath, { locale: localeCode });
    }
  };

  const currentLanguage = languages.find(l => l.code === currentLocale) || languages[0];

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
          aria-label="Select language"
        >
          <span className="text-base">{currentLanguage.flag}</span>
          <FiChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-40 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                    currentLocale === language.code ? "bg-purple-500/10 text-purple-400" : "text-gray-300"
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm font-medium">{language.name}</span>
                  {currentLocale === language.code && (
                    <FiCheck className="w-4 h-4 ml-auto text-purple-400" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        aria-label="Select language"
      >
        <FiGlobe className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">{currentLanguage.name}</span>
        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Select Language</p>
            </div>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white/5 transition-colors ${
                  currentLocale === language.code ? "bg-purple-500/10" : ""
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${currentLocale === language.code ? "text-purple-400" : "text-gray-200"}`}>
                    {language.name}
                  </p>
                  <p className="text-xs text-gray-500">{language.code.toUpperCase()}</p>
                </div>
                {currentLocale === language.code && (
                  <FiCheck className="w-5 h-5 text-purple-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
