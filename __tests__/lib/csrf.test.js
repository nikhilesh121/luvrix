import { generateCSRFToken, validateCSRFToken } from '../../lib/csrf';

describe('CSRF Protection Library', () => {
  const testSessionId = 'test-session-123';

  describe('generateCSRFToken', () => {
    it('should generate a token string', () => {
      const token = generateCSRFToken(testSessionId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate different tokens each time', () => {
      const token1 = generateCSRFToken('session-1');
      const token2 = generateCSRFToken('session-2');
      expect(token1).not.toBe(token2);
    });

    it('should generate base64 encoded token', () => {
      const token = generateCSRFToken(testSessionId);
      // Should be valid base64
      expect(() => Buffer.from(token, 'base64')).not.toThrow();
    });
  });

  describe('validateCSRFToken', () => {
    it('should validate a valid token', () => {
      const token = generateCSRFToken(testSessionId);
      const isValid = validateCSRFToken(token, testSessionId);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', () => {
      const isValid = validateCSRFToken('invalid-token', testSessionId);
      expect(isValid).toBe(false);
    });

    it('should reject a token with wrong session', () => {
      const token = generateCSRFToken(testSessionId);
      const isValid = validateCSRFToken(token, 'wrong-session');
      expect(isValid).toBe(false);
    });

    it('should reject null/undefined tokens', () => {
      expect(validateCSRFToken(null, testSessionId)).toBe(false);
      expect(validateCSRFToken(undefined, testSessionId)).toBe(false);
    });

    it('should reject empty tokens', () => {
      expect(validateCSRFToken('', testSessionId)).toBe(false);
    });
  });
});
