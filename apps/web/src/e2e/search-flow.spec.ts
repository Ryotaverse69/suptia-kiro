import { test, expect } from '@playwright/test';

test.describe('検索フロー', () => {
  test('検索から詳細閲覧までの主要フローが動作する', async ({ page }) => {
    await page.goto('/');

    const searchInput =
      page.getByPlaceholder('検索ワード（成分・ブランド・目的）');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('ビタミン');
    await searchInput.press('Enter');

    await page.waitForURL(/\/search/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=検索結果')).toBeVisible();

    const goalToggle = page.getByRole('button', { name: '疲労回復' }).first();
    if (await goalToggle.isVisible()) {
      await goalToggle.click();
      await expect(goalToggle).toHaveAttribute('aria-pressed', 'true');
    }

    const sortByPrice = page.getByRole('radio', { name: '価格が安い' });
    await sortByPrice.click();
    await expect(sortByPrice).toHaveAttribute('aria-checked', 'true');

    const firstResult = page.locator('[data-testid="product-card"] a').first();
    await expect(firstResult).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/products\//, { timeout: 10_000 }),
      firstResult.click(),
    ]);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=成分')).toBeVisible();
    await expect(page.locator('text=価格')).toBeVisible();
  });
});
