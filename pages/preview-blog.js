import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import Layout from "../components/Layout";
import { getBlog, getUser } from "../lib/api-client";
import { cleanContentForDisplay } from "../components/BlogEditor";
import { useAuth } from "../context/AuthContext";
import { 
  FiArrowLeft, FiCalendar, FiUser, FiTag, FiEye, FiEdit2,
  FiClock, FiAlertCircle
} from "react-icons/fi";

export default function PreviewBlog() {
  const router = useRouter();
  const { id } = router.query;
  const { user, userData } = useAuth();
  const [blog, setBlog] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id && user) {
      fetchBlog();
    }
  }, [id, user]);

  const fetchBlog = async () => {
    try {
      const blogData = await getBlog(id);
      if (!blogData) {
        setError("Blog not found");
        setLoading(false);
        return;
      }

      const isAuthor = blogData.authorId === user?.uid;
      const isAdmin = userData?.role === "ADMIN";

      if (!isAuthor && !isAdmin) {
        setError("You don't have permission to preview this blog");
        setLoading(false);
        return;
      }

      setBlog(blogData);
      if (blogData.authorId) {
        const authorData = await getUser(blogData.authorId).catch(() => null);
        setAuthor(authorData);
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
      setError("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const calculateReadingTime = (content) => {
    if (!content) return "1 min read";
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !blog) {
    return (
      <Layout title="Error">
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{error || "Blog not found"}</h1>
            <Link href="/" className="text-primary hover:underline">Go back home</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Preview: ${blog.title}`}>
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-amber-500 text-white py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiEye className="w-5 h-5" />
              <span className="font-medium">Preview Mode</span>
              <span className="text-amber-100"> - Status: <span className="font-semibold capitalize">{blog.status}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/edit-blog?id=${blog.id}`} className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <FiEdit2 className="w-4 h-4" /> Edit
              </Link>
              <button onClick={() => router.back()} className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <FiArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        </div>

        {blog.thumbnail && (
          <div className="relative h-[400px] w-full">
            <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <article className="max-w-4xl mx-auto px-4 py-12">
          {blog.category && (
            <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <FiTag className="w-4 h-4" /> {blog.category}
            </span>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{blog.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-10 pb-10 border-b">
            {author && (
              <div className="flex items-center gap-3">
                {author.photoURL ? (
                  <img src={author.photoURL} alt={author.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{author.name || "Anonymous"}</p>
                  <p className="text-sm text-gray-500">Author</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2"><FiCalendar className="w-5 h-5" /><span>{formatDate(blog.createdAt)}</span></div>
            <div className="flex items-center gap-2"><FiClock className="w-5 h-5" /><span>{calculateReadingTime(blog.content)}</span></div>
          </div>

          <div
            className="blog-content prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:rounded-xl"
            dangerouslySetInnerHTML={{ __html: cleanContentForDisplay(blog.content) }}
          />

          <div className="mt-12 p-6 bg-slate-100 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h3>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-gray-700">SEO Score:</span> <span className={`font-bold ${blog.seoScore >= 80 ? "text-green-600" : "text-amber-600"}`}>{blog.seoScore || 0}%</span></div>
              <div><span className="font-medium text-gray-700">Content Score:</span> <span className={`font-bold ${blog.contentScore >= 80 ? "text-green-600" : "text-amber-600"}`}>{blog.contentScore || 0}%</span></div>
              {blog.seoDescription && <div><span className="font-medium text-gray-700">Meta Description:</span> <span className="text-gray-600">{blog.seoDescription}</span></div>}
            </div>
          </div>
        </article>
      </div>
    </Layout>
  );
}
