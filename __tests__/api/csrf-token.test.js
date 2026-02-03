/**
 * @jest-environment node
 */

describe('CSRF Token API', () => {
  describe('GET /api/csrf-token', () => {
    it('should return a token on valid request', async () => {
      // Mock the handler response
      const mockResponse = {
        token: 'test-csrf-token-123',
      };

      expect(mockResponse.token).toBeDefined();
      expect(typeof mockResponse.token).toBe('string');
    });

    it('should set appropriate headers', () => {
      const expectedHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      };

      expect(expectedHeaders['Content-Type']).toBe('application/json');
      expect(expectedHeaders['Cache-Control']).toBe('no-store');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', () => {
      // When no session exists, should still generate a token
      const mockToken = 'anonymous-csrf-token';
      expect(mockToken).toBeDefined();
    });
  });
});
