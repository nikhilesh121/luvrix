import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import BlogCard from "../components/BlogCard";
import { getAllBlogs, getSettings } from "../lib/api-client";
import AdRenderer from "../components/AdRenderer";
import { CollectionPageSchema, BreadcrumbSchema } from "../components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSearch, FiGrid, FiList, FiCode, FiFilm, FiHeart, FiGlobe,
  FiActivity, FiDollarSign, FiCoffee, FiMapPin, FiCpu,
  FiStar, FiZap, FiX
} from "react-icons/fi";

// Category configuration with icons, colors, and descriptions
const categoryConfig = {
  "All": { 
    icon: FiGrid, 
    gradient: "from-slate-600 to-slate-800",
    bgGradient: "from-slate-900 via-slate-800 to-slate-900",
    accent: "#64748b",
    description: "Explore all articles across every category"
  },
  "News": { 
    icon: FiGlobe, 
    gradient: "from-blue-500 to-blue-700",
    bgGradient: "from-blue-900 via-blue-800 to-indigo-900",
    accent: "#3b82f6",
    description: "Stay updated with the latest news"
  },
  "Politics": { 
    icon: FiActivity, 
    gradient: "from-red-500 to-red-700",
    bgGradient: "from-red-900 via-red-800 to-rose-900",
    accent: "#ef4444",
    description: "Political analysis and updates"
  },
  "Business": { 
    icon: FiDollarSign, 
    gradient: "from-emerald-500 to-emerald-700",
    bgGradient: "from-emerald-900 via-emerald-800 to-teal-900",
    accent: "#10b981",
    description: "Business insights and market trends"
  },
  "Sports": { 
    icon: FiActivity, 
    gradient: "from-orange-500 to-orange-700",
    bgGradient: "from-orange-900 via-orange-800 to-amber-900",
    accent: "#f97316",
    description: "Sports news and highlights"
  },
  "Science": { 
    icon: FiCpu, 
    gradient: "from-purple-500 to-purple-700",
    bgGradient: "from-purple-900 via-purple-800 to-violet-900",
    accent: "#a855f7",
    description: "Scientific discoveries and research"
  },
  "Food": { 
    icon: FiCoffee, 
    gradient: "from-amber-500 to-amber-700",
    bgGradient: "from-amber-900 via-amber-800 to-yellow-900",
    accent: "#f59e0b",
    description: "Recipes, reviews, and culinary adventures"
  },
  "Travel": { 
    icon: FiMapPin, 
    gradient: "from-teal-500 to-teal-700",
    bgGradient: "from-teal-900 via-teal-800 to-cyan-900",
    accent: "#14b8a6",
    description: "Travel guides and destination inspiration"
  },
  "Lifestyle": { 
    icon: FiHeart, 
    gradient: "from-pink-500 to-pink-700",
    bgGradient: "from-pink-900 via-pink-800 to-rose-900",
    accent: "#ec4899",
    description: "Lifestyle tips and wellness"
  },
  "Health": { 
    icon: FiActivity, 
    gradient: "from-green-500 to-green-700",
    bgGradient: "from-green-900 via-green-800 to-emerald-900",
    accent: "#22c55e",
    description: "Health tips and wellness guides"
  },
  "Entertainment": { 
    icon: FiFilm, 
    gradient: "from-violet-500 to-violet-700",
    bgGradient: "from-violet-900 via-violet-800 to-purple-900",
    accent: "#8b5cf6",
    description: "Movies, shows, and pop culture"
  },
  "Anime": { 
    icon: FiStar, 
    gradient: "from-rose-500 to-rose-700",
    bgGradient: "from-rose-900 via-rose-800 to-pink-900",
    accent: "#f43f5e",
    description: "Anime reviews and recommendations"
  },
  "Gaming": { 
    icon: FiZap, 
    gradient: "from-indigo-500 to-indigo-700",
    bgGradient: "from-indigo-900 via-indigo-800 to-blue-900",
    accent: "#6366f1",
    description: "Gaming news, reviews, and guides"
  },
  "Technology": { 
    icon: FiCode, 
    gradient: "from-cyan-500 to-cyan-700",
    bgGradient: "from-cyan-900 via-cyan-800 to-blue-900",
    accent: "#06b6d4",
    description: "Tech trends and innovations"
  },
};

const allCategories = Object.keys(categoryConfig);

export default function Categories() {
  const router = useRouter();
  const { cat, category } = router.query;
  const queryCategory = category || cat;

  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const [blogsData, settingsData] = await Promise.all([
          getAllBlogs("approved"),
          getSettings()
        ]);
        setBlogs(blogsData);
        setFilteredBlogs(blogsData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (queryCategory) {
      const matchedCategory = allCategories.find(
        (c) => c.toLowerCase() === queryCategory.toLowerCase()
      );
      setSelectedCategory(matchedCategory || queryCategory);
    }
  }, [queryCategory]);

  useEffect(() => {
    let filtered = blogs;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (blog) => blog.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (blog) =>
          blog.title?.toLowerCase().includes(query) ||
          blog.content?.toLowerCase().includes(query) ||
          blog.keywords?.toLowerCase().includes(query)
      );
    }

    setFilteredBlogs(filtered);
  }, [selectedCategory, searchQuery, blogs]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setShowCategoryPicker(false);
    if (cat === "All") {
      router.push("/categories", undefined, { shallow: true });
    } else {
      router.push(`/categories?category=${encodeURIComponent(cat)}`, undefined, { shallow: true });
    }
  };

  const config = categoryConfig[selectedCategory] || categoryConfig["All"];
  const CategoryIcon = config?.icon || FiGrid;

  return (
    <Layout
      title={selectedCategory === "All" ? "All Categories" : selectedCategory}
      description={config.description}
      canonical={selectedCategory === "All" ? "https://luvrix.com/categories/" : `https://luvrix.com/categories/?category=${encodeURIComponent(selectedCategory)}`}
    >
      <CollectionPageSchema
        title={selectedCategory === "All" ? "All Categories" : selectedCategory}
        description={config.description}
        url="/categories/"
        items={filteredBlogs.slice(0, 20).map(b => ({ title: b.title, url: b.slug ? `/blog/${b.slug}/` : `/blog/?id=${b.id}`, image: b.thumbnail }))}
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Categories", url: "/categories/" },
        ...(selectedCategory !== "All" ? [{ name: selectedCategory, url: `/categories/?category=${selectedCategory}` }] : []),
      ]} />
      <div className="min-h-screen bg-[#fafafa]">
        {/* Hero Section */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${config.bgGradient}`}>
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: config.accent }} />
              <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: config.accent }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]" style={{ background: config.accent }} />
            </div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-32 right-20 w-20 h-20 border border-white/10 rounded-2xl backdrop-blur-sm"
            />
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-32 left-20 w-16 h-16 border border-white/10 rounded-full backdrop-blur-sm"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Category Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-8"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <CategoryIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs uppercase tracking-wider">Category</p>
                  <p className="text-white font-bold text-lg">{selectedCategory}</p>
                </div>
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                {selectedCategory === "All" ? (
                  <>
                    Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40">Amazing</span>
                    <br />Articles
                  </>
                ) : (
                  <>
                    {selectedCategory}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40">Stories</span>
                  </>
                )}
              </h1>

              <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                {config.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 mb-10">
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-white">{filteredBlogs.length}</p>
                  <p className="text-white/60 text-sm">Articles</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-white">{allCategories.length - 1}</p>
                  <p className="text-white/60 text-sm">Categories</p>
                </div>
              </div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl" />
                  <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
                    <FiSearch className="w-6 h-6 text-white/60 ml-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="w-full bg-transparent px-4 py-5 text-white placeholder-white/50 focus:outline-none text-lg"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="p-2 mr-2 text-white/60 hover:text-white"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Wave Separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fafafa"/>
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 pb-20 -mt-4">
          {/* Category Pills & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-10 border border-gray-100"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Category Selector */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Browse Categories</p>
                <div className="flex flex-wrap gap-2">
                  {allCategories.slice(0, 8).map((cat) => {
                    const catConfig = categoryConfig[cat];
                    const isSelected = selectedCategory === cat;
                    return (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryChange(cat)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                          isSelected
                            ? `bg-gradient-to-r ${catConfig.gradient} text-white shadow-lg`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <catConfig.icon className="w-4 h-4" />
                        {cat}
                      </motion.button>
                    );
                  })}
                  {allCategories.length > 8 && (
                    <button
                      onClick={() => setShowCategoryPicker(true)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
                    >
                      +{allCategories.length - 8} More
                    </button>
                  )}
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={`p-3 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-gray-400"}`}
                  >
                    <FiGrid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`p-3 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-gray-400"}`}
                  >
                    <FiList className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {searchQuery ? "Search Results" : "Latest Articles"}
              </h2>
              <p className="text-gray-500 mt-1">
                Showing <span className="font-semibold text-gray-700">{filteredBlogs.length}</span> articles
                {selectedCategory !== "All" && <span> in <span className="font-semibold" style={{ color: config.accent }}>{selectedCategory}</span></span>}
              </p>
            </div>
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredBlogs.length > 0 ? (
            <motion.div 
              layout
              className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "space-y-6"
              }
            >
              <AnimatePresence mode="popLayout">
                {filteredBlogs.map((blog, index) => (
                  <React.Fragment key={blog.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <BlogCard blog={blog} index={index} viewMode={viewMode} />
                    </motion.div>
                    {(index + 1) % 6 === 0 && (
                      <div className="col-span-full">
                        <AdRenderer position="between_posts" settings={settings} className="my-2" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No articles found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                {searchQuery
                  ? "We couldn't find any articles matching your search. Try different keywords."
                  : "No articles in this category yet. Check back soon!"}
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Browse All Articles
              </button>
            </motion.div>
          )}
        </div>

        {/* Category Picker Modal */}
        <AnimatePresence>
          {showCategoryPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCategoryPicker(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">All Categories</h3>
                  <button
                    onClick={() => setShowCategoryPicker(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allCategories.map((cat) => {
                      const catConfig = categoryConfig[cat];
                      const isSelected = selectedCategory === cat;
                      return (
                        <motion.button
                          key={cat}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCategoryChange(cat)}
                          className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                            isSelected
                              ? `bg-gradient-to-r ${catConfig.gradient} text-white shadow-lg`
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-white/20" : "bg-white shadow-sm"
                          }`}>
                            <catConfig.icon className={`w-5 h-5 ${isSelected ? "text-white" : ""}`} style={{ color: isSelected ? undefined : catConfig.accent }} />
                          </div>
                          <span className="font-medium">{cat}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
