import {
  sanitizeHTML,
  sanitizeText,
  sanitizeBlogContent,
  sanitizeURL,
  sanitizeObject,
  sanitizeUserInput,
  escapeHTML,
} from '../../lib/sanitize';

describe('Sanitization Library', () => {
  describe('sanitizeHTML', () => {
    it('should return empty string for null/undefined', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });

    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      expect(sanitizeHTML(input)).toBe(input);
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      expect(sanitizeHTML(input)).toBe('<p>Hello</p>');
    });

    it('should remove onclick attributes', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    it('should allow links with href', () => {
      const input = '<a href="https://example.com">Link</a>';
      expect(sanitizeHTML(input)).toContain('href');
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      expect(sanitizeText(input)).toBe('Hello World');
    });

    it('should handle empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
    });
  });

  describe('sanitizeBlogContent', () => {
    it('should allow figure and figcaption tags', () => {
      const input = '<figure><img src="test.jpg"><figcaption>Caption</figcaption></figure>';
      const result = sanitizeBlogContent(input);
      expect(result).toContain('<figure>');
      expect(result).toContain('<figcaption>');
    });

    it('should remove script tags from blog content', () => {
      const input = '<p>Blog post</p><script>malicious()</script>';
      expect(sanitizeBlogContent(input)).toBe('<p>Blog post</p>');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow https URLs', () => {
      const url = 'https://example.com/page';
      expect(sanitizeURL(url)).toBe(url);
    });

    it('should allow http URLs', () => {
      const url = 'http://example.com/page';
      expect(sanitizeURL(url)).toBe(url);
    });

    it('should allow relative URLs', () => {
      expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
      expect(sanitizeURL('#anchor')).toBe('#anchor');
    });

    it('should block javascript URLs', () => {
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
      expect(sanitizeURL('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('should block data URLs', () => {
      expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should handle empty input', () => {
      expect(sanitizeURL('')).toBe('');
      expect(sanitizeURL(null)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        age: 25,
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe('John');
    });

    it('should handle arrays', () => {
      const input = [{ name: '<script>x</script>hello' }, { name: 'world' }];
      const result = sanitizeObject(input);
      expect(result[0].name).toBe('hello');
      expect(result[1].name).toBe('world');
    });
  });

  describe('sanitizeUserInput', () => {
    it('should use HTML sanitizer for specified fields', () => {
      const input = {
        title: '<script>x</script>Title',
        content: '<p>Content</p>',
      };
      const result = sanitizeUserInput(input, ['content']);
      expect(result.title).toBe('Title');
      expect(result.content).toBe('<p>Content</p>');
    });

    it('should sanitize URL fields', () => {
      const input = {
        imageUrl: 'javascript:alert(1)',
        link: 'https://example.com',
      };
      const result = sanitizeUserInput(input);
      expect(result.imageUrl).toBe('');
      expect(result.link).toBe('https://example.com');
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML entities', () => {
      expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
      expect(escapeHTML('"quotes"')).toBe('&quot;quotes&quot;');
      expect(escapeHTML("'apostrophe'")).toBe('&#x27;apostrophe&#x27;');
    });

    it('should handle empty input', () => {
      expect(escapeHTML('')).toBe('');
      expect(escapeHTML(null)).toBe('');
    });
  });
});
