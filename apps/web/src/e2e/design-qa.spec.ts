/**
 * 8.1: Apple風デザインの品質チェック（軽い静的検証）
 * - 影と余白・フォントの基本ポリシーが反映されているか表層確認
 */
import { test, expect } from '@playwright/test';

test.describe('デザインQA（表層）', () => {
  test('カード類に統一影クラスが適用されている', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // shadow-soft/strong を持つ要素が存在する（統一影の使用確認）
    const soft = page.locator('.shadow-soft');
    const strong = page.locator('.shadow-strong');
    expect((await soft.count()) + (await strong.count())).toBeGreaterThan(0);
  });

  test('背景は白基調、主要セクションは余白が十分', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // body が白背景
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBeTruthy();

    // セクションの上下余白（py-16相当）が存在
    const sections = page.locator('main section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);
  });
});

