import { test, expect } from '@playwright/test';

test.describe('言語・通貨切替機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('初期状態で日本語/JPYが表示される', async ({ page }) => {
    // 言語・通貨セレクターボタンを確認
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await expect(langButton).toBeVisible();
    await expect(langButton).toContainText('日本語');
    await expect(langButton).toContainText('JPY ¥');
  });

  test('言語・通貨セレクターをクリックしてドロップダウンが開く', async ({ page }) => {
    // 言語・通貨セレクターボタンをクリック
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();

    // ドロップダウンメニューが表示されることを確認
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // 日本語と英語のオプションが表示されることを確認
    await expect(page.getByRole('menuitem', { name: /日本語/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /English/ })).toBeVisible();
  });

  test('英語/USDに切り替えると表示が変更される', async ({ page }) => {
    // 言語・通貨セレクターボタンをクリック
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();

    // 英語オプションをクリック
    const englishOption = page.getByRole('menuitem', { name: /English/ });
    await englishOption.click();

    // ボタンの表示が英語/USDに変更されることを確認
    await expect(langButton).toContainText('English');
    await expect(langButton).toContainText('USD $');

    // ヘッダーのナビゲーションが英語に変更されることを確認
    await expect(page.getByRole('link', { name: /Compare/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ingredient Guide/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /About Suptia/ })).toBeVisible();
  });

  test('日本語に戻すと表示が日本語に戻る', async ({ page }) => {
    // まず英語に切り替え
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();
    await page.getByRole('menuitem', { name: /English/ }).click();

    // 英語表示を確認
    await expect(langButton).toContainText('English');

    // 再度言語セレクターを開いて日本語に戻す
    await langButton.click();
    await page.getByRole('menuitem', { name: /日本語/ }).click();

    // 日本語表示に戻ることを確認
    await expect(langButton).toContainText('日本語');
    await expect(langButton).toContainText('JPY ¥');

    // ヘッダーのナビゲーションが日本語に戻ることを確認
    await expect(page.getByRole('link', { name: /製品比較/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /成分ガイド/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /サプティアとは/ })).toBeVisible();
  });

  test('価格表示が通貨に応じて変更される', async ({ page }) => {
    // 初期状態で日本円の価格表示を確認
    const priceElements = page.locator('text=/￥[0-9,]+/');
    await expect(priceElements.first()).toBeVisible();

    // 英語/USDに切り替え
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();
    await page.getByRole('menuitem', { name: /English/ }).click();

    // USD表示に変更されることを確認（少し待機してから確認）
    await page.waitForTimeout(500);
    const usdPriceElements = page.locator('text=/\\$[0-9,.]+/');
    await expect(usdPriceElements.first()).toBeVisible();
  });

  test('ヒーローセクションのテキストが言語に応じて変更される', async ({ page }) => {
    // 初期状態で日本語のヒーローテキストを確認
    await expect(page.getByRole('heading', { level: 1 })).toContainText('あなたに最も合う');

    // 英語に切り替え
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();
    await page.getByRole('menuitem', { name: /English/ }).click();

    // 英語のヒーローテキストに変更されることを確認
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Find the best supplements');
  });

  test('検索バーのプレースホルダーが言語に応じて変更される', async ({ page }) => {
    // 初期状態で日本語のプレースホルダーを確認
    const searchInput = page.getByRole('combobox');
    await expect(searchInput).toHaveAttribute('placeholder', /サプリメントを検索/);

    // 英語に切り替え
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();
    await page.getByRole('menuitem', { name: /English/ }).click();

    // 英語のプレースホルダーに変更されることを確認
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveAttribute('placeholder', /Search supplements/);
  });

  test('Escapeキーでドロップダウンが閉じる', async ({ page }) => {
    // 言語・通貨セレクターボタンをクリック
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();

    // ドロップダウンが開いていることを確認
    await expect(page.getByRole('menu')).toBeVisible();

    // Escapeキーを押す
    await page.keyboard.press('Escape');

    // ドロップダウンが閉じることを確認
    await expect(page.getByRole('menu')).not.toBeVisible();
  });

  test('外部クリックでドロップダウンが閉じる', async ({ page }) => {
    // 言語・通貨セレクターボタンをクリック
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();

    // ドロップダウンが開いていることを確認
    await expect(page.getByRole('menu')).toBeVisible();

    // 外部をクリック
    await page.click('body');

    // ドロップダウンが閉じることを確認
    await expect(page.getByRole('menu')).not.toBeVisible();
  });

  test('設定がローカルストレージに保存される', async ({ page }) => {
    // 英語に切り替え
    const langButton = page.getByRole('button', { name: /言語・通貨切替/ });
    await langButton.click();
    await page.getByRole('menuitem', { name: /English/ }).click();

    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 設定が保持されていることを確認
    await expect(langButton).toContainText('English');
    await expect(langButton).toContainText('USD $');
  });
});