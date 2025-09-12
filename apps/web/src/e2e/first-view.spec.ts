/**
 * 8.2: 1st View は 検索のみが主役 を検証
 * 初回ビューポート内にヒーロー検索以外のセクションが表示されないこと
 */
import { test, expect } from '@playwright/test';

test.describe('First View ヒーロー優先表示', () => {
  test('ホーム初回表示で次セクションは折りたたみ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('main section')) as HTMLElement[];
      if (sections.length < 2) return { hasSecond: false, secondTop: 0, vh: window.innerHeight };
      const second = sections[1];
      const rect = second.getBoundingClientRect();
      return { hasSecond: true, secondTop: Math.round(rect.top), vh: window.innerHeight };
    });

    expect(result.hasSecond).toBeTruthy();
    // 次セクションの先頭はビューポート下端付近（少なくとも95%以降）
    expect(result.secondTop).toBeGreaterThanOrEqual(Math.floor(result.vh * 0.95));
  });
});

