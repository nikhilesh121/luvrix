import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getBlog, getUser, approveBlog, rejectBlog, createLog } from "../../lib/api-client";
import { cleanContentForDisplay } from "../../components/BlogEditor";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { 
  FiArrowLeft, FiCheck, FiX, FiUser, FiCalendar, FiTag, 
  FiBarChart2, FiEye, FiShare2, FiStar
} from "react-icons/fi";

export default function PreviewBlog() {
  return (
    <AdminGuard>
      <PreviewBlogContent />
    </AdminGuard>
  );
}

function PreviewBlogContent() {
  const router = useRouter();
  const { id } = router.query;
  const [blog, setBlog] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      const blogData = await getBlog(id);
      if (blogData) {
        setBlog(blogData);
        if (blogData.authorId) {
          const authorData = await getUser(blogData.authorId);
          setAuthor(authorData);
        }
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (type) => {
    if (!author?.email) return;
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          to: author.email,
          data: { name: author.name || "User", blogTitle: blog?.title }
        })
      });
    } catch (err) {
      console.error("Failed to send email notification:", err);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveBlog(id);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Approved Blog",
        targetId: id,
      });
      sendEmailNotification("blogApproved");
      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error approving blog:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await rejectBlog(id);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Rejected Blog",
        targetId: id,
      });
      sendEmailNotification("blogRejected");
      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error rejecting blog:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="admin-layout p-8 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="admin-layout p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Blog Not Found</h2>
            <Link href="/admin/blogs" className="text-primary hover:underline">
              Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blogs"
                className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-primary"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Blog Preview</h1>
                <p className="text-gray-500">Review before approval</p>
              </div>
            </div>

            {blog.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <FiCheck className="w-5 h-5" /> Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <FiX className="w-5 h-5" /> Reject
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Blog Content Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {blog.thumbnail && (
                  <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(blog.status)}`}>
                      {blog.status?.charAt(0).toUpperCase() + blog.status?.slice(1)}
                    </span>
                    {blog.category && (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {blog.category}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-800 mb-6">{blog.title}</h1>

                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cleanContentForDisplay(blog.content) }} />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Author Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-primary" /> Author
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {author?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{author?.name || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{author?.email}</p>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiCalendar className="w-5 h-5 text-primary" /> Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium text-gray-800">{formatDate(blog.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Updated</span>
                    <span className="font-medium text-gray-800">{formatDate(blog.updatedAt) || formatDate(blog.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Views</span>
                    <span className="font-medium text-gray-800 flex items-center gap-1">
                      <FiEye className="w-4 h-4" /> {blog.views || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Shares</span>
                    <span className="font-medium text-gray-800 flex items-center gap-1">
                      <FiShare2 className="w-4 h-4" /> {blog.shares || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEO Score */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiBarChart2 className="w-5 h-5 text-primary" /> SEO Score
                </h3>
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${
                    blog.seoScore >= 80 ? "text-green-500" :
                    blog.seoScore >= 60 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {blog.seoScore || 0}
                  </div>
                  <p className="text-gray-500">out of 100</p>
                </div>
              </div>

              {/* SEO Details */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiTag className="w-5 h-5 text-primary" /> SEO Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1">SEO Title</p>
                    <p className="text-gray-800">{blog.seoTitle || blog.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1">Meta Description</p>
                    <p className="text-gray-600 text-sm">{blog.seoDescription || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1">Keywords</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {blog.keywords?.split(",").map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {kw.trim()}
                        </span>
                      )) || <span className="text-gray-500">Not set</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
