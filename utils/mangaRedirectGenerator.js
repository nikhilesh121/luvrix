export function generateChapterUrl(manga, chapterNumber) {
  if (!manga || !manga.redirectBaseUrl) return null;

  const baseUrl = manga.redirectBaseUrl.endsWith("/")
    ? manga.redirectBaseUrl
    : `${manga.redirectBaseUrl}/`;

  const chapterFormat = manga.chapterFormat || "chapter-{n}";
  
  // Apply padding for leading zeros (e.g., 1 -> 001 with padding=3)
  const padding = manga.chapterPadding || 0;
  const paddedNumber = padding > 0 
    ? String(chapterNumber).padStart(padding, '0')
    : String(chapterNumber);
  
  const chapterSlug = chapterFormat.replace("{n}", paddedNumber);

  return `${baseUrl}${chapterSlug}/`;
}

export function generateChapterList(manga) {
  if (!manga || !manga.totalChapters) return [];

  const chapters = [];
  for (let i = 1; i <= manga.totalChapters; i++) {
    chapters.push({
      number: i,
      url: generateChapterUrl(manga, i),
      title: `Chapter ${i}`,
    });
  }

  return chapters;
}

export function generateMangaPageContent(manga, chapterNumber) {
  return {
    title: `${manga.title} - Chapter ${chapterNumber}`,
    description: `Read ${manga.title} Chapter ${chapterNumber} online. ${manga.description || ""}`,
    redirectUrl: generateChapterUrl(manga, chapterNumber),
    mangaTitle: manga.title,
    chapterNumber,
  };
}

export function validateMangaData(manga) {
  const errors = [];

  if (!manga.title) errors.push("Title is required");
  if (!manga.slug) errors.push("Slug is required");
  if (!manga.redirectBaseUrl) errors.push("Redirect base URL is required");
  if (!manga.totalChapters || manga.totalChapters < 1) {
    errors.push("Total chapters must be at least 1");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
