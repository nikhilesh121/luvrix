const spamPatterns = [
  /\b(viagra|cialis|casino|lottery|winner|prize|click here|act now|limited time)\b/gi,
  /\b(free money|make money fast|work from home|earn \$|guaranteed income)\b/gi,
  /\b(buy now|order now|special offer|exclusive deal)\b/gi,
  /(http[s]?:\/\/[^\s]+){5,}/gi,
  /(.)\1{10,}/g,
];

const spamKeywords = [
  "spam",
  "scam",
  "hack",
  "cheat",
  "illegal",
  "xxx",
  "porn",
  "adult",
  "gambling",
];

export function checkForSpam(content) {
  if (!content) return { isSpam: false, reasons: [] };

  const reasons = [];
  const lowerContent = content.toLowerCase();

  // Check spam patterns
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      reasons.push("Contains suspicious patterns");
      break;
    }
  }

  // Check spam keywords
  for (const keyword of spamKeywords) {
    if (lowerContent.includes(keyword)) {
      reasons.push(`Contains blocked keyword: ${keyword}`);
      break;
    }
  }

  // Check for excessive links
  const linkCount = (content.match(/http[s]?:\/\//gi) || []).length;
  if (linkCount > 10) {
    reasons.push("Too many links");
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 50) {
    reasons.push("Excessive use of capital letters");
  }

  // Check for repetitive content
  const words = content.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
    reasons.push("Repetitive content detected");
  }

  return {
    isSpam: reasons.length > 0,
    reasons,
    score: Math.max(0, 100 - reasons.length * 25),
  };
}

export function sanitizeContent(content) {
  if (!content) return "";

  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}
