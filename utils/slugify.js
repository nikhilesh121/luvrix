export function slugify(text) {
  if (!text) return "";
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function generateBlogSlug(title) {
  const slug = slugify(title);
  const timestamp = Date.now().toString(36);
  return `${slug}-${timestamp}`;
}

export function generateMangaSlug(title) {
  return slugify(title);
}
