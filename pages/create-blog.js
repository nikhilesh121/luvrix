import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import UserGuard from "../components/UserGuard";
import SeoForm from "../components/SeoForm";
import BuyPostsModal from "../components/BuyPostsModal";
import ContentValidator from "../components/ContentValidator";
import { createBlog, getUser, incrementFreePostsUsed, decrementExtraPosts, getSettings } from "../lib/api-client";

import { processContent } from "../components/BlogEditor";
import { calculateSeoScore, MIN_SEO_SCORE } from "../utils/seoScore";
import { checkForSpam } from "../utils/spamFilter";
import { canUserPost } from "../utils/paymentLogic";
import { canAutoApprove } from "../utils/contentValidator";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiCheck, FiImage, FiDollarSign, FiShoppingCart, FiEdit3, FiZap, FiStar, FiArrowRight, FiTag, FiFileText, FiSearch, FiTrendingUp } from "react-icons/fi";

const BlogEditor = dynamic(() => import("../components/BlogEditor"), { ssr: false });

const categories = [
  "Technology",
  "Anime",
  "Entertainment",
  "Gaming",
  "Science",
  "Lifestyle",
  "Sports",
  "Business",
  "Health",
  "Travel",
  "Food",
  "Education",
  "Finance",
  "Politics",
  "Culture",
  "Fashion",
];

export default function CreateBlog() {
  return (
    <UserGuard>
      {({ user, userData }) => (
        <CreateBlogContent user={user} userData={userData} />
      )}
    </UserGuard>
  );
}

function CreateBlogContent({ user, userData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(userData);

  const [blog, setBlog] = useState({
    title: "",
    content: "",
    category: "",
    thumbnail: null,
  });

  const [seoData, setSeoData] = useState({
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    slug: "",
  });

  const [validationResult, setValidationResult] = useState(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  const handleValidationChange = (result, agreed) => {
    setValidationResult(result);
    setPolicyAgreed(agreed);
  };

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    setCurrentUserData(userData);
  }, [userData]);

  const postStatus = canUserPost(currentUserData);

  const handleBuySuccess = async () => {
    // Refresh user data after purchase
    const freshUserData = await getUser(user.uid);
    setCurrentUserData(freshUserData);
    setShowBuyModal(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check posting limits
    if (!postStatus.canPost) {
      setError(postStatus.reason);
      setLoading(false);
      return;
    }

    // Validate fields
    if (!blog.title || !blog.content || !blog.category) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    // Check spam
    const spamCheck = checkForSpam(blog.title + " " + blog.content);
    if (spamCheck.isSpam) {
      setError(`Content flagged as spam: ${spamCheck.reasons.join(", ")}`);
      setLoading(false);
      return;
    }

    // Check content validation
    if (!validationResult?.isValid) {
      setError("Please fix all content policy violations before submitting.");
      setLoading(false);
      return;
    }

    if (!policyAgreed) {
      setError("Please confirm that your content complies with Google policies.");
      setLoading(false);
      return;
    }

    // Check SEO score
    const fullBlog = { ...blog, ...seoData };
    const seoResult = calculateSeoScore(fullBlog);
    if (seoResult.score < MIN_SEO_SCORE) {
      setError(`SEO score must be at least ${MIN_SEO_SCORE}. Current: ${seoResult.score}`);
      setLoading(false);
      return;
    }

    try {
      const autoApprovalEnabled = settings?.autoApproval === true;
      const minSeoScore = settings?.minSeoScoreForAutoApproval || 80;
      const minContentScore = settings?.minContentScoreForAutoApproval || 80;
      const contentScore = validationResult?.score || 0;
      const canAutoApproveContent = validationResult?.isValid && contentScore >= minContentScore;
      const shouldAutoApprove = autoApprovalEnabled && canAutoApproveContent && seoResult.score >= minSeoScore;

      const { content_html, content_text } = processContent(blog.content);

      const blogData = {
        ...blog,
        ...seoData,
        content: content_html,
        content_text,
        seoScore: seoResult.score,
        contentScore: validationResult?.score || 0,
        authorId: user.uid,
        authorName: user.displayName || userData?.name || null,
        authorPhoto: user.photoURL || userData?.photo || null,
        authorEmail: user.email || null,
        status: shouldAutoApprove ? "approved" : "pending",
      };

      const result = await createBlog(blogData);

      if (!result?.id) {
        setError("Blog created but no ID returned. Please check your dashboard.");
        setLoading(false);
        return;
      }

      if (postStatus.isFree) {
        await incrementFreePostsUsed(user.uid);
      } else {
        await decrementExtraPosts(user.uid);
      }

      setSuccess(true);
      const destination = shouldAutoApprove ? `/blog?id=${result.id}` : "/profile";
      setTimeout(() => router.push(destination), 2000);
    } catch (err) {
      console.error("Blog creation error:", err);
      setError(err.message || "Failed to create blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout title="Blog Created">
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-28 h-28 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30"
            >
              <FiCheck className="w-14 h-14 text-white" />
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-3">Blog Submitted!</h1>
            <p className="text-slate-400 text-lg">Your blog is pending approval. Redirecting...</p>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-8 max-w-xs mx-auto"
            />
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Create Blog">
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
            />
            <motion.div 
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-[100px] translate-x-1/3"
            />
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 right-20 w-16 h-16 border border-white/10 rounded-2xl backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-20 w-12 h-12 border border-purple-500/20 rounded-full backdrop-blur-sm hidden lg:block"
          />

          <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30"
                >
                  <FiEdit3 className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-black text-white"
                  >
                    Create Your Story
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-400 text-lg"
                  >
                    Share your knowledge with the world
                  </motion.p>
                </div>
              </div>

              {/* Stats Pills */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3"
              >
                {postStatus.canPost && (
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl flex items-center gap-2">
                    <FiZap className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">
                      {postStatus.isFree ? "1 Free Post" : `${userData?.extraPosts} Posts`}
                    </span>
                  </div>
                )}
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 text-sm font-medium">SEO Optimized</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 pb-12 -mt-4">
          {/* Alerts */}
          <AnimatePresence>
            {!postStatus.canPost && postStatus.needsPayment && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FiDollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Post limit reached</p>
                  <p className="text-slate-400 text-sm">Get more posts for just ₹{settings?.blogPostPrice || 49}/post</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBuyModal(true)} 
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/25"
                >
                  Buy Posts
                </motion.button>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-red-300 flex-1">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Category Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <FiFileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">Blog Title *</label>
                    <input
                      type="text"
                      value={blog.title}
                      onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                      placeholder="Enter an engaging, SEO-friendly title..."
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      disabled={!postStatus.canPost}
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                      <span className={`font-semibold ${blog.title.length >= 50 ? "text-green-400" : "text-amber-400"}`}>{blog.title.length}</span>
                      characters {blog.title.length >= 50 ? "✓" : "(50+ recommended)"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">Category *</label>
                    <select
                      value={blog.category}
                      onChange={(e) => setBlog({ ...blog, category: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                      disabled={!postStatus.canPost}
                    >
                      <option value="" className="bg-slate-800">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Thumbnail Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <FiImage className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Featured Image</h2>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt="Thumbnail" className="w-28 h-20 object-cover rounded-xl shadow-lg" onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <div className="w-28 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                        <FiImage className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                  </motion.div>
                  <input
                    type="url"
                    value={blog.thumbnail || ""}
                    onChange={(e) => setBlog({ ...blog, thumbnail: e.target.value })}
                    placeholder="https://example.com/your-image.jpg"
                    className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    disabled={!postStatus.canPost}
                  />
                </div>
              </div>
            </motion.div>

            {/* Content Editor Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <FiEdit3 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Content</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    blog.content.replace(/<[^>]*>/g, "").length >= 1500 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {blog.content.replace(/<[^>]*>/g, "").length} chars
                  </span>
                </div>
                <BlogEditor
                  value={blog.content}
                  onChange={(content) => setBlog({ ...blog, content })}
                  placeholder="Write your blog content here..."
                />
                <p className="text-xs text-slate-500 mt-3">1500+ characters recommended for better SEO ranking</p>
              </div>
            </motion.div>

            {/* SEO Form Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <FiSearch className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">SEO Settings</h2>
                </div>
                <SeoForm blog={blog} onChange={setSeoData} />
              </div>
            </motion.div>

            {/* Content Validation Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/20 to-red-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl flex items-center justify-center">
                    <FiCheck className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Content Validation</h2>
                </div>
                <ContentValidator blog={blog} onValidationChange={handleValidationChange} />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button
                type="submit"
                disabled={loading || !postStatus.canPost || !validationResult?.isValid || !policyAgreed}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiStar className="w-5 h-5" />
                    Submit for Approval
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              <motion.button 
                type="button" 
                onClick={() => router.push("/")} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Cancel
              </motion.button>
            </motion.div>
          </form>
        </div>
      </div>

      {/* Buy Posts Modal */}
      <BuyPostsModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onSuccess={handleBuySuccess}
        userData={currentUserData}
      />
    </Layout>
  );
}
