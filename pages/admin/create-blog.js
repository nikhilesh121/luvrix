import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { createBlog, createLog, getSettings } from "../../lib/api-client";

import { motion } from "framer-motion";
import { FiSave, FiEye, FiImage, FiTag, FiFileText, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
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
  });

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
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
