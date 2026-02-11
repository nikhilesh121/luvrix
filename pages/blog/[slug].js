// Slug-based blog route: /blog/[slug]
// Reuses the same BlogPage component from ../blog.js
// Resolves slug to blog data via getServerSideProps

export { default } from "../blog";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  
  if (!slug) {
    return { props: { initialBlog: null, initialAuthor: null, initialSettings: null } };
  }

  try {
    const { getBlogBySlug, getUser, getSettings } = await import("../../lib/db");
    
    const blogData = await getBlogBySlug(slug);
    
    if (!blogData || blogData.status !== "approved") {
      return { props: { initialBlog: null, initialAuthor: null, initialSettings: null } };
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

    return {
      props: {
        initialBlog: serializeData(blogData),
        initialAuthor: serializeData(authorData),
        initialSettings: serializeData(settingsData),
      },
    };
  } catch (error) {
    console.error("SSR Error (slug):", error);
    return { props: { initialBlog: null, initialAuthor: null, initialSettings: null } };
  }
}
