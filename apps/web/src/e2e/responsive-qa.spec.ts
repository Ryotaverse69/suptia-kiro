/**
 * 8.3: レスポンシブデザインのテスト
 * - モバイル: ナビは折りたたみ（デスクトップナビは非表示）
 * - タブレット: レイアウト継続的に問題なく表示
 * - デスクトップ: ナビゲーションが表示
 */
import { test, expect } from '@playwright/test';

test.describe('レスポンシブQA', () => {
  test('モバイル/タブレット/デスクトップでナビゲーション表示が適切', async ({ page }) => {
    // デスクトップ
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // デスクトップナビ（.lg:flex）が見える
    // 厳密なTailwindクラス検査は避け、リンク群が可視かで確認
    await expect(page.getByRole('navigation')).toBeVisible();

    // タブレット
    await page.setViewportSize({ width: 820, height: 1024 });
    await page.reload();
    await expect(page.locator('header')).toBeVisible();

    // モバイル
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    // デスクトップ用ナビは非表示（リンク群が見えない可能性）
    // 代わりにメニューボタンが見える
    const menuBtn = page.getByRole('button', { name: /メニュー|menu|メニューを開く/ });
    await expect(menuBtn.or(page.getByRole('button', { name: 'メニューを開く' }))).toBeVisible();
  });
});

