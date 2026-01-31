// Content Validation Utility for Google Policy Compliance
// This validates blog content against Google AdSense and Search policies

// Prohibited words and patterns (violence, hate speech, adult content, etc.)
const prohibitedPatterns = {
  violence: [
    /\b(kill|murder|assault|attack|shoot|stab|bomb|terrorist|violence|violent|gore|blood|death threat)\b/gi,
    /\b(weapon|gun|knife|explosive|torture|abuse|beating|massacre)\b/gi,
  ],
  hateSpech: [
    /\b(hate|racist|racism|sexist|sexism|bigot|discriminate|discrimination)\b/gi,
    /\b(slur|derogatory|offensive|hateful)\b/gi,
  ],
  adultContent: [
    /\b(porn|pornography|xxx|nude|naked|sex|sexual|explicit|adult content)\b/gi,
    /\b(erotic|fetish|nsfw)\b/gi,
  ],
  gambling: [
    /\b(casino|gambling|bet|betting|poker|slot machine|lottery|jackpot)\b/gi,
  ],
  drugs: [
    /\b(drug|cocaine|heroin|marijuana|weed|cannabis|meth|narcotic|substance abuse)\b/gi,
  ],
  spam: [
    /\b(click here|buy now|free money|make money fast|get rich quick|limited offer)\b/gi,
    /\b(act now|don't miss|urgent|winner|congratulations you won)\b/gi,
  ],
  deceptive: [
    /\b(fake|scam|fraud|phishing|misleading|deceptive)\b/gi,
  ],
  copyright: [
    /\b(pirate|piracy|crack|keygen|torrent|illegal download|free download)\b/gi,
  ],
};

// Validation result structure
const createValidationResult = () => ({
  isValid: true,
  score: 100,
  issues: [],
  warnings: [],
  passed: [],
});

// Check for prohibited content
const checkProhibitedContent = (text, result) => {
  const lowerText = text.toLowerCase();
  
  Object.entries(prohibitedPatterns).forEach(([category, patterns]) => {
    patterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        result.isValid = false;
        result.score -= 20;
        result.issues.push({
          category,
          type: 'prohibited',
          message: `Contains prohibited ${category} content: "${matches.slice(0, 3).join(', ')}"`,
          severity: 'error',
        });
      }
    });
  });
};

// Check content quality
const checkContentQuality = (text, result) => {
  // Minimum word count
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 100) {
    result.warnings.push({
      type: 'quality',
      message: `Content is too short (${wordCount} words). Minimum 100 words recommended.`,
      severity: 'warning',
    });
    result.score -= 10;
  } else {
    result.passed.push('Content length is adequate');
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    result.warnings.push({
      type: 'quality',
      message: 'Too many capital letters. This may appear as shouting.',
      severity: 'warning',
    });
    result.score -= 5;
  } else {
    result.passed.push('Proper use of capitalization');
  }

  // Check for excessive punctuation
  const excessivePunctuation = /[!?]{3,}/g;
  if (excessivePunctuation.test(text)) {
    result.warnings.push({
      type: 'quality',
      message: 'Excessive punctuation detected (e.g., "!!!" or "???").',
      severity: 'warning',
    });
    result.score -= 5;
  } else {
    result.passed.push('Proper punctuation usage');
  }

  // Check for repeated words/phrases
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 4) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  const repeatedWords = Object.entries(wordFreq).filter(([_, count]) => count > 10);
  if (repeatedWords.length > 0) {
    result.warnings.push({
      type: 'quality',
      message: `Some words are repeated excessively: ${repeatedWords.slice(0, 3).map(([w]) => w).join(', ')}`,
      severity: 'warning',
    });
    result.score -= 5;
  } else {
    result.passed.push('Good vocabulary variety');
  }
};

// Check for external links
const checkLinks = (text, result) => {
  const suspiciousLinks = /https?:\/\/[^\s]*\.(ru|cn|tk|ml|ga|cf|xyz|top|work|click)/gi;
  if (suspiciousLinks.test(text)) {
    result.warnings.push({
      type: 'links',
      message: 'Contains links to potentially suspicious domains.',
      severity: 'warning',
    });
    result.score -= 10;
  }

  // Check for too many links
  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 10) {
    result.warnings.push({
      type: 'links',
      message: `Too many external links (${linkCount}). This may be flagged as spam.`,
      severity: 'warning',
    });
    result.score -= 5;
  }
};

// Check title quality
const checkTitle = (title, result) => {
  if (!title || title.length < 10) {
    result.warnings.push({
      type: 'title',
      message: 'Title is too short. Use at least 10 characters.',
      severity: 'warning',
    });
    result.score -= 5;
  } else if (title.length > 100) {
    result.warnings.push({
      type: 'title',
      message: 'Title is too long. Keep it under 100 characters.',
      severity: 'warning',
    });
    result.score -= 5;
  } else {
    result.passed.push('Title length is appropriate');
  }

  // Check for clickbait patterns
  const clickbaitPatterns = /\b(you won't believe|shocking|secret|amazing|incredible|unbelievable|mind-blowing)\b/gi;
  if (clickbaitPatterns.test(title)) {
    result.warnings.push({
      type: 'title',
      message: 'Title may contain clickbait language.',
      severity: 'warning',
    });
    result.score -= 5;
  }
};

// Main validation function
export const validateContent = (blog) => {
  const result = createValidationResult();
  
  const title = blog.title || '';
  const content = blog.content?.replace(/<[^>]*>/g, ' ') || ''; // Strip HTML
  const fullText = `${title} ${content}`;

  // Run all checks
  checkProhibitedContent(fullText, result);
  checkContentQuality(content, result);
  checkLinks(content, result);
  checkTitle(title, result);

  // Ensure score doesn't go below 0
  result.score = Math.max(0, result.score);

  // Add summary
  result.summary = result.isValid
    ? result.warnings.length > 0
      ? 'Content passes with warnings'
      : 'Content passes all checks'
    : 'Content contains policy violations';

  return result;
};

// Check if content can be auto-approved
export const canAutoApprove = (validationResult) => {
  return validationResult.isValid && validationResult.score >= 80;
};

// Get validation status color
export const getValidationStatusColor = (score) => {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

// Get validation status message
export const getValidationStatusMessage = (score) => {
  if (score >= 80) return 'Ready to publish';
  if (score >= 60) return 'Review recommended';
  return 'Needs correction';
};

export default validateContent;
