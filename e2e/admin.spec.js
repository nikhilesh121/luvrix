// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Admin Functions E2E Tests
 * Sprint 7 - Enterprise Testing Suite
 */

test.describe('Admin Access Control', () => {
  test('should protect admin routes', async ({ page }) => {
    await page.goto('/admin');
    
    await page.waitForTimeout(2000);
    
    // Should redirect or show unauthorized
    const url = page.url();
    const isProtected = 
      url.includes('login') || 
      url.includes('auth') || 
      url.includes('403') ||
      url.includes('404') ||
      !url.includes('/admin');
    
    expect(isProtected).toBeTruthy();
  });

  test('should protect admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const isProtected = 
      url.includes('login') || 
      url.includes('auth') || 
      url.includes('403') ||
      url.includes('404') ||
      !url.includes('/admin');
    
    expect(isProtected).toBeTruthy();
  });

  test('should protect admin users page', async ({ page }) => {
    await page.goto('/admin/users');
    
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const isProtected = 
      url.includes('login') || 
      url.includes('auth') || 
      url.includes('403') ||
      url.includes('404') ||
      !url.includes('/admin');
    
    expect(isProtected).toBeTruthy();
  });
});

test.describe('Admin API Protection', () => {
  test('should reject unauthorized admin API calls', async ({ request }) => {
    const response = await request.get('/api/admin/users').catch(() => null);
    
    if (response) {
      // Should return 401 or 403
      expect([401, 403, 404]).toContain(response.status());
    }
  });

  test('should reject unauthorized cache clear', async ({ request }) => {
    const response = await request.post('/api/admin/cache', {
      data: { action: 'clear' }
    }).catch(() => null);
    
    if (response) {
      expect([401, 403, 404, 405]).toContain(response.status());
    }
  });

  test('should reject unauthorized logs access', async ({ request }) => {
    const response = await request.get('/api/admin/logs').catch(() => null);
    
    if (response) {
      expect([401, 403, 404]).toContain(response.status());
    }
  });
});

test.describe('Admin Content Management', () => {
  test('should protect blog creation endpoint', async ({ request }) => {
    const response = await request.post('/api/blogs', {
      data: {
        title: 'Test Blog',
        content: 'Test content',
      }
    }).catch(() => null);
    
    if (response) {
      // Should require authentication
      expect([401, 403, 400]).toContain(response.status());
    }
  });

  test('should protect manga management', async ({ request }) => {
    const response = await request.post('/api/admin/manga', {
      data: {
        title: 'Test Manga',
        description: 'Test description',
      }
    }).catch(() => null);
    
    if (response) {
      expect([401, 403, 404, 405]).toContain(response.status());
    }
  });
});
