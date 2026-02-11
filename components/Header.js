import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getSettings } from "../lib/api-client";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";
import { 
  FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiChevronDown, 
  FiEdit3, FiGrid, FiBookOpen, FiTrendingUp, FiCpu, FiHeart,
  FiDollarSign, FiGlobe, FiActivity, FiCoffee, FiMapPin, FiBook,
  FiFilm, FiMusic, FiCamera, FiStar, FiAward, FiTrophy, FiHome,
  FiSearch, FiZap, FiLayers, FiBell, FiCommand, FiUsers,
  FiSun, FiMoon, FiGift
} from "react-icons/fi";

const defaultMenuData = [
  {
    label: "News",
    href: "/categories?category=News",
    submenu: [
      { label: "Politics", href: "/categories?category=Politics", icon: FiGlobe },
      { label: "Business", href: "/categories?category=Business", icon: FiDollarSign },
      { label: "Sports", href: "/categories?category=Sports", icon: FiActivity },
      { label: "Science", href: "/categories?category=Science", icon: FiCpu },
    ],
  },
  {
    label: "Blog",
    href: "/categories",
    submenu: [
      { label: "Food", href: "/categories?category=Food", icon: FiCoffee },
      { label: "Travel", href: "/categories?category=Travel", icon: FiMapPin },
      { label: "Lifestyle", href: "/categories?category=Lifestyle", icon: FiHeart },
      { label: "Health", href: "/categories?category=Health", icon: FiActivity },
    ],
  },
  {
    label: "Entertainment",
    href: "/categories?category=Entertainment",
    submenu: [
      { label: "Anime", href: "/categories?category=Anime", icon: FiStar },
      { label: "Gaming", href: "/categories?category=Gaming", icon: FiGrid },
      { label: "Movies", href: "/categories?category=Entertainment", icon: FiFilm },
      { label: "Music", href: "/categories?category=Culture", icon: FiMusic },
    ],
  },
  {
    label: "Manga",
    href: "/manga",
    icon: FiBookOpen,
  },
  {
    label: "Giveaways",
    href: "/giveaway",
    icon: FiGift,
  },
];

const iconMap = {
  FiGlobe, FiDollarSign, FiActivity, FiCpu, FiCoffee, FiMapPin, FiHeart,
  FiStar, FiGrid, FiFilm, FiMusic, FiCamera, FiAward, FiBookOpen, FiBook, FiGift,
};

const getIconComponent = (iconName) => {
  return iconMap[iconName] || FiStar;
};

const convertSettingsMenuToMenuData = (settingsMenus) => {
  if (!settingsMenus || settingsMenus.length === 0) return defaultMenuData;
  
  return settingsMenus.map((menu) => ({
    label: menu.name,
    href: menu.submenus?.length > 0 ? menu.submenus[0]?.href : `/categories?category=${menu.name}`,
    submenu: menu.submenus?.map((sub) => ({
      label: sub.name,
      href: sub.href,
      icon: FiStar,
    })),
  }));
};

export default function Header() {
  const router = useRouter();
  const { user, userData, logout, isLoggedIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(null);
  const [menuData, setMenuData] = useState(defaultMenuData);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const timeoutRef = useRef(null);

  // Scroll detection for header effects
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      const mangaVisibility = s?.mangaVisibility || { web: true, mobileWeb: true };
      const isMangaVisible = mangaVisibility.web || mangaVisibility.mobileWeb;
      
      if (s?.navigationMenus) {
        let menus = convertSettingsMenuToMenuData(s.navigationMenus);
        // Always append Manga and Giveaways links (controlled separately)
        if (isMangaVisible) {
          menus.push({ label: "Manga", href: "/manga", icon: FiBookOpen });
        }
        menus.push({ label: "Giveaways", href: "/giveaway", icon: FiGift });
        setMenuData(menus);
      } else {
        if (!isMangaVisible) {
          setMenuData(defaultMenuData.filter(m => m.label !== "Manga"));
        }
      }
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleMouseEnter = (index) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveSubmenu(index);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveSubmenu(null), 150);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/categories?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <motion.header 
      initial={false}
      animate={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.98)",
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      className="backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100/80"
    >
      {/* Animated gradient line at top */}
      <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-secondary animate-gradient-x" />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with enhanced animation */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 8 }}
              whileTap={{ scale: 0.92 }}
              className="relative"
            >
              <motion.div 
                className="w-11 h-11 bg-gradient-to-br from-primary via-purple-500 to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300"
                animate={{ 
                  boxShadow: scrolled 
                    ? "0 4px 15px rgba(255, 0, 85, 0.3)" 
                    : "0 8px 25px rgba(255, 0, 85, 0.4)"
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-purple-500/20"
                />
                <FiZap className="w-6 h-6 text-white relative z-10" />
              </motion.div>
              <motion.div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div className="hidden sm:block">
              <motion.span 
                className="text-xl font-black bg-gradient-to-r from-gray-900 via-primary to-secondary bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{ backgroundPosition: ["0% center", "100% center", "0% center"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                {settings?.siteName || "Luvrix"}
              </motion.span>
              <p className="text-[10px] text-gray-400 font-medium -mt-1 tracking-wider">Stories & Knowledge</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-primary hover:bg-primary/5 transition-all">
              <FiHome className="w-4 h-4" /> Home
            </Link>
            {menuData.map((item, index) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.submenu && handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeSubmenu === index
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {item.label}
                  {item.submenu && (
                    <motion.div
                      animate={{ rotate: activeSubmenu === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                  )}
                </Link>

                {/* Dropdown Submenu */}
                <AnimatePresence>
                  {item.submenu && activeSubmenu === index && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 overflow-hidden"
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {item.label} Categories
                        </p>
                      </div>
                      {item.submenu.map((subItem, subIndex) => {
                        const SubItemIcon = subItem.icon || FiStar;
                        return (
                          <motion.div
                            key={subItem.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: subIndex * 0.05 }}
                          >
                            <Link
                              href={subItem.href}
                                                            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <SubItemIcon className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                              </div>
                              <span className="font-medium">{subItem.label}</span>
                              <FiChevronDown className="w-4 h-4 ml-auto -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Button - hidden on mobile, available in mobile menu */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden sm:flex p-2.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              <FiSearch className="w-5 h-5" />
            </motion.button>

            {/* Notification Bell - Real-time notifications */}
            {user && <NotificationBell />}

            {/* Write Button - Always visible on desktop */}
            <Link href="/create-blog" className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium text-sm rounded-xl hover:from-primary/20 hover:to-secondary/20 transition-all group">
              <motion.div whileHover={{ rotate: 15 }}>
                <FiEdit3 className="w-4 h-4" />
              </motion.div>
              <span className="group-hover:tracking-wide transition-all">Write</span>
            </Link>

            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <FiUser className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                    {userData?.name?.split(" ")[0] || "User"}
                  </span>
                  <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </motion.button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-800">{userData?.name || "User"}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiGrid className="w-4 h-4" />
                          <span>My Dashboard</span>
                        </Link>
                        <Link
                          href="/create-blog"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiEdit3 className="w-4 h-4" />
                          <span>Create Blog</span>
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiHeart className="w-4 h-4" />
                          <span>My Favorites</span>
                        </Link>
                        <Link
                          href="/leaderboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiAward className="w-4 h-4" />
                          <span>Leaderboard</span>
                        </Link>
                        <Link
                          href="/publishers"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FiUsers className="w-4 h-4" />
                          <span>Publishers</span>
                        </Link>
                        {userData?.role === "ADMIN" && (
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <FiSettings className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                          className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                        >
                          {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={() => { handleLogout(); setDropdownOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 w-full text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={toggleTheme}
                  className="hidden sm:flex p-2.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                </button>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 sm:px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors rounded-xl hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/register"
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary via-purple-500 to-secondary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
                  >
                    <FiZap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-gray-100"
            >
              <div className="py-4 space-y-1">
                {/* Mobile Search */}
                <div className="px-4 pb-3 sm:hidden">
                  <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { router.push(`/categories?search=${encodeURIComponent(searchQuery)}`); setMenuOpen(false); setSearchQuery(""); } }}>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </form>
                </div>

                {/* Mobile Quick Actions */}
                <div className="flex items-center gap-2 px-4 pb-3 sm:hidden border-b border-gray-100 mb-2">
                  {!user && (
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary bg-gray-50 rounded-lg">
                      Sign In
                    </Link>
                  )}
                  <Link href="/create-blog" onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center gap-1.5">
                    <FiEdit3 className="w-3.5 h-3.5" /> Write
                  </Link>
                </div>

                {menuData.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => !item.submenu && setMenuOpen(false)}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.submenu && <FiChevronDown className="w-4 h-4" />}
                    </Link>
                    {item.submenu && (
                      <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1 mt-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon || FiStar;
                          return (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <SubIcon className="w-4 h-4" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Mobile Theme Toggle */}
                <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                    <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl p-4"
          >
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blogs, manga, articles..."
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-lg transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <FiCommand className="w-4 h-4" />
                <span>Press Enter to search</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
