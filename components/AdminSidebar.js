import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiFileText,
  FiBook,
  FiUsers,
  FiDollarSign,
  FiMonitor,
  FiBarChart2,
  FiSettings,
  FiArrowLeft,
  FiCreditCard,
  FiDroplet,
  FiLock,
  FiZap,
  FiMenu as FiMenuIcon,
  FiSearch,
  FiMap,
  FiMail,
  FiTrendingUp,
  FiEdit3,
  FiX,
} from "react-icons/fi";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: FiHome },
  { href: "/admin/trending", label: "Trending Topics", icon: FiTrendingUp },
  { href: "/admin/drafts", label: "Draft Queue", icon: FiEdit3 },
  { href: "/admin/blogs", label: "Blogs", icon: FiFileText },
  { href: "/admin/manga", label: "Manga", icon: FiBook },
  { href: "/admin/users", label: "Users", icon: FiUsers },
  { href: "/admin/subscribers", label: "Subscribers", icon: FiMail },
  { href: "/admin/payments", label: "Payments", icon: FiDollarSign },
  { href: "/admin/menus", label: "Menus", icon: FiMenuIcon },
  { href: "/admin/payu", label: "PayU Config", icon: FiCreditCard },
  { href: "/admin/ads", label: "Ads", icon: FiMonitor },
  { href: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
  { href: "/admin/theme", label: "Theme", icon: FiDroplet },
  { href: "/admin/seo-settings", label: "SEO Files", icon: FiSearch },
  { href: "/admin/sitemap", label: "Sitemap", icon: FiMap },
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
  { href: "/admin/change-password", label: "Password", icon: FiLock },
];

export default function AdminSidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        {isOpen ? <FiX className="w-5 h-5" /> : <FiMenuIcon className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-[55]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-black h-screen fixed left-0 top-0 border-r border-gray-800 flex flex-col overflow-hidden z-[60] transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <FiZap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Luvrix
            </h1>
            <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Main Menu
        </p>
        {menuItems.slice(0, 8).map((item, index) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-white/20" : "bg-gray-800"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {item.label}
              </Link>
            </motion.div>
          );
        })}

        <p className="px-3 py-2 mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Settings
        </p>
        {menuItems.slice(8).map((item, index) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 5) * 0.05 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-white/20" : "bg-gray-800"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Back to Site */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <motion.div whileHover={{ x: -5 }} transition={{ duration: 0.2 }}>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all"
          >
            <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
              <FiArrowLeft className="w-5 h-5" />
            </div>
            Back to Website
          </Link>
        </motion.div>
      </div>
    </aside>
    </>
  );
}
