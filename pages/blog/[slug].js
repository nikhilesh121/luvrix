// Slug-based blog route: /blog/[slug]
// Reuses the same BlogPage component from ../blog.js
// Resolves slug to blog data via getServerSideProps

export { default } from "../blog";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  
  if (!slug) {
    return { notFound: true };
  }

  try {
    const { getBlogBySlug, getUser, getSettings } = await import("../../lib/db");
    
    const blogData = await getBlogBySlug(slug);
    
    if (!blogData || blogData.status !== "approved") {
      return { notFound: true };
    }

    const serializeData = (obj) => {
      if (!obj) return null;
      const serialized = { ...obj };
      delete serialized._id;
      for (const key in serialized) {
        const value = serialized[key];
        if (value?.toDate) {
          serialized[key] = value.toDate().toISOString();
        } else if (value?.seconds) {
          serialized[key] = new Date(value.seconds * 1000).toISOString();
        } else if (value && typeof value === "object" && value.constructor?.name === "ObjectId") {
          serialized[key] = value.toString();
        } else if (value instanceof Date) {
          serialized[key] = value.toISOString();
        }
      }
      return serialized;
    };

    let authorData = null;
    if (blogData.authorId) {
      authorData = await getUser(blogData.authorId);
    }

    const settingsData = await getSettings();

    // Set Last-Modified header so crawlers can skip re-crawling unchanged content
    const lastMod = blogData.updatedAt || blogData.publishedAt || blogData.createdAt;
    if (lastMod) {
      const lastModDate = lastMod instanceof Date ? lastMod : new Date(lastMod);
      context.res.setHeader('Last-Modified', lastModDate.toUTCString());
    }

    return {
      props: {
        initialBlog: serializeData(blogData),
        initialAuthor: serializeData(authorData),
        initialSettings: serializeData(settingsData),
      },
    };
  } catch (error) {
    console.error("SSR Error (slug):", error);
    return { notFound: true };
  }
}
