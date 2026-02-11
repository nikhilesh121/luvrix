import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getTrendingTopics, generateBlogDraft } from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import {
  FiTrendingUp, FiRefreshCw, FiZap, FiGlobe, FiExternalLink,
  FiEdit3, FiLoader, FiX, FiChevronDown, FiChevronUp, FiType
} from "react-icons/fi";

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "ID", name: "Indonesia" },
];

const CATEGORIES = [
  "Technology", "Entertainment", "Sports", "Business", "Health",
  "Science", "Politics", "Lifestyle", "Gaming", "General"
];

const TONES = [
  { value: "informative and engaging", label: "Informative" },
  { value: "conversational and friendly", label: "Conversational" },
  { value: "professional and authoritative", label: "Professional" },
  { value: "fun and entertaining", label: "Fun & Entertaining" },
  { value: "educational and detailed", label: "Educational" },
];

export default function AdminTrending() {
  return (
    <AdminGuard>
      <TrendingContent />
    </AdminGuard>
  );
}

function TrendingContent() {
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [generatingTopic, setGeneratingTopic] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [selectedTone, setSelectedTone] = useState("informative and engaging");
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTopic, setManualTopic] = useState("");

  useEffect(() => {
    fetchTopics();
  }, [selectedCountry]);

  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingTopics(selectedCountry);
      setTopics(data || []);
    } catch (err) {
      console.error("Error fetching topics:", err);
      setError(err.message);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTopics();
    setRefreshing(false);
  };

  const handleGenerateDraft = async (topic, isManual = false) => {
    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    const topicTitle = isManual ? topic : topic.title;
    setGeneratingTopic(topicTitle);
    try {
      const result = await generateBlogDraft(
        topicTitle,
        auth.currentUser.uid,
        selectedCategory,
        selectedTone
      );
      
      setGeneratedCount(prev => prev + 1);
      
      // Navigate to drafts page
      router.push(`/admin/drafts?highlight=${result.draftId}`);
    } catch (err) {
      console.error("Error generating draft:", err);
      // Show user-friendly error messages
      let errorMessage = err.message;
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        errorMessage = "OpenAI API quota exceeded. Please check your API billing at platform.openai.com or wait for your quota to reset.";
      } else if (err.message?.includes("401") || err.message?.includes("invalid_api_key")) {
        errorMessage = "Invalid OpenAI API key. Please update it in Admin Settings → AI Settings.";
      } else if (err.message?.includes("500") || err.message?.includes("server")) {
        errorMessage = "OpenAI server error. Please try again in a few minutes.";
      }
      alert("Failed to generate draft: " + errorMessage);
    } finally {
      setGeneratingTopic(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-4 md:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white">Trending Topics</h1>
                  <p className="text-white/80 text-sm">Generate AI blog drafts from trending searches</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {generatedCount > 0 && (
                  <span className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg">
                    {generatedCount} drafts generated
                  </span>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2.5 bg-white text-orange-600 font-semibold rounded-xl flex items-center gap-2"
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <FiGlobe className="inline mr-2" />Country/Region
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <FiEdit3 className="inline mr-2" />Default Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <FiZap className="inline mr-2" />Writing Tone
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Manual Topic Input */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiType className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-slate-700">Write About Any Topic</h3>
              </div>
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                {showManualInput ? "Hide" : "Enter Custom Topic"}
                {showManualInput ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            {showManualInput && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  placeholder="Enter any topic you want to write about..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (manualTopic.trim()) {
                      handleGenerateDraft(manualTopic.trim(), true);
                    }
                  }}
                  disabled={!manualTopic.trim() || generatingTopic !== null}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {generatingTopic === manualTopic.trim() ? (
                    <><FiLoader className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FiZap className="w-4 h-4" /> Generate</>  
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FiX className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-700 font-medium">Trending topics unavailable</p>
                  <p className="text-amber-600 text-sm mt-1">{error}</p>
                  <p className="text-amber-600 text-sm mt-2">💡 <strong>Tip:</strong> Use the "Enter Custom Topic" option above to generate a blog about any topic you want!</p>
                </div>
                <button onClick={handleRefresh} className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-500">Loading trending topics...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <FiTrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Trending Topics</h3>
              <p className="text-slate-500">Try selecting a different country or refresh</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <motion.div
                  key={topic.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                >
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                          index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400" :
                          index === 2 ? "bg-gradient-to-br from-amber-500 to-amber-600" :
                          "bg-gradient-to-br from-slate-500 to-slate-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-800 truncate">{topic.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-orange-600 font-medium">
                              🔥 {topic.traffic} searches
                            </span>
                            {topic.relatedQueries?.length > 0 && (
                              <button
                                onClick={() => setExpandedTopic(expandedTopic === topic.title ? null : topic.title)}
                                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                              >
                                Related
                                {expandedTopic === topic.title ? <FiChevronUp /> : <FiChevronDown />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(topic.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Search on Google"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </a>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleGenerateDraft(topic)}
                          disabled={generatingTopic !== null}
                          className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                            generatingTopic === topic.title
                              ? "bg-orange-100 text-orange-600"
                              : "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg"
                          }`}
                        >
                          {generatingTopic === topic.title ? (
                            <>
                              <FiLoader className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FiZap className="w-4 h-4" />
                              Generate Draft
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedTopic === topic.title && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            {topic.relatedQueries?.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-slate-600 mb-2">Related Queries:</p>
                                <div className="flex flex-wrap gap-2">
                                  {topic.relatedQueries.map((q, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg">
                                      {q}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {topic.articles?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-slate-600 mb-2">Related Articles:</p>
                                <div className="space-y-2">
                                  {topic.articles.map((article, i) => (
                                    <a
                                      key={i}
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                      <p className="text-sm font-medium text-slate-700 line-clamp-1">{article.title}</p>
                                      <p className="text-xs text-slate-500">{article.source}</p>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-blue-700 text-sm">
              <span className="font-semibold">How it works:</span> Click "Generate Draft" to create an AI-written blog post about the topic. 
              The draft will be saved for your review. You can edit it, add images, and publish when ready.
              <br /><span className="text-blue-600">Tip: Drafts are never auto-published. You always have full control.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
