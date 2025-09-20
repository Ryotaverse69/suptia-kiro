import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('アクセシビリティテスト', () => {
  test('ホームページ - axe重大違反0件', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // 重大違反（violations）が0件であることを確認
    expect(accessibilityScanResults.violations).toHaveLength(0);

    // 違反がある場合は詳細を出力
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'アクセシビリティ違反:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }
  });

  test('検索結果ページ - axe重大違反0件', async ({ page }) => {
    await page.goto('/search?q=プロテイン&goal=筋肥大');

    // 検索結果が読み込まれるまで待機
    await page.waitForSelector('[data-testid="search-results"]', {
      timeout: 10000,
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        '検索結果ページのアクセシビリティ違反:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }
  });

  test('成分詳細ページ - axe重大違反0件', async ({ page }) => {
    await page.goto('/ingredients/whey-protein');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        '成分詳細ページのアクセシビリティ違反:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }
  });

  test('キーボードナビゲーション', async ({ page }) => {
    await page.goto('/');

    // Tabキーでナビゲーション
    await page.keyboard.press('Tab'); // ヘッダーのロゴ
    await page.keyboard.press('Tab'); // 言語切替
    await page.keyboard.press('Tab'); // 通貨切替
    await page.keyboard.press('Tab'); // 検索フィールド

    // 検索フィールドにフォーカスがあることを確認
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('type', 'search');

    // Enterキーで検索実行
    await page.fill('input[type="search"]', 'プロテイン');
    await page.keyboard.press('Enter');

    // 検索結果ページに遷移することを確認
    await expect(page).toHaveURL(/\/search/);
  });

  test('フォーカスリングの表示', async ({ page }) => {
    await page.goto('/');

    // 検索ボタンにフォーカス
    await page.focus('button[type="submit"]');

    // フォーカスリングが表示されることを確認
    const button = page.locator('button[type="submit"]');
    await expect(button).toHaveClass(/focus:ring-2/);
  });

  test('ARIA属性の適切な設定', async ({ page }) => {
    await page.goto('/search?q=プロテイン');

    // 検索結果が読み込まれるまで待機
    await page.waitForSelector('[data-testid="search-results"]');

    // 検索結果リストにrole="list"が設定されていることを確認
    const resultsList = page.locator('[data-testid="search-results"]');
    await expect(resultsList).toHaveAttribute('role', 'list');

    // 各商品カードにrole="listitem"が設定されていることを確認
    const productCards = page.locator('[data-testid="product-card"]');
    const firstCard = productCards.first();
    await expect(firstCard).toHaveAttribute('role', 'listitem');
  });
});
