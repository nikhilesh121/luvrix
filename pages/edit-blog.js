import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import UserGuard from "../components/UserGuard";
import SeoForm from "../components/SeoForm";
import ContentValidator from "../components/ContentValidator";
import { getBlog, updateBlog, getUser, getSettings, createLog } from "../lib/firebase-client";
import { processContent, cleanContentForDisplay } from "../components/BlogEditor";
import { TemplateSelector } from "../components/BlogTemplates";
import { calculateSeoScore, MIN_SEO_SCORE } from "../utils/seoScore";
import { checkForSpam } from "../utils/spamFilter";
import { canAutoApprove } from "../utils/contentValidator";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheck, FiImage, FiVideo, FiPlay, FiRadio, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import Link from "next/link";

const BlogEditor = dynamic(() => import("../components/BlogEditor"), { ssr: false });

const categories = [
  "Technology", "Anime", "Entertainment", "Gaming", "Science",
  "Lifestyle", "Sports", "Business", "Health", "Travel",
  "Food", "Education", "Finance", "Politics", "Culture", "Fashion",
];

export default function EditBlog() {
  return (
    <UserGuard>
      {({ user }) => <EditBlogContent user={user} />}
    </UserGuard>
  );
}

function EditBlogContent({ user }) {
  const router = useRouter();
  const { id, admin } = router.query;
  const _isAdminMode = admin === "true";
  const [originalBlog, setOriginalBlog] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [blog, setBlog] = useState({
    title: "",
    content: "",
    category: "",
    thumbnail: "",
    template: "default",
    videoUrl: "",
    isLive: false,
    mediaItems: [],
  });
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [newMedia, setNewMedia] = useState({ type: "image", url: "", caption: "", position: 1 });

  const [seoData, setSeoData] = useState({
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    slug: "",
  });

  const [validationResult, setValidationResult] = useState(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [settings, setSettings] = useState(null);

  const handleValidationChange = (result, agreed) => {
    setValidationResult(result);
    setPolicyAgreed(agreed);
  };

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const userData = await getUser(user.uid);
        setIsAdmin(userData?.role === "ADMIN");
      }
    }
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (id && user) {
      fetchBlog();
    }
    getSettings().then(setSettings);
  }, [id, user, isAdmin]);

  const fetchBlog = async () => {
    try {
      const blogData = await getBlog(id);
      if (!blogData) {
        setError("Blog not found");
        setLoading(false);
        return;
      }
      if (blogData.authorId !== user.uid && !isAdmin) {
        setError("You don't have permission to edit this blog");
        setLoading(false);
        return;
      }
      setOriginalBlog(blogData);
      setBlog({
        title: blogData.title || "",
        content: cleanContentForDisplay(blogData.content || ""),
        category: blogData.category || "",
        thumbnail: blogData.thumbnail || "",
        template: blogData.template || "default",
        videoUrl: blogData.videoUrl || "",
        isLive: blogData.isLive || false,
        mediaItems: blogData.mediaItems || [],
      });
      setSeoData({
        seoTitle: blogData.seoTitle || "",
        seoDescription: blogData.seoDescription || "",
        keywords: blogData.keywords || "",
        slug: blogData.slug || "",
      });
    } catch (error) {
      console.error("Error fetching blog:", error);
      setError("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!blog.title || !blog.content || !blog.category) {
      setError("Please fill all required fields");
      setSaving(false);
      return;
    }

    // Check spam
    const spamCheck = checkForSpam(blog.title + " " + blog.content);
    if (spamCheck.isSpam) {
      setError(`Content flagged as spam: ${spamCheck.reasons.join(", ")}`);
      setSaving(false);
      return;
    }

    // Check content validation
    if (!validationResult?.isValid) {
      setError("Please fix all content policy violations before submitting.");
      setSaving(false);
      return;
    }

    if (!policyAgreed) {
      setError("Please confirm that your content complies with Google policies.");
      setSaving(false);
      return;
    }

    const fullBlog = { ...blog, ...seoData };
    const seoResult = calculateSeoScore(fullBlog);

    if (seoResult.score < MIN_SEO_SCORE) {
      setError(`SEO score must be at least ${MIN_SEO_SCORE}. Current: ${seoResult.score}`);
      setSaving(false);
      return;
    }

    try {
      // Check if auto-approval is enabled and content passes
      const autoApprovalEnabled = settings?.autoApproval === true;
      const canAutoApproveContent = canAutoApprove(validationResult);
      const shouldAutoApprove = autoApprovalEnabled && canAutoApproveContent && seoResult.score >= 80;

      // Admin can set status directly, users go through approval
      const newStatus = isAdmin ? (originalBlog?.status || "approved") : (shouldAutoApprove ? "approved" : "pending");
      
      const { content_html, content_text } = processContent(blog.content);

      await updateBlog(id, {
        ...blog,
        ...seoData,
        content: content_html,
        content_text,
        mediaItems: blog.mediaItems || [],
        videoUrl: blog.template === "video" ? blog.videoUrl : undefined,
        isLive: blog.template === "video" ? blog.isLive : undefined,
        seoScore: seoResult.score,
        contentScore: validationResult?.score || 0,
        authorName: isAdmin ? originalBlog?.authorName : (user.displayName || originalBlog?.authorName || null),
        authorPhoto: isAdmin ? originalBlog?.authorPhoto : (user.photoURL || originalBlog?.authorPhoto || null),
        authorEmail: isAdmin ? originalBlog?.authorEmail : (user.email || originalBlog?.authorEmail || null),
        status: newStatus,
        updatedAt: new Date(),
        ...(isAdmin && { lastEditedBy: user.uid, lastEditedAt: new Date() }),
      });
      
      if (isAdmin) {
        await createLog({
          adminId: user.uid,
          action: "Edited Blog",
          targetId: id,
        });
      }
      
      setSuccess("Blog updated successfully!" + (isAdmin ? "" : (shouldAutoApprove ? "" : " It will be reviewed by admin.")));
      setTimeout(() => router.push(isAdmin ? "/admin/blogs" : "/dashboard"), 2000);
    } catch (error) {
      console.error("Error updating blog:", error);
      setError(error.message || "Failed to update blog. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Blog" noindex={true}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error && !blog) {
    return (
      <Layout title="Edit Blog" noindex={true}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FiAlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">{error}</h2>
            <Link href="/dashboard" className="text-primary hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Blog" noindex={true}>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        {/* Compact Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href={isAdmin ? "/admin/blogs" : "/dashboard"} className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition">
                <FiArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-gray-100">Edit Blog</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Update your blog post</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-green-600 dark:text-green-400 text-sm">{success}</span>
              </div>
            )}

            {originalBlog && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title & Category */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-gray-300 mb-1 block">Blog Title *</label>
                      <input
                        type="text"
                        value={blog.title}
                        onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Enter blog title"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-gray-300 mb-1 block">Category *</label>
                      <select
                        value={blog.category}
                        onChange={(e) => setBlog({ ...blog, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-300 mb-2 block">Thumbnail URL</label>
                  <div className="flex items-center gap-3">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg" />
                    ) : (
                      <div className="w-20 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FiImage className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  <input
                    type="url"
                    value={blog.thumbnail}
                    onChange={(e) => setBlog({ ...blog, thumbnail: e.target.value })}
                    className="form-input flex-1"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* Template */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <TemplateSelector value={blog.template} onChange={(t) => setBlog({ ...blog, template: t })} />
                </div>

              {/* Video URL - Only shown when Video template is selected */}
              <AnimatePresence>
                {blog.template === "video" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-xl border border-red-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <FiVideo className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Video URL</label>
                          <p className="text-xs text-slate-400">YouTube, Vimeo, Twitch, Dailymotion, or direct link</p>
                        </div>
                      </div>
                      <input
                        type="url"
                        value={blog.videoUrl || ""}
                        onChange={(e) => setBlog({ ...blog, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=... or live stream URL"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-3"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blog.isLive || false}
                          onChange={(e) => setBlog({ ...blog, isLive: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500/50"
                        />
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          <FiRadio className="w-3.5 h-3.5 text-red-500" /> Mark as Live Stream
                        </span>
                      </label>
                      {blog.videoUrl && (
                        <div className="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 truncate flex items-center gap-1.5">
                            <FiPlay className="w-3 h-3 flex-shrink-0" /> {blog.videoUrl}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* In-Content Media */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-gray-200 flex items-center gap-1.5">
                        <FiVideo className="w-3.5 h-3.5" /> In-Content Media
                      </label>
                      <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">Images/videos placed between content sections automatically</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewMedia({ type: "image", url: "", caption: "", position: (blog.mediaItems?.length || 0) + 1 });
                        setShowMediaModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition flex items-center gap-1"
                    >
                      <FiPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {blog.mediaItems?.length > 0 && (
                    <div className="space-y-2">
                      {blog.mediaItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-100 dark:border-gray-600">
                          <div className="shrink-0 w-7 h-7 rounded-md bg-slate-200 dark:bg-gray-600 flex items-center justify-center">
                            {item.type === "video" ? <FiVideo className="w-3.5 h-3.5 text-red-500" /> : <FiImage className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-600 dark:text-gray-300 truncate">{item.url}</p>
                            <p className="text-[10px] text-slate-400 dark:text-gray-500">After section {item.position}{item.caption ? ` · ${item.caption}` : ""}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBlog({ ...blog, mediaItems: blog.mediaItems.filter((_, i) => i !== idx) })}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Media Modal */}
                  {showMediaModal && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowMediaModal(false)}>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-800 dark:text-gray-100">Add Media</h4>
                          <button type="button" onClick={() => setShowMediaModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                            <FiX className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Type</label>
                            <div className="flex gap-2">
                              {[{ id: "image", icon: <FiImage className="w-4 h-4" />, label: "Image" }, { id: "video", icon: <FiVideo className="w-4 h-4" />, label: "Video" }].map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setNewMedia({ ...newMedia, type: t.id })}
                                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border-2 transition ${
                                    newMedia.type === t.id ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400"
                                  }`}
                                >
                                  {t.icon} {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                              {newMedia.type === "video" ? "Video URL" : "Image URL"}
                            </label>
                            <input
                              type="url"
                              value={newMedia.url}
                              onChange={e => setNewMedia({ ...newMedia, url: e.target.value })}
                              placeholder={newMedia.type === "video" ? "https://youtube.com/watch?v=..." : "https://example.com/image.jpg"}
                              className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Caption (optional)</label>
                            <input
                              type="text"
                              value={newMedia.caption}
                              onChange={e => setNewMedia({ ...newMedia, caption: e.target.value })}
                              placeholder="Describe this media..."
                              className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Insert after section #</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={newMedia.position}
                              onChange={e => setNewMedia({ ...newMedia, position: parseInt(e.target.value) || 1 })}
                              className="w-20 px-3 py-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl text-center text-sm"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Media appears after the Nth content section</p>
                          </div>
                          {newMedia.url && newMedia.type === "image" && (
                            <div className="rounded-xl overflow-hidden border border-slate-100">
                              <img src={newMedia.url} alt="Preview" className="w-full h-32 object-cover" onError={e => e.target.style.display = "none"} />
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={!newMedia.url.trim()}
                            onClick={() => {
                              setBlog({
                                ...blog,
                                mediaItems: [...(blog.mediaItems || []), { ...newMedia }].sort((a, b) => a.position - b.position),
                              });
                              setShowMediaModal(false);
                            }}
                            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            <FiPlus className="w-4 h-4" /> Add to Post
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-300 mb-2 block">Content *</label>
                  <BlogEditor
                    value={blog.content}
                    onChange={(content) => setBlog({ ...blog, content })}
                  />
                </div>

                {/* SEO */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <SeoForm blog={blog} onChange={setSeoData} initialData={seoData} />
                </div>

                {/* Content Validation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <ContentValidator blog={blog} onValidationChange={handleValidationChange} />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || !validationResult?.isValid || !policyAgreed}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSave className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Update Blog"}
                  </button>
                  <Link href={isAdmin ? "/admin/blogs" : "/dashboard"} className="px-6 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
