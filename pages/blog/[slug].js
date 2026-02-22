// Slug-based blog route: /blog/[slug]
// Client-side fetching for static export

import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getBlogBySlug, getUser, getSettings } from "../../lib/firebase-client";
import Layout from "../../components/Layout";
import SEOHead from "../../components/SEOHead";
import { FiLoader } from "react-icons/fi";

export default function BlogSlugPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [blog, setBlog] = useState(null);
  const [author, setAuthor] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    const fetchData = async () => {
      try {
        const blogData = await getBlogBySlug(slug);
        if (!blogData || blogData.status !== "approved") {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setBlog(blogData);
        
        if (blogData.authorId) {
          const authorData = await getUser(blogData.authorId);
          setAuthor(authorData);
        }
        
        const settingsData = await getSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching blog:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <SEOHead title="Blog Not Found" description="The blog post you are looking for does not exist." />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Blog Not Found</h1>
            <p className="text-gray-600 mb-6">The blog post you are looking for does not exist.</p>
            <Link href="/blog" className="text-primary hover:underline">Back to Blogs</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout settings={settings}>
      <SEOHead
        title={blog?.seoTitle || blog?.title}
        description={blog?.seoDescription || blog?.excerpt}
        image={blog?.thumbnail || blog?.coverImage}
        type="article"
      />
      <article className="max-w-4xl mx-auto px-4 py-8">
        {blog?.thumbnail && (
          <img src={blog.thumbnail} alt={blog.title} className="w-full h-64 md:h-96 object-cover rounded-xl mb-8" />
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog?.title}</h1>
        <div className="flex items-center gap-4 text-gray-500 mb-8">
          {author && <span>By {author.name || author.displayName}</span>}
          {blog?.publishedAt && <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>}
          <span>{blog?.views || 0} views</span>
        </div>
        <div 
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: blog?.content || "" }}
        />
      </article>
    </Layout>
  );
}
