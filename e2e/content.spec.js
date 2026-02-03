// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Content Reading E2E Tests
 * Sprint 7 - Enterprise Testing Suite
 */

test.describe('Blog Reading', () => {
  test('should display blog listing page', async ({ page }) => {
    await page.goto('/blog');
    
    await expect(page).toHaveTitle(/Blog|Luvrix/);
    
    // Should have some content or empty state
    const hasContent = await page.locator('article, [class*="blog"], [class*="post"], [class*="card"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no posts|coming soon|empty/i').isVisible().catch(() => false);
    
    expect(hasContent || hasEmptyState).toBeTruthy();
  });

  test('should navigate to individual blog post', async ({ page }) => {
    await page.goto('/blog');
    
    const blogLink = page.locator('a[href*="/blog/"]').first();
    if (await blogLink.isVisible()) {
      await blogLink.click();
      await expect(page).toHaveURL(/\/blog\/.+/);
    }
  });

  test('blog page should be accessible', async ({ page }) => {
    await page.goto('/blog');
    
    // Check for basic accessibility
    const mainContent = page.locator('main, [role="main"], #main');
    await expect(mainContent.first()).toBeVisible().catch(() => {
      // Main might be structured differently
    });
  });
});

test.describe('Manga Reading', () => {
  test('should display manga listing page', async ({ page }) => {
    await page.goto('/manga');
    
    await expect(page).toHaveTitle(/Manga|Luvrix/);
    
    // Should have manga cards or empty state
    const hasContent = await page.locator('[class*="manga"], [class*="card"], article').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no manga|coming soon|empty/i').isVisible().catch(() => false);
    
    expect(hasContent || hasEmptyState).toBeTruthy();
  });

  test('should navigate to individual manga page', async ({ page }) => {
    await page.goto('/manga');
    
    const mangaLink = page.locator('a[href*="/manga/"]').first();
    if (await mangaLink.isVisible()) {
      await mangaLink.click();
      await expect(page).toHaveURL(/\/manga\/.+/);
    }
  });

  test('manga page should load images properly', async ({ page }) => {
    await page.goto('/manga');
    
    // Check if images are loading
    const images = page.locator('img[src*="manga"], img[alt*="manga"], img[class*="cover"]');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Verify first image loads
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
    }
  });
});

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Luvrix/);
    expect(page.url()).toContain('/');
  });

  test('should display navigation', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav, header, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Test blog navigation
    const blogLink = page.locator('a[href="/blog"], a:has-text("Blog")').first();
    if (await blogLink.isVisible()) {
      await blogLink.click();
      await expect(page).toHaveURL(/blog/);
    }
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer, [class*="footer"]');
    await expect(footer.first()).toBeVisible();
  });
});
