import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllManga, createManga, updateManga, deleteManga, createLog, getSettings, updateSettings } from "../../lib/firebase-client";
import { auth } from "../../lib/local-auth";
import { slugify } from "../../utils/slugify";
import { motion } from "framer-motion";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiGlobe, FiSmartphone, FiMonitor, FiBook, FiSearch, FiCheckCircle, FiClock, FiExternalLink, FiEye, FiGrid, FiList, FiTable, FiLayout } from "react-icons/fi";

export default function AdminManga() {
  return (
    <AdminGuard>
      <MangaContent />
    </AdminGuard>
  );
}

function MangaContent() {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [editingManga, setEditingManga] = useState(null);
  const [adminLayout, setAdminLayout] = useState({
    viewType: "grid",
    columns: 3,
    cardSize: "medium",
  });
  const [savingLayout, setSavingLayout] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    alternativeNames: "",
    totalChapters: "",
    redirectBaseUrl: "",
    chapterFormat: "chapter-{n}",
    chapterPadding: 0,
    coverUrl: "",
    // SEO Fields
    seoTitle: "",
    seoDescription: "",
    focusKeyword: "",
    author: "",
    genre: "",
    status: "Ongoing",
    // Platform Visibility
    showOnWeb: true,
    showOnAndroid: true,
    showOnIOS: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchManga();
    fetchAdminLayout();
  }, []);

  const fetchManga = async () => {
    try {
      const mangaData = await getAllManga();
      setManga(mangaData);
    } catch (error) {
      console.error("Error fetching manga:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminLayout = async () => {
    try {
      const data = await getSettings();
      if (data.adminMangaLayout) {
        setAdminLayout(data.adminMangaLayout);
      }
    } catch (error) {
      console.error("Error fetching admin layout:", error);
    }
  };

  const saveAdminLayout = async () => {
    setSavingLayout(true);
    try {
      await updateSettings({ adminMangaLayout: adminLayout });
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated Admin Manga Layout",
        targetId: "settings",
      });
      setShowLayoutModal(false);
    } catch (error) {
      console.error("Error saving admin layout:", error);
    } finally {
      setSavingLayout(false);
    }
  };

  const getGridColumns = () => {
    const cols = {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-3 lg:grid-cols-5",
      6: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
    };
    return cols[adminLayout.columns] || cols[3];
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingManga(item);
      setFormData({
        title: item.title || "",
        slug: item.slug || "",
        description: item.description || "",
        alternativeNames: item.alternativeNames || "",
        totalChapters: item.totalChapters || "",
        redirectBaseUrl: item.redirectBaseUrl || "",
        chapterFormat: item.chapterFormat || "chapter-{n}",
        chapterPadding: item.chapterPadding || 0,
        coverUrl: item.coverUrl || "",
        seoTitle: item.seoTitle || "",
        seoDescription: item.seoDescription || "",
        focusKeyword: item.focusKeyword || "",
        author: item.author || "",
        genre: item.genre || "",
        status: item.status || "Ongoing",
        showOnWeb: item.showOnWeb !== false,
        showOnAndroid: item.showOnAndroid !== false,
        showOnIOS: item.showOnIOS !== false,
        autoRedirect: item.autoRedirect === true,
        redirectDelay: item.redirectDelay || 5,
        redirectUrl: item.redirectUrl || "",
      });
    } else {
      setEditingManga(null);
      setFormData({
        title: "",
        slug: "",
        description: "",
        alternativeNames: "",
        totalChapters: "",
        redirectBaseUrl: "",
        chapterFormat: "chapter-{n}",
        chapterPadding: 0,
        coverUrl: "",
        seoTitle: "",
        seoDescription: "",
        focusKeyword: "",
        author: "",
        genre: "",
        status: "Ongoing",
        showOnWeb: true,
        showOnAndroid: true,
        showOnIOS: true,
        autoRedirect: false,
        redirectDelay: 5,
        redirectUrl: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingManga(null);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: slugify(title),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        totalChapters: parseInt(formData.totalChapters, 10) || 0,
      };

      if (editingManga) {
        await updateManga(editingManga.id, data);
        await createLog({
          adminId: auth.currentUser?.uid,
          action: "Updated Manga",
          targetId: editingManga.id,
        });
      } else {
        const newId = await createManga(data);
        await createLog({
          adminId: auth.currentUser?.uid,
          action: "Created Manga",
          targetId: newId,
        });
      }

      fetchManga();
      closeModal();
    } catch (error) {
      console.error("Error saving manga:", error);
      alert("Failed to save manga");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this manga?")) return;

    try {
      await deleteManga(id);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Deleted Manga",
        targetId: id,
      });
      fetchManga();
    } catch (error) {
      console.error("Error deleting manga:", error);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const filteredManga = manga.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ongoingCount = manga.filter(m => m.status === "Ongoing").length;
  const completedCount = manga.filter(m => m.status === "Completed").length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />

      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FiBook className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">Manage Manga</h1>
                  <p className="text-slate-400">Add and manage manga series</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30 flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-200 text-sm font-medium">{ongoingCount} Ongoing</span>
                </div>
                <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-500/30 flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-200 text-sm font-medium">{completedCount} Completed</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLayoutModal(true)}
                  className="px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <FiLayout className="w-4 h-4" /> Layout
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openModal()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg"
                >
                  <FiPlus className="w-5 h-5" /> Add Manga
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-6">
          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 mb-6 border border-slate-100"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search manga by title or genre..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
              <p className="text-slate-500 text-sm">
                Showing <span className="font-semibold text-slate-700">{filteredManga.length}</span> of {manga.length} manga
              </p>
            </div>
          </motion.div>

          {/* Manga Display */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filteredManga.length > 0 ? (
            adminLayout.viewType === "table" ? (
              /* Table View */
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Manga</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Genre</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chapters</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Platforms</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredManga.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.coverUrl ? (
                                <img src={item.coverUrl} alt={item.title} className="w-12 h-16 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                  <FiBook className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900">{item.title}</p>
                                <p className="text-xs text-slate-500">/{item.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                              {item.genre || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-700">{item.totalChapters}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              item.status === "Ongoing" ? "bg-purple-100 text-purple-700" :
                              item.status === "Completed" ? "bg-green-100 text-green-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {item.status || "Ongoing"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${item.showOnWeb !== false ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                                <FiMonitor className="w-3 h-3" />
                              </div>
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${item.showOnAndroid !== false ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                                <FiSmartphone className="w-3 h-3" />
                              </div>
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${item.showOnIOS !== false ? "bg-gray-200 text-gray-600" : "bg-slate-100 text-slate-400"}`}>
                                <FiGlobe className="w-3 h-3" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openModal(item)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.open(`/manga/${item.slug}`, "_blank")}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Preview"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : adminLayout.viewType === "list" ? (
              /* List View */
              <div className="space-y-3 mb-8">
                {filteredManga.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 flex items-center gap-4 hover:shadow-xl transition-all"
                  >
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt={item.title} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiBook className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.totalChapters} chapters • {item.genre || "N/A"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          item.status === "Ongoing" ? "bg-purple-100 text-purple-700" :
                          item.status === "Completed" ? "bg-green-100 text-green-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {item.status || "Ongoing"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(item)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => window.open(`/manga/${item.slug}`, "_blank")} className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Grid View */
              <div className={`grid ${getGridColumns()} gap-6 mb-8`}>
              {filteredManga.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden group hover:shadow-xl transition-all"
                >
                  {/* Cover Image */}
                  {item.coverUrl && (
                    <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 relative overflow-hidden">
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === "Ongoing" ? "bg-purple-500 text-white" : 
                          item.status === "Completed" ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                        }`}>
                          {item.status || "Ongoing"}
                        </span>
                      </div>
                    </div>
                  )}
                  {!item.coverUrl && (
                    <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <FiBook className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{item.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {item.description || "No description available"}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <FiBook className="w-4 h-4" />
                        <span>{item.totalChapters} chapters</span>
                      </div>
                      {item.genre && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">{item.genre}</span>
                      )}
                    </div>

                    {/* Platform Visibility */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.showOnWeb !== false ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                        <FiMonitor className="w-3.5 h-3.5" />
                      </div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.showOnAndroid !== false ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                        <FiSmartphone className="w-3.5 h-3.5" />
                      </div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.showOnIOS !== false ? "bg-gray-100 text-gray-600" : "bg-slate-100 text-slate-400"}`}>
                        <FiGlobe className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openModal(item)}
                        className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 font-medium transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" /> Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.open(`/manga/${item.slug}`, "_blank")}
                        className="py-2.5 px-4 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
                        title="Preview"
                      >
                        <FiEye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelete(item.id)}
                        className="py-2.5 px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-lg"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBook className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No manga found</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery ? "Try adjusting your search" : "Add your first manga to get started"}
              </p>
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openModal()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl inline-flex items-center gap-2"
                >
                  <FiPlus className="w-5 h-5" /> Add Your First Manga
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingManga ? "Edit Manga" : "Add Manga"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  rows={3}
                />
              </div>

              <div>
                <label className="form-label">Alternative Names</label>
                <input
                  type="text"
                  value={formData.alternativeNames}
                  onChange={(e) => setFormData({ ...formData, alternativeNames: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Solo Farming In The Tower, 나 혼자 탑에서 농사"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated alternative titles (Korean, Japanese, etc.). Used in SEO descriptions via {"{altNames}"}.
                </p>
              </div>

              <div>
                <label className="form-label">Total Chapters *</label>
                <input
                  type="number"
                  value={formData.totalChapters}
                  onChange={(e) => setFormData({ ...formData, totalChapters: e.target.value })}
                  className="form-input"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="form-label">Redirect Base URL *</label>
                <input
                  type="url"
                  value={formData.redirectBaseUrl}
                  onChange={(e) => setFormData({ ...formData, redirectBaseUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://example.com/manga/title/"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Base URL for chapter redirects (e.g., https://manhuain.com/manga/solo-farming/)
                </p>
              </div>

              <div>
                <label className="form-label">Chapter Format</label>
                <input
                  type="text"
                  value={formData.chapterFormat}
                  onChange={(e) => setFormData({ ...formData, chapterFormat: e.target.value })}
                  className="form-input"
                  placeholder="chapter-{n}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {"{n}"} for chapter number (e.g., chapter-{"{n}"} → chapter-1)
                </p>
              </div>

              <div>
                <label className="form-label">Chapter Number Padding (Leading Zeros)</label>
                <select
                  value={formData.chapterPadding || 0}
                  onChange={(e) => setFormData({ ...formData, chapterPadding: parseInt(e.target.value) })}
                  className="form-input"
                >
                  <option value={0}>No padding (1, 2, 10, 100)</option>
                  <option value={2}>2 digits (01, 02, 10, 100)</option>
                  <option value={3}>3 digits (001, 002, 010, 100)</option>
                  <option value={4}>4 digits (0001, 0002, 0010, 0100)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  For URLs like chapter-001, chapter-010, select 3 digits padding
                </p>
              </div>

              <div>
                <label className="form-label">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              {/* SEO Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="form-label">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="form-input"
                      placeholder="Read [Manga Title] Online - All Chapters"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 50-60 characters. Include focus keyword at the beginning.
                    </p>
                  </div>

                  <div>
                    <label className="form-label">SEO Meta Description</label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      className="form-input"
                      rows={3}
                      placeholder="Read [Manga Title] manga online for free. All chapters available..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 150-160 characters. Include focus keyword naturally.
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Focus Keyword</label>
                    <input
                      type="text"
                      value={formData.focusKeyword}
                      onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                      className="form-input"
                      placeholder="e.g., solo farming manga"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Main keyword you want to rank for in search engines.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Author</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="form-input"
                        placeholder="Author name"
                      />
                    </div>
                    <div>
                      <label className="form-label">Genre</label>
                      <input
                        type="text"
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                        className="form-input"
                        placeholder="e.g., Action, Fantasy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-input"
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Hiatus">Hiatus</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Platform Visibility Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Visibility</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Control which platforms can access this manga
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Web */}
                  <div 
                    onClick={() => setFormData({ ...formData, showOnWeb: !formData.showOnWeb })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.showOnWeb 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.showOnWeb ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        <FiGlobe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Web</p>
                        <p className="text-xs text-gray-500">{formData.showOnWeb ? "Visible" : "Hidden"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Android */}
                  <div 
                    onClick={() => setFormData({ ...formData, showOnAndroid: !formData.showOnAndroid })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.showOnAndroid 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.showOnAndroid ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        <FiSmartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Android</p>
                        <p className="text-xs text-gray-500">{formData.showOnAndroid ? "Visible" : "Hidden"}</p>
                      </div>
                    </div>
                  </div>

                  {/* iOS */}
                  <div 
                    onClick={() => setFormData({ ...formData, showOnIOS: !formData.showOnIOS })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.showOnIOS 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.showOnIOS ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        <FiMonitor className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">iOS</p>
                        <p className="text-xs text-gray-500">{formData.showOnIOS ? "Visible" : "Hidden"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redirect Settings */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chapter Redirect Settings</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Control how chapter pages handle redirection. Default is manual click only.
                </p>
                <div className="space-y-4">
                  <div 
                    onClick={() => setFormData({ ...formData, autoRedirect: !formData.autoRedirect })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.autoRedirect ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.autoRedirect ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        <FiExternalLink className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Auto Redirect</p>
                        <p className="text-xs text-gray-500">{formData.autoRedirect ? "Enabled — redirects after delay" : "Disabled — manual click only"}</p>
                      </div>
                    </div>
                  </div>
                  {formData.autoRedirect && (
                    <div>
                      <label className="form-label">Redirect Delay (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={formData.redirectDelay}
                        onChange={(e) => setFormData({ ...formData, redirectDelay: parseInt(e.target.value, 10) || 5 })}
                        className="form-input"
                        placeholder="5"
                      />
                    </div>
                  )}
                  <div>
                    <label className="form-label">Custom Redirect URL (optional override)</label>
                    <input
                      type="text"
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      className="form-input"
                      placeholder="Leave empty to use auto-generated URL"
                    />
                  </div>
                </div>
              </div>


              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave /> {editingManga ? "Update" : "Create"}
                    </>
                  )}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Layout Settings Modal */}
      {showLayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FiLayout className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Admin Layout Settings</h2>
                    <p className="text-white/70 text-sm">Configure your manga panel view</p>
                  </div>
                </div>
                <button onClick={() => setShowLayoutModal(false)} className="text-white/70 hover:text-white">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* View Type */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block">View Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "grid", icon: FiGrid, label: "Grid" },
                    { value: "list", icon: FiList, label: "List" },
                    { value: "table", icon: FiTable, label: "Table" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAdminLayout({ ...adminLayout, viewType: type.value })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        adminLayout.viewType === type.value
                          ? "border-purple-500 bg-purple-50 text-purple-600"
                          : "border-slate-200 hover:border-purple-300 text-slate-500"
                      }`}
                    >
                      <type.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Columns */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block">Columns (Grid View)</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((col) => (
                    <button
                      key={col}
                      onClick={() => setAdminLayout({ ...adminLayout, columns: col })}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                        adminLayout.columns === col
                          ? "border-purple-500 bg-purple-500 text-white"
                          : "border-slate-200 hover:border-purple-300 text-slate-600"
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Size */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block">Card Size</label>
                <div className="grid grid-cols-3 gap-3">
                  {["small", "medium", "large"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setAdminLayout({ ...adminLayout, cardSize: size })}
                      className={`py-3 rounded-xl border-2 capitalize font-medium transition-all ${
                        adminLayout.cardSize === size
                          ? "border-purple-500 bg-purple-50 text-purple-600"
                          : "border-slate-200 hover:border-purple-300 text-slate-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
              <button
                onClick={saveAdminLayout}
                disabled={savingLayout}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                {savingLayout ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4" /> Save Layout
                  </>
                )}
              </button>
              <button
                onClick={() => setShowLayoutModal(false)}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
