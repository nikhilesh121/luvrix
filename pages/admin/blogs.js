import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllBlogs, approveBlog, rejectBlog, deleteBlog, createLog, getUser } from "../../lib/firebase-client";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiTrash2, FiEye, FiSearch, FiFileText, FiClock, FiCheckCircle, FiAlertCircle, FiPlus, FiEdit3 } from "react-icons/fi";
import Link from "next/link";

export default function AdminBlogs() {
  return (
    <AdminGuard>
      <BlogsContent />
    </AdminGuard>
  );
}

function BlogsContent() {
  const router = useRouter();
  const { status: statusFilter } = router.query;

  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [users, setUsers] = useState({});

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (statusFilter) {
      setSelectedStatus(statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    let filtered = blogs;

    if (selectedStatus !== "all") {
      filtered = filtered.filter((b) => b.status === selectedStatus);
    }

    if (selectedUser !== "all") {
      filtered = filtered.filter((b) => b.authorId === selectedUser);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title?.toLowerCase().includes(query) ||
          b.category?.toLowerCase().includes(query) ||
          users[b.authorId]?.name?.toLowerCase().includes(query) ||
          users[b.authorId]?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredBlogs(filtered);
  }, [selectedStatus, selectedUser, searchQuery, blogs, users]);

  const fetchBlogs = async () => {
    try {
      // Fetch ALL blogs for admin (not just approved)
      const blogsData = await getAllBlogs(null, true);
      setBlogs(blogsData);
      setFilteredBlogs(blogsData);

      // Fetch user data for all unique authors
      const authorIds = [...new Set(blogsData.map(b => b.authorId).filter(Boolean))];
      const usersData = {};
      await Promise.all(
        authorIds.map(async (authorId) => {
          try {
            const userData = await getUser(authorId);
            if (userData) {
              usersData[authorId] = userData;
            }
          } catch (err) {
            console.error(`Error fetching user ${authorId}:`, err);
          }
        })
      );
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (type, blog, author) => {
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          to: author?.email,
          data: { name: author?.name || "User", blogTitle: blog?.title }
        })
      });
    } catch (err) {
      console.error("Failed to send email notification:", err);
    }
  };

  const handleApprove = async (blogId) => {
    setActionLoading(blogId);
    try {
      const blog = blogs.find(b => b.id === blogId);
      await approveBlog(blogId);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Approved Blog",
        targetId: blogId,
      });
      
      // Send email notification
      if (blog?.authorId) {
        const author = await import("../../lib/api-client").then(m => m.getUser(blog.authorId));
        if (author?.email) {
          sendEmailNotification("blogApproved", blog, author);
        }
      }
      
      fetchBlogs();
    } catch (error) {
      console.error("Error approving blog:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (blogId) => {
    setActionLoading(blogId);
    try {
      const blog = blogs.find(b => b.id === blogId);
      await rejectBlog(blogId);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Rejected Blog",
        targetId: blogId,
      });
      
      // Send email notification
      if (blog?.authorId) {
        const author = await import("../../lib/api-client").then(m => m.getUser(blog.authorId));
        if (author?.email) {
          sendEmailNotification("blogRejected", blog, author);
        }
      }
      
      fetchBlogs();
    } catch (error) {
      console.error("Error rejecting blog:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    setActionLoading(blogId);
    try {
      await deleteBlog(blogId);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Deleted Blog",
        targetId: blogId,
      });
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const pendingCount = blogs.filter(b => b.status === "pending").length;
  const approvedCount = blogs.filter(b => b.status === "approved").length;

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
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FiFileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">Manage Blogs</h1>
                  <p className="text-slate-400">Review and manage all blog submissions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <div className="px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-500/30 flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 text-sm font-medium">{pendingCount} Pending</span>
                  </div>
                )}
                <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-500/30 flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-200 text-sm font-medium">{approvedCount} Published</span>
                </div>
                <Link
                  href="/admin/create-blog"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <FiPlus className="w-5 h-5" /> Create Blog
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-6">
          {/* Filters Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 mb-6 border border-slate-100"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, category, or author..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="px-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium min-w-[180px]"
                >
                  <option value="all">All Authors</option>
                  {Object.entries(users).map(([id, user]) => (
                    <option key={id} value={id}>
                      {user.name || user.email || id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Blogs List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Blog</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SEO</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBlogs.length > 0 ? (
                      filteredBlogs.map((blog, index) => (
                        <motion.tr 
                          key={blog.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FiFileText className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="max-w-[200px]">
                                <p className="font-semibold text-slate-900 truncate">{blog.title}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {users[blog.authorId]?.name?.charAt(0) || "U"}
                              </div>
                              <div className="max-w-[120px]">
                                <p className="text-sm font-medium text-slate-700 truncate">{users[blog.authorId]?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-400 truncate">{users[blog.authorId]?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                              {blog.category || "General"}
                            </span>
                            {blog.template && blog.template !== "default" && (
                              <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-full uppercase">
                                {blog.template}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                              blog.seoScore >= 80
                                ? "bg-green-100 text-green-700"
                                : blog.seoScore >= 60
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {blog.seoScore || 0}%
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              blog.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : blog.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {blog.status === "approved" ? <FiCheckCircle className="w-3.5 h-3.5" /> : 
                               blog.status === "pending" ? <FiClock className="w-3.5 h-3.5" /> : 
                               <FiAlertCircle className="w-3.5 h-3.5" />}
                              {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(blog.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={blog.status === "approved" ? `/blog?id=${blog.id}` : `/admin/preview-blog?id=${blog.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title={blog.status === "approved" ? "View Live" : "Preview & Review"}
                              >
                                <FiEye className="w-4 h-4" />
                              </a>
                              <Link
                                href={`/edit-blog?id=${blog.id}&admin=true`}
                                className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                title="Edit Blog"
                              >
                                <FiEdit3 className="w-4 h-4" />
                              </Link>
                              {blog.status === "pending" && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleApprove(blog.id)}
                                    disabled={actionLoading === blog.id}
                                    className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleReject(blog.id)}
                                    disabled={actionLoading === blog.id}
                                    className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </motion.button>
                                </>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(blog.id)}
                                disabled={actionLoading === blog.id}
                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiFileText className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-medium">No blogs found</p>
                          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
