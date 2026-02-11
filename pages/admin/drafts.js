import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getBlogDrafts, deleteBlogDraft, publishBlogDraft } from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText, FiEdit3, FiTrash2, FiSend, FiEye, FiClock, FiTag,
  FiX, FiSearch, FiFilter, FiImage, FiRefreshCw, FiZap
} from "react-icons/fi";

export default function AdminDrafts() {
  return (
    <AdminGuard>
      <DraftsContent />
    </AdminGuard>
  );
}

function DraftsContent() {
  const router = useRouter();
  const { highlight } = router.query;
  
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("draft");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchDrafts();
  }, [filter]);

  useEffect(() => {
    if (highlight && drafts.length > 0) {
      const draft = drafts.find(d => d.id === highlight);
      if (draft) {
        setSelectedDraft(draft);
        setShowPreview(true);
      }
    }
  }, [highlight, drafts]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const data = await getBlogDrafts(filter);
      setDrafts(data || []);
    } catch (err) {
      console.error("Error fetching drafts:", err);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    
    setDeleting(draftId);
    try {
      await deleteBlogDraft(draftId);
      setDrafts(drafts.filter(d => d.id !== draftId));
      if (selectedDraft?.id === draftId) {
        setSelectedDraft(null);
        setShowPreview(false);
      }
    } catch (err) {
      alert("Failed to delete draft: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handlePublish = async (draft) => {
    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    if (!draft.thumbnail) {
      const proceed = confirm("This draft has no thumbnail image. Do you want to publish anyway?");
      if (!proceed) return;
    }

    setPublishing(draft.id);
    try {
      const user = auth.currentUser;
      await publishBlogDraft(
        draft.id,
        user.uid,
        user.displayName || "Admin",
        user.photoURL || ""
      );
      
      alert("Blog published successfully!");
      fetchDrafts();
      setSelectedDraft(null);
      setShowPreview(false);
    } catch (err) {
      alert("Failed to publish: " + err.message);
    } finally {
      setPublishing(null);
    }
  };

  const handleEdit = (draft) => {
    router.push(`/admin/edit-draft?id=${draft.id}`);
  };

  const filteredDrafts = drafts.filter(d =>
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 md:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white">Draft Queue</h1>
                  <p className="text-white/80 text-sm">Review, edit, and publish AI-generated drafts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/admin/trending")}
                  className="px-4 py-2.5 bg-white/20 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-white/30"
                >
                  <FiZap className="w-4 h-4" />
                  New from Trending
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchDrafts}
                  className="px-4 py-2.5 bg-white text-purple-600 font-semibold rounded-xl flex items-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Refresh
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drafts..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <FiFilter className="text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="draft">Pending Drafts</option>
                  <option value="published">Published</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Total Drafts</p>
              <p className="text-2xl font-bold text-slate-800">{drafts.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="text-2xl font-bold text-purple-600">{drafts.filter(d => d.status === "draft").length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">Published</p>
              <p className="text-2xl font-bold text-green-600">{drafts.filter(d => d.status === "published").length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-500">AI Generated</p>
              <p className="text-2xl font-bold text-orange-600">{drafts.filter(d => d.isAIGenerated).length}</p>
            </div>
          </div>

          {/* Drafts List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-500">Loading drafts...</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <FiFileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Drafts Found</h3>
              <p className="text-slate-500 mb-6">
                {filter === "draft" ? "Generate drafts from trending topics to get started" : "No drafts match your filter"}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/admin/trending")}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl inline-flex items-center gap-2"
              >
                <FiZap className="w-5 h-5" />
                Generate from Trending
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrafts.map((draft, index) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${
                    highlight === draft.id ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-100"
                  }`}
                >
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="w-full md:w-32 h-32 md:h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        {draft.thumbnail ? (
                          <img src={draft.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <FiImage className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{draft.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-1 mt-1">{draft.excerpt || draft.topic}</p>
                          </div>
                          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                            draft.status === "published" 
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {draft.status === "published" ? "Published" : "Draft"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {formatDate(draft.createdAt)}
                          </span>
                          {draft.category && (
                            <span className="flex items-center gap-1">
                              <FiTag className="w-4 h-4" />
                              {draft.category}
                            </span>
                          )}
                          {draft.isAIGenerated && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <FiZap className="w-4 h-4" />
                              AI Generated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col items-center gap-2 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedDraft(draft); setShowPreview(true); }}
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                          title="Preview"
                        >
                          <FiEye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(draft)}
                          className="p-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"
                          title="Edit"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </motion.button>
                        {draft.status !== "published" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePublish(draft)}
                            disabled={publishing === draft.id}
                            className="p-2.5 bg-green-100 text-green-600 rounded-xl hover:bg-green-200"
                            title="Publish"
                          >
                            {publishing === draft.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiSend className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(draft.id)}
                          disabled={deleting === draft.id}
                          className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                          title="Delete"
                        >
                          {deleting === draft.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Preview Draft</h2>
                  <p className="text-sm text-slate-500">{selectedDraft.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(selectedDraft)}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-medium flex items-center gap-2"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Edit
                  </motion.button>
                  {selectedDraft.status !== "published" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePublish(selectedDraft)}
                      disabled={publishing}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium flex items-center gap-2"
                    >
                      {publishing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSend className="w-4 h-4" />
                      )}
                      Publish
                    </motion.button>
                  )}
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {/* SEO Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">SEO Preview</h4>
                  <p className="text-blue-600 text-lg font-medium line-clamp-1">{selectedDraft.seoTitle || selectedDraft.title}</p>
                  <p className="text-green-700 text-sm">{`luvrix.com/blog/${selectedDraft.slug}`}</p>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">{selectedDraft.seoDescription}</p>
                  {selectedDraft.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedDraft.keywords.map((k, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded">{k}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Article Preview */}
                <article className="prose prose-slate max-w-none">
                  <h1>{selectedDraft.title}</h1>
                  <div dangerouslySetInnerHTML={{ __html: selectedDraft.content }} />
                </article>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
