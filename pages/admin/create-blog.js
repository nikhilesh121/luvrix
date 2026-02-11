import { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { createBlog, createLog } from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { FiSave, FiImage, FiTag, FiFileText, FiCheckCircle, FiArrowLeft, FiVideo, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import Link from "next/link";
import { slugify } from "../../utils/slugify";

const BlogEditor = dynamic(() => import("../../components/BlogEditor"), { ssr: false });

const CATEGORIES = [
  "Technology", "Entertainment", "Sports", "Business", "Health",
  "Science", "Politics", "Lifestyle", "Gaming", "Anime", "General", "News"
];

export default function AdminCreateBlog() {
  return (
    <AdminGuard>
      <CreateBlogContent />
    </AdminGuard>
  );
}

function CreateBlogContent() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    category: "General",
    seoTitle: "",
    seoDescription: "",
    focusKeyword: "",
    featuredImage: "",
    tags: "",
    // Per-post ad controls
    adsEnabled: true,
    adPlacements: ["top", "inContent", "bottom"],
    adInterval: 0, // 0 = use global default
    // Media items — rendered between content blocks
    mediaItems: [], // [{type:'image'|'video', url:'', caption:'', position: number}]
  });
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [newMedia, setNewMedia] = useState({ type: "image", url: "", caption: "", position: 1 });

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: slugify(title),
      seoTitle: title.slice(0, 60),
    });
  };

  const handleSubmit = async (e, status = "approved") => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in title and content");
      return;
    }

    setSaving(true);
    try {
      const blogData = {
        ...formData,
        status, // Admin blogs are auto-approved
        authorId: auth.currentUser?.uid,
        authorName: "Admin",
        authorEmail: auth.currentUser?.email,
        isAdminPost: true,
        seoScore: 85,
        contentScore: 100,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const blogId = await createBlog(blogData);
      
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Created Blog (Admin)",
        targetId: blogId,
      });

      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error creating blog:", error);
      alert("Failed to create blog: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center gap-4">
              <Link href="/admin/blogs" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <FiArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Blog Post</h1>
                <p className="text-blue-200 text-sm">Admin posts are auto-approved • Unlimited access</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8">
          <form onSubmit={(e) => handleSubmit(e, "approved")}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Blog Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Enter an engaging title..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">Slug: {formData.slug || "auto-generated"}</p>
                </motion.div>

                {/* Content Editor */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Content *</label>
                  <BlogEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                </motion.div>

                {/* SEO Settings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">SEO Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                        placeholder="SEO optimized title (max 60 chars)"
                        maxLength={60}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">{formData.seoTitle.length}/60 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                      <textarea
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                        placeholder="Brief description for search engines (max 160 chars)"
                        maxLength={160}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">{formData.seoDescription.length}/160 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Focus Keyword</label>
                      <input
                        type="text"
                        value={formData.focusKeyword}
                        onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                        placeholder="Main keyword to rank for"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publish Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Publish</h3>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <FiCheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Admin posts are auto-approved</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" /> Publish Now
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, "pending")}
                      disabled={saving}
                      className="w-full py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Save as Draft
                    </button>
                  </div>
                </motion.div>

                {/* Category */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Category</h3>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </motion.div>

                {/* Featured Image */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FiImage className="w-5 h-5" /> Featured Image
                  </h3>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="Image URL"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.featuredImage && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <img src={formData.featuredImage} alt="Preview" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </motion.div>

                {/* Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FiTag className="w-5 h-5" /> Tags
                  </h3>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">Separate tags with commas</p>
                </motion.div>

                {/* Media Gallery — video/image URLs between content blocks */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <FiVideo className="w-5 h-5" /> In-Content Media
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Add images or videos that appear between content sections. No need to paste URLs in the editor.</p>

                  {/* Existing media list */}
                  {formData.mediaItems.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.mediaItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                            {item.type === "video" ? (
                              <FiVideo className="w-4 h-4 text-red-500" />
                            ) : (
                              <FiImage className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{item.url}</p>
                            {item.caption && <p className="text-[11px] text-slate-400 truncate">{item.caption}</p>}
                            <p className="text-[11px] text-slate-400">After section {item.position}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.mediaItems.filter((_, i) => i !== idx);
                              setFormData({ ...formData, mediaItems: updated });
                            }}
                            className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewMedia({ type: "image", url: "", caption: "", position: formData.mediaItems.length + 1 });
                      setShowMediaModal(true);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition flex items-center justify-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" /> Add Media
                  </button>

                  {/* Add Media Modal */}
                  {showMediaModal && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowMediaModal(false)}>
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-800">Add Media</h4>
                          <button type="button" onClick={() => setShowMediaModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                            <FiX className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Type toggle */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <div className="flex gap-2">
                              {[{ id: "image", icon: <FiImage className="w-4 h-4" />, label: "Image" }, { id: "video", icon: <FiVideo className="w-4 h-4" />, label: "Video" }].map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setNewMedia({ ...newMedia, type: t.id })}
                                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border-2 transition ${
                                    newMedia.type === t.id
                                      ? "border-blue-400 bg-blue-50 text-blue-700"
                                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                                  }`}
                                >
                                  {t.icon} {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* URL */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              {newMedia.type === "video" ? "Video URL" : "Image URL"}
                            </label>
                            <input
                              type="url"
                              value={newMedia.url}
                              onChange={e => setNewMedia({ ...newMedia, url: e.target.value })}
                              placeholder={newMedia.type === "video" ? "https://youtube.com/watch?v=... or https://vimeo.com/..." : "https://example.com/image.jpg"}
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          {/* Caption */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Caption (optional)</label>
                            <input
                              type="text"
                              value={newMedia.caption}
                              onChange={e => setNewMedia({ ...newMedia, caption: e.target.value })}
                              placeholder="Describe this media..."
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>

                          {/* Position */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Insert after section #</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={newMedia.position}
                              onChange={e => setNewMedia({ ...newMedia, position: parseInt(e.target.value) || 1 })}
                              className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-center text-sm"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">The media will appear after the Nth content section (paragraph group)</p>
                          </div>

                          {/* Preview */}
                          {newMedia.url && newMedia.type === "image" && (
                            <div className="rounded-xl overflow-hidden border border-slate-100">
                              <img src={newMedia.url} alt="Preview" className="w-full h-32 object-cover" onError={e => e.target.style.display = "none"} />
                            </div>
                          )}

                          {/* Save */}
                          <button
                            type="button"
                            disabled={!newMedia.url.trim()}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                mediaItems: [...formData.mediaItems, { ...newMedia }].sort((a, b) => a.position - b.position),
                              });
                              setShowMediaModal(false);
                            }}
                            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FiPlus className="w-4 h-4" /> Add to Post
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Ad Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Ad Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Show Ads</p>
                        <p className="text-xs text-slate-500">Enable ads on this post</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, adsEnabled: !formData.adsEnabled })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${formData.adsEnabled ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.adsEnabled ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                    {formData.adsEnabled && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Ad Placements</p>
                          <div className="flex flex-wrap gap-2">
                            {[{id: "top", label: "Top"}, {id: "inContent", label: "In-Content"}, {id: "bottom", label: "Bottom"}].map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const current = formData.adPlacements || [];
                                  const next = current.includes(p.id)
                                    ? current.filter(x => x !== p.id)
                                    : [...current, p.id];
                                  setFormData({ ...formData, adPlacements: next });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition ${
                                  (formData.adPlacements || []).includes(p.id)
                                    ? "border-green-400 bg-green-50 text-green-700"
                                    : "border-slate-200 text-slate-500"
                                }`}
                              >
                                {(formData.adPlacements || []).includes(p.id) ? "\u2713 " : ""}{p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Ad Interval Override</p>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={formData.adInterval}
                            onChange={(e) => setFormData({ ...formData, adInterval: parseInt(e.target.value) || 0 })}
                            className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-center text-sm"
                          />
                          <p className="text-xs text-slate-500 mt-1">0 = use global default</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
