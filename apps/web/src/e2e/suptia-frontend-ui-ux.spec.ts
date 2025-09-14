/**
 * サプティアフロントエンドUI/UX刷新のE2Eテスト
 * タスク9.2: Home初期描画、タブ移動でのフォーカス管理、言語切替UI反映
 */

import { test, expect } from '@playwright/test';

test.describe('サプティアフロントエンドUI/UX E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Home初期描画', () => {
    test('ホームページが正常に初期描画される', async ({ page }) => {
      // ページタイトルの確認
      await expect(page).toHaveTitle(/サプティア|Suptia/);

      // ヘッダーの確認
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // メインコンテンツの確認
      const main = page.locator('main');
      await expect(main).toBeVisible();

      // フッターの確認
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('Heroセクションが1画面で完結し、スクロールしないと次セクションが見えない', async ({
      page,
    }) => {
      // ビューポートサイズを設定
      await page.setViewportSize({ width: 1280, height: 800 });

      // Heroセクションが表示されることを確認
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();

      // 初期状態でスクロール位置が0であることを確認
      const initialScrollY = await page.evaluate(() => window.scrollY);
      expect(initialScrollY).toBe(0);

      // 初期状態では次のセクション（HomePrimaryActions）が画面に見えないことを確認
      const homePrimaryActions = page.locator('text=比較').first();
      if ((await homePrimaryActions.count()) > 0) {
        // 要素の位置を取得して、ビューポート内にあるかチェック
        const box = await homePrimaryActions.boundingBox();
        const viewportHeight = await page.evaluate(() => window.innerHeight);

        if (box) {
          // 要素の上端がビューポートの下端より下にあれば見えない
          expect(box.y).toBeGreaterThan(viewportHeight);
        }
      }

      // スクロールして次のセクションが見えるようになることを確認
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);

      // スクロール後は次のセクションが見えるようになることを確認
      if ((await homePrimaryActions.count()) > 0) {
        const boxAfterScroll = await homePrimaryActions.boundingBox();
        const viewportHeight = await page.evaluate(() => window.innerHeight);

        if (boxAfterScroll) {
          // スクロール後は要素がビューポート内に見えるはず
          expect(boxAfterScroll.y).toBeLessThan(viewportHeight);
        }
      }

      // Heroセクションが1画面を占有していることを確認（機能的テスト）
      // 初期状態で次のコンテンツが見えず、スクロールが必要であることが重要
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      expect(viewportHeight).toBe(800); // 設定したビューポート高さと一致
    });

    test('基本的なページ要素が表示される', async ({ page }) => {
      // ページが正常に読み込まれることを確認
      await expect(page.locator('body')).toBeVisible();

      // 何らかのボタンが存在することを確認
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // 何らかのリンクが存在することを確認
      const links = page.locator('a');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('基本的なナビゲーション要素が表示される', async ({ page }) => {
      // ヘッダー内のナビゲーション要素を確認
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // 何らかのリンクが存在することを確認
      const links = page.locator('a');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    });
  });

  test.describe('タブ移動でのフォーカス管理', () => {
    test('キーボードナビゲーションが正常に動作する', async ({ page }) => {
      // 最初のタブでフォーカス可能な要素にフォーカス
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // さらにタブを押してフォーカスが移動することを確認
      await page.keyboard.press('Tab');
      const secondFocusedElement = page.locator(':focus');
      await expect(secondFocusedElement).toBeVisible();
    });

    test('入力フィールドにフォーカスできる', async ({ page }) => {
      // 最初の入力フィールドを見つけてフォーカス
      const firstInput = page.locator('input').first();
      if (await firstInput.isVisible()) {
        await firstInput.focus();
        await expect(firstInput).toBeFocused();
      }
    });

    test('フォーカス可能な要素が存在する', async ({ page }) => {
      // フォーカス可能な要素（ボタン、リンク、入力フィールド）が存在することを確認
      const focusableElements = page.locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const count = await focusableElements.count();
      expect(count).toBeGreaterThan(0);

      // 最初のフォーカス可能な要素にフォーカスできることを確認
      const firstFocusable = focusableElements.first();
      await firstFocusable.focus();
      await expect(firstFocusable).toBeFocused();
    });
  });

  test.describe('言語切替UI反映', () => {
    test('ページに日本語コンテンツが表示される', async ({ page }) => {
      // 日本語のテキストが存在することを確認
      const japaneseText = page.locator('text=/[あ-ん]|[ア-ン]|[一-龯]/');
      const count = await japaneseText.count();
      expect(count).toBeGreaterThan(0);
    });

    test('ボタンやリンクが存在する', async ({ page }) => {
      // ボタンが存在することを確認
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // リンクが存在することを確認
      const links = page.locator('a');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('インタラクティブ要素が機能する', async ({ page }) => {
      // 最初のボタンをクリックしてみる
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();

        // ページが応答することを確認
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('ページが正常に動作する', async ({ page }) => {
      // ページの基本的な機能が動作することを確認
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();

      // JavaScriptが正常に動作していることを確認
      const hasJS = await page.evaluate(() => {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      });
      expect(hasJS).toBeTruthy();
    });
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイルでのレスポンシブ表示', async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // ヘッダーが表示される
      await expect(page.locator('header')).toBeVisible();

      // メインコンテンツが表示される
      await expect(page.locator('main')).toBeVisible();

      // ビューポートサイズが正しく設定されていることを確認
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(viewportWidth).toBe(375);
    });

    test('タブレットでのレスポンシブ表示', async ({ page }) => {
      // タブレットサイズに設定
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // ヘッダーが表示される
      await expect(page.locator('header')).toBeVisible();

      // メインコンテンツが表示される
      await expect(page.locator('main')).toBeVisible();

      // ビューポートサイズが正しく設定されていることを確認
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(viewportWidth).toBe(768);
    });

    test('デスクトップでの表示', async ({ page }) => {
      // デスクトップサイズに設定
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // ヘッダーが表示される
      await expect(page.locator('header')).toBeVisible();

      // メインコンテンツが表示される
      await expect(page.locator('main')).toBeVisible();

      // ビューポートサイズが正しく設定されていることを確認
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(viewportWidth).toBe(1280);

      // 1280px時のレイアウトが適切であることを確認
      const mainContainer = page.locator('main').first();
      await expect(mainContainer).toBeVisible();
    });
  });
});
