/**
 * 重要なユーザーフローのE2Eテスト
 * サプティアの主要機能をエンドツーエンドでテスト
 */

import { test, expect } from '@playwright/test';

test.describe('重要なユーザーフロー', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にホームページに移動
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('ホームページの基本要素が表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/サプティア/);

    // ヘッダーの確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header').getByText('サプティア')).toBeVisible();

    // メインコンテンツの確認
    await expect(page.locator('main')).toBeVisible();
    
    // キャッチフレーズの確認
    await expect(page.getByText('あなたに最も合うサプリを最も安い価格で')).toBeVisible();

    // 検索窓の確認
    await expect(page.locator('input[type="search"]')).toBeVisible();

    // フッターの確認
    await expect(page.locator('footer')).toBeVisible();
  });

  test('検索機能のフロー', async ({ page }) => {
    // 検索窓をクリック
    const searchInput = page.locator('input[type="search"]');
    await searchInput.click();

    // 検索キーワードを入力
    await searchInput.fill('ビタミンC');

    // 検索実行（Enterキー）
    await searchInput.press('Enter');

    // 検索結果ページに遷移することを確認
    await page.waitForURL(/search/);
    
    // 検索結果が表示されることを確認
    await expect(page.getByText('検索結果')).toBeVisible();
  });

  test('診断機能のフロー', async ({ page }) => {
    // 診断ページに移動
    await page.goto('/diagnosis');
    await page.waitForLoadState('networkidle');

    // 診断フォームが表示されることを確認
    await expect(page.getByText('診断')).toBeVisible();
    
    // 質問に回答（例：目的を選択）
    const purposeOption = page.locator('input[name="purpose"]').first();
    if (await purposeOption.isVisible()) {
      await purposeOption.check();
    }

    // 次の質問に進む（体質）
    const constitutionOption = page.locator('input[name="constitution"]').first();
    if (await constitutionOption.isVisible()) {
      await constitutionOption.check();
    }

    // 診断実行ボタンをクリック
    const submitButton = page.getByRole('button', { name: /診断/ });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // 診断結果が表示されることを確認
      await expect(page.getByText('診断結果')).toBeVisible();
      await expect(page.getByText('総合スコア')).toBeVisible();
    }
  });

  test('商品詳細ページのフロー', async ({ page }) => {
    // テスト用の商品ページに直接移動
    await page.goto('/products/test-supplement');
    
    // 商品詳細が表示されることを確認
    await expect(page.getByText('商品詳細')).toBeVisible();
    
    // 成分情報が表示されることを確認
    await expect(page.getByText('成分')).toBeVisible();
    
    // 価格情報が表示されることを確認
    await expect(page.getByText('価格')).toBeVisible();
    
    // お気に入りボタンが表示されることを確認
    const favoriteButton = page.getByRole('button', { name: /お気に入り/ });
    await expect(favoriteButton).toBeVisible();
    
    // お気に入りボタンをクリック
    await favoriteButton.click();
    
    // お気に入りに追加されたことを確認
    await expect(page.getByText('お気に入りに追加しました')).toBeVisible();
  });

  test('比較機能のフロー', async ({ page }) => {
    // 比較ページに移動
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');

    // 比較ページが表示されることを確認
    await expect(page.getByText('商品比較')).toBeVisible();
    
    // 比較テーブルが表示されることを確認
    await expect(page.locator('table')).toBeVisible();
    
    // フィルター機能が利用可能であることを確認
    const filterButton = page.getByRole('button', { name: /フィルター/ });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await expect(page.getByText('フィルター条件')).toBeVisible();
    }
  });

  test('成分ガイドのフロー', async ({ page }) => {
    // 成分ガイドページに移動
    await page.goto('/ingredients');
    await page.waitForLoadState('networkidle');

    // 成分ガイドが表示されることを確認
    await expect(page.getByText('成分ガイド')).toBeVisible();
    
    // カテゴリが表示されることを確認
    await expect(page.getByText('ビタミン')).toBeVisible();
    await expect(page.getByText('ミネラル')).toBeVisible();
    
    // カテゴリをクリックして詳細を表示
    await page.getByText('ビタミン').click();
    
    // ビタミンの詳細情報が表示されることを確認
    await expect(page.getByText('ビタミンC')).toBeVisible();
  });

  test('マイページのフロー', async ({ page }) => {
    // マイページに移動
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');

    // マイページが表示されることを確認
    await expect(page.getByText('マイページ')).toBeVisible();
    
    // お気に入り一覧に移動
    await page.getByText('お気に入り').click();
    await expect(page.getByText('お気に入り商品')).toBeVisible();
    
    // 診断履歴に移動
    await page.goto('/mypage/history');
    await expect(page.getByText('診断履歴')).toBeVisible();
    
    // 価格アラートに移動
    await page.goto('/mypage/alerts');
    await expect(page.getByText('価格アラート')).toBeVisible();
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await expect(page.locator('header')).toBeVisible();

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('header')).toBeVisible();

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('header')).toBeVisible();
    
    // モバイルメニューが表示されることを確認
    const mobileMenuButton = page.getByRole('button', { name: /メニュー/ });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.getByText('ナビゲーション')).toBeVisible();
    }
  });

  test('アクセシビリティの基本確認', async ({ page }) => {
    // キーボードナビゲーションの確認
    await page.keyboard.press('Tab');
    
    // フォーカスが適切に移動することを確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // スキップリンクの確認
    await page.keyboard.press('Tab');
    const skipLink = page.getByText('メインコンテンツにスキップ');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator('#main-content')).toBeFocused();
    }
  });

  test('パフォーマンスの基本確認', async ({ page }) => {
    // ページ読み込み時間の測定
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 5秒以内に読み込まれることを確認
    expect(loadTime).toBeLessThan(5000);
    
    // 重要な要素が表示されることを確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});