import { test, expect } from '@playwright/test';

test.describe('パフォーマンス検証', () => {
  test('初回ロードパフォーマンスが許容範囲内である', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navigationTimings = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (!nav) return null;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd,
        load: nav.loadEventEnd,
      };
    });

    expect(navigationTimings).not.toBeNull();
    if (navigationTimings) {
      expect(navigationTimings.domContentLoaded).toBeLessThan(4_000);
      expect(navigationTimings.load).toBeLessThan(6_000);
    }

    await expect(page).toHaveTitle(/サプティア/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});
