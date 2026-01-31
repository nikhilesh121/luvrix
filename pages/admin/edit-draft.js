import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getBlogDraft, updateBlogDraft, publishBlogDraft } from "../../lib/api-client";

import { motion } from "framer-motion";
import {
  FiSave, FiSend, FiArrowLeft, FiImage, FiTag, FiType,
  FiFileText, FiHash, FiCheck, FiX
} from "react-icons/fi";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const CATEGORIES = [
  "Technology", "Entertainment", "Sports", "Business", "Health",
  "Science", "Politics", "Lifestyle", "Gaming", "General"
];

export default function EditDraft() {
  return (
    <AdminGuard>
      <EditDraftContent />
    </AdminGuard>
  );
}

function EditDraftContent() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "General",
    thumbnail: "",
    seoTitle: "",
    seoDescription: "",
    keywords: [],
  });
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    if (id) fetchDraft();
  }, [id]);

  const fetchDraft = async () => {
    setLoading(true);
    try {
      const data = await getBlogDraft(id);
      if (data) {
        setDraft({
          ...data,
          keywords: data.keywords || [],
        });
      } else {
        alert("Draft not found");
        router.push("/admin/drafts");
      }
    } catch (err) {
      console.error("Error fetching draft:", err);
      alert("Failed to load draft");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
    setDraft(prev => ({ ...prev, title, slug }));
    setSaved(false);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !draft.keywords.includes(keywordInput.trim())) {
      setDraft(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput("");
      setSaved(false);
    }
  };

  const removeKeyword = (keyword) => {
    setDraft(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      alert("Title is required");
      return;
    }

    setSaving(true);
    try {
      await updateBlogDraft(id, {
        title: draft.title,
        slug: draft.slug,
        content: draft.content,
        excerpt: draft.excerpt,
        category: draft.category,
        thumbnail: draft.thumbnail,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        keywords: draft.keywords,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!draft.thumbnail) {
      const proceed = confirm("No thumbnail image set. Publish anyway?");
      if (!proceed) return;
    }

    setPublishing(true);
    try {
      // Save first
      await updateBlogDraft(id, {
        title: draft.title,
        slug: draft.slug,
        content: draft.content,
        excerpt: draft.excerpt,
        category: draft.category,
        thumbnail: draft.thumbnail,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        keywords: draft.keywords,
      });

      // Then publish
      const user = auth.currentUser;
      await publishBlogDraft(
        id,
        user.uid,
        user.displayName || "Admin",
        user.photoURL || ""
      );

      alert("Blog published successfully!");
      router.push("/admin/drafts");
    } catch (err) {
      alert("Failed to publish: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [2, 3, 4, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <div className="admin-layout flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 md:px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/admin/drafts")}
                  className="p-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </motion.button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">Edit Draft</h1>
                  <p className="text-white/70 text-sm">Make changes and publish when ready</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2.5 bg-white/20 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-white/30"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : saved ? (
                    <FiCheck className="w-4 h-4" />
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  {saved ? "Saved!" : "Save Draft"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-2.5 bg-white text-indigo-600 font-semibold rounded-xl flex items-center gap-2"
                >
                  {publishing ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                  Publish Now
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <FiType className="inline mr-2" />Blog Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-3 text-xl font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter blog title..."
                />
                <p className="text-sm text-slate-500 mt-2">
                  Slug: <code className="bg-slate-100 px-2 py-0.5 rounded">{draft.slug || "auto-generated"}</code>
                </p>
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <FiFileText className="inline mr-2" />Content
                </label>
                <div className="prose-editor">
                  <ReactQuill
                    value={draft.content}
                    onChange={(value) => handleChange("content", value)}
                    modules={quillModules}
                    theme="snow"
                    placeholder="Write your blog content..."
                    className="min-h-[400px]"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Excerpt / Summary
                </label>
                <textarea
                  value={draft.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Brief summary of the article..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Thumbnail */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <label className="text-sm font-semibold text-slate-700 mb-3 block">
                  <FiImage className="inline mr-2" />Thumbnail Image
                </label>
                {draft.thumbnail && (
                  <div className="mb-3 relative">
                    <img
                      src={draft.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => handleChange("thumbnail", "")}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  type="url"
                  value={draft.thumbnail}
                  onChange={(e) => handleChange("thumbnail", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Category */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <label className="text-sm font-semibold text-slate-700 mb-3 block">
                  <FiTag className="inline mr-2" />Category
                </label>
                <select
                  value={draft.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">SEO Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">SEO Title</label>
                    <input
                      type="text"
                      value={draft.seoTitle}
                      onChange={(e) => handleChange("seoTitle", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="SEO optimized title..."
                      maxLength={60}
                    />
                    <p className="text-xs text-slate-400 mt-1">{draft.seoTitle?.length || 0}/60</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Meta Description</label>
                    <textarea
                      value={draft.seoDescription}
                      onChange={(e) => handleChange("seoDescription", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      rows={3}
                      placeholder="Meta description..."
                      maxLength={155}
                    />
                    <p className="text-xs text-slate-400 mt-1">{draft.seoDescription?.length || 0}/155</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      <FiHash className="inline mr-1" />Keywords
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {draft.keywords.map((k, i) => (
                        <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg flex items-center gap-1">
                          {k}
                          <button onClick={() => removeKeyword(k)} className="hover:text-indigo-900">
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Add keyword..."
                      />
                      <button
                        onClick={addKeyword}
                        className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .prose-editor .ql-container {
          min-height: 350px;
          font-size: 16px;
        }
        .prose-editor .ql-editor {
          min-height: 350px;
        }
      `}</style>
    </div>
  );
}
