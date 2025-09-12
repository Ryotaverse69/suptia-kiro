/**
 * 8.2: 検索→結果→比較の導線が最短で成立することを検証
 */
import { test, expect } from '@playwright/test';

test.describe('検索から比較までの最短導線', () => {
  test('ホーム→検索→比較に追加→比較ページ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 検索を実行
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('ビタミン');
    await searchInput.press('Enter');
    await page.waitForURL(/search/);

    // 最初の結果カードで「比較に追加」を押す
    const addButtons = page.getByRole('button', { name: '比較に追加' });
    if (await addButtons.count()) {
      await addButtons.first().click();
    }

    // 下部トレイから「比較する」へ
    const compareButton = page.getByRole('button', { name: '比較する' });
    await expect(compareButton).toBeVisible();
    await compareButton.click();

    // 比較ページ表示
    await page.waitForURL(/compare/);
    await expect(page.getByText('商品比較')).toBeVisible();
  });
});

