import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import UserGuard from "../components/UserGuard";
import SeoForm from "../components/SeoForm";
import ContentValidator from "../components/ContentValidator";
import { getBlog, updateBlog, getUser, getSettings, createLog } from "../lib/api-client";
import { processContent, cleanContentForDisplay } from "../components/BlogEditor";
import { TemplateSelector } from "../components/BlogTemplates";
import { calculateSeoScore, MIN_SEO_SCORE } from "../utils/seoScore";
import { checkForSpam } from "../utils/spamFilter";
import { canAutoApprove } from "../utils/contentValidator";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheck, FiImage, FiEdit3 } from "react-icons/fi";
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
  const isAdminMode = admin === "true";
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
  });

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
      <Layout title="Edit Blog">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error && !blog) {
    return (
      <Layout title="Edit Blog">
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
    <Layout title="Edit Blog">
      <div className="min-h-screen bg-slate-50">
        {/* Compact Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href={isAdmin ? "/admin/blogs" : "/dashboard"} className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition">
                <FiArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Edit Blog</h1>
                <p className="text-slate-500 text-sm">Update your blog post</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-green-600 text-sm">{success}</span>
              </div>
            )}

            {originalBlog && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title & Category */}
                <div className="bg-white rounded-xl border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Blog Title *</label>
                      <input
                        type="text"
                        value={blog.title}
                        onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Enter blog title"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Category *</label>
                      <select
                        value={blog.category}
                        onChange={(e) => setBlog({ ...blog, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                <div className="bg-white rounded-xl border p-4">
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Thumbnail URL</label>
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
                <div className="bg-white rounded-xl border p-4">
                  <TemplateSelector value={blog.template} onChange={(t) => setBlog({ ...blog, template: t })} />
                </div>

              {/* Content */}
                <div className="bg-white rounded-xl border p-4">
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Content *</label>
                  <BlogEditor
                    value={blog.content}
                    onChange={(content) => setBlog({ ...blog, content })}
                  />
                </div>

                {/* SEO */}
                <div className="bg-white rounded-xl border p-4">
                  <SeoForm blog={blog} onChange={setSeoData} initialData={seoData} />
                </div>

                {/* Content Validation */}
                <div className="bg-white rounded-xl border p-4">
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
                  <Link href={isAdmin ? "/admin/blogs" : "/dashboard"} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors">
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
