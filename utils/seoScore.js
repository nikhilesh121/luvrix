export function calculateSeoScore(blog) {
  let score = 0;
  const details = [];

  // Title check (20 points)
  if (blog.title && blog.title.length > 50) {
    score += 20;
    details.push({ item: "Title length", passed: true, points: 20 });
  } else {
    details.push({ item: "Title length (>50 chars)", passed: false, points: 0 });
  }

  // Content check (30 points)
  if (blog.content && blog.content.length > 1500) {
    score += 30;
    details.push({ item: "Content length", passed: true, points: 30 });
  } else {
    details.push({ item: "Content length (>1500 chars)", passed: false, points: 0 });
  }

  // SEO Description check (20 points)
  if (blog.seoDescription && blog.seoDescription.length > 150) {
    score += 20;
    details.push({ item: "SEO Description", passed: true, points: 20 });
  } else {
    details.push({ item: "SEO Description (>150 chars)", passed: false, points: 0 });
  }

  // Keywords check (15 points)
  const keywordCount = blog.keywords ? blog.keywords.split(",").filter(k => k.trim()).length : 0;
  if (keywordCount >= 5) {
    score += 15;
    details.push({ item: "Keywords count", passed: true, points: 15 });
  } else {
    details.push({ item: "Keywords (>=5 keywords)", passed: false, points: 0 });
  }

  // Slug check (15 points)
  if (blog.slug && blog.slug.length > 0) {
    score += 15;
    details.push({ item: "URL Slug", passed: true, points: 15 });
  } else {
    details.push({ item: "URL Slug", passed: false, points: 0 });
  }

  return { score, details, passed: score >= 80 };
}

export function getSeoStatus(score) {
  if (score >= 80) return { status: "excellent", color: "green", message: "SEO Ready!" };
  if (score >= 60) return { status: "good", color: "yellow", message: "Almost there!" };
  if (score >= 40) return { status: "fair", color: "orange", message: "Needs improvement" };
  return { status: "poor", color: "red", message: "SEO too weak" };
}

export const MIN_SEO_SCORE = 80;
