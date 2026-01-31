import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const menuData = {
  Anime: {
    categories: ["News", "Reviews", "Top Lists", "Upcoming"],
    featured: [
      { title: "Best Anime 2026", slug: "best-anime-2026" },
      { title: "Winter Season Guide", slug: "winter-season-guide" },
    ],
  },
  Manga: {
    categories: ["Latest Chapters", "Reviews", "Recommendations"],
    featured: [
      { title: "Top Manga This Week", slug: "top-manga-this-week" },
      { title: "Hidden Gems", slug: "manga-hidden-gems" },
    ],
  },
  Technology: {
    categories: ["Gaming", "Apps", "Hardware", "Software"],
    featured: [
      { title: "Tech Reviews", slug: "tech-reviews" },
      { title: "Best Gadgets 2026", slug: "best-gadgets-2026" },
    ],
  },
};

export default function MegaMenu({ isOpen, activeMenu, onClose }) {
  const data = menuData[activeMenu];

  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 bg-white shadow-xl border-t z-50"
          onMouseLeave={onClose}
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {data.categories.map((cat) => (
                    <li key={cat}>
                      <Link
                        href={`/categories?cat=${activeMenu.toLowerCase()}&sub=${cat.toLowerCase()}`}
                        className="text-gray-700 hover:text-primary transition"
                        onClick={onClose}
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Featured */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                  Featured
                </h3>
                <ul className="space-y-2">
                  {data.featured.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/blog?slug=${item.slug}`}
                        className="text-gray-700 hover:text-primary transition"
                        onClick={onClose}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                  Quick Links
                </h3>
                <div className="space-y-4">
                  <Link
                    href={`/categories?cat=${activeMenu.toLowerCase()}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    onClick={onClose}
                  >
                    <span className="font-semibold text-gray-800">
                      View All {activeMenu}
                    </span>
                    <p className="text-sm text-gray-500">
                      Browse all {activeMenu.toLowerCase()} content
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
