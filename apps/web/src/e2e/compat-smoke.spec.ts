import { test, expect } from '@playwright/test';

test.describe('Cross-browser compatibility smoke', () => {
  test('Home renders with header and main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('Compare page loads', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('Ingredients page loads', async ({ page }) => {
    await page.goto('/ingredients');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('My page loads', async ({ page }) => {
    await page.goto('/mypage');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
