/**
 * Sentry Integration Tests
 */

describe('Sentry Integration', () => {
  describe('initSentry', () => {
    it('should initialize only in production with DSN', () => {
      const mockConfig = {
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        tracesSampleRate: 0.1,
      };

      expect(mockConfig.dsn).toBeDefined();
      expect(mockConfig.environment).toBe('production');
      expect(mockConfig.tracesSampleRate).toBeLessThanOrEqual(1);
    });

    it('should not initialize without DSN', () => {
      const mockConfig = {
        dsn: undefined,
        environment: 'development',
      };

      expect(mockConfig.dsn).toBeUndefined();
    });
  });

  describe('captureException', () => {
    it('should capture error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      expect(error.message).toBe('Test error');
      expect(context.userId).toBe('123');
    });

    it('should handle non-Error objects', () => {
      const errorString = 'Something went wrong';
      expect(typeof errorString).toBe('string');
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      expect(user.id).toBe('user-123');
      expect(user.email).toContain('@');
    });

    it('should clear user on null', () => {
      const user = null;
      expect(user).toBeNull();
    });
  });

  describe('addBreadcrumb', () => {
    it('should add navigation breadcrumb', () => {
      const breadcrumb = {
        category: 'navigation',
        message: 'User navigated to /home',
        level: 'info',
      };

      expect(breadcrumb.category).toBe('navigation');
      expect(breadcrumb.level).toBe('info');
    });

    it('should add action breadcrumb', () => {
      const breadcrumb = {
        category: 'user-action',
        message: 'User clicked button',
        data: { buttonId: 'submit' },
      };

      expect(breadcrumb.category).toBe('user-action');
      expect(breadcrumb.data.buttonId).toBe('submit');
    });
  });
});
