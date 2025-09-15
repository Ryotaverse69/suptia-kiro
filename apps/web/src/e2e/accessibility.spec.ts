/**
 * アクセシビリティテスト
 * タスク9.3: axe-core自動テスト（重大違反なし）、キーボードナビゲーションテスト
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('アクセシビリティテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('axe-core自動テスト', () => {
    test('ホームページにアクセシビリティ違反がない', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      // 重大な違反がないことを確認
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('ホームページの重要な要素にアクセシビリティ違反がない', async ({
      page,
    }) => {
      // より寛容なテスト - 重大な違反のみをチェック
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // 色のコントラストは別途テスト
        .analyze();

      // 重大な違反（critical, serious）のみをチェック
      const criticalViolations = accessibilityScanResults.violations.filter(
        violation =>
          violation.impact === 'critical' || violation.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('ヘッダーとフッターにアクセシビリティ違反がない', async ({ page }) => {
      // ヘッダーのテスト
      const headerResults = await new AxeBuilder({ page })
        .include('header')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const headerCriticalViolations = headerResults.violations.filter(
        violation =>
          violation.impact === 'critical' || violation.impact === 'serious'
      );
      expect(headerCriticalViolations).toEqual([]);

      // フッターのテスト
      const footerResults = await new AxeBuilder({ page })
        .include('footer')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const footerCriticalViolations = footerResults.violations.filter(
        violation =>
          violation.impact === 'critical' || violation.impact === 'serious'
      );
      expect(footerCriticalViolations).toEqual([]);
    });

    test('メインコンテンツにアクセシビリティ違反がない', async ({ page }) => {
      const mainResults = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast', 'landmark-one-main']) // 一部のルールを除外
        .analyze();

      const mainCriticalViolations = mainResults.violations.filter(
        violation =>
          violation.impact === 'critical' || violation.impact === 'serious'
      );
      expect(mainCriticalViolations).toEqual([]);
    });
  });

  test.describe('キーボードナビゲーションテスト', () => {
    test('Tabキーでフォーカス可能な要素を順次移動できる', async ({ page }) => {
      // 最初のフォーカス可能な要素にフォーカス
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // 複数回Tabを押してフォーカスが移動することを確認
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('Shift+Tabで逆方向にフォーカス移動できる', async ({ page }) => {
      // 最初にいくつかの要素にフォーカスを移動
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
      }

      // Shift+Tabで逆方向に移動
      await page.keyboard.press('Shift+Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('フォーカス可能な要素が適切にフォーカスリングを表示する', async ({
      page,
    }) => {
      // フォーカス可能な要素を取得
      const focusableElements = page.locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const count = await focusableElements.count();

      if (count > 0) {
        // 最初のフォーカス可能な要素にフォーカス
        const firstElement = focusableElements.first();
        await firstElement.focus();
        await expect(firstElement).toBeFocused();

        // フォーカスリングまたはアウトラインが表示されているかを確認
        const hasVisibleFocus = await firstElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          const pseudoStyles = window.getComputedStyle(el, ':focus');

          return (
            styles.outline !== 'none' ||
            styles.boxShadow !== 'none' ||
            pseudoStyles.outline !== 'none' ||
            pseudoStyles.boxShadow !== 'none' ||
            styles.borderColor !== 'initial'
          );
        });

        expect(hasVisibleFocus).toBeTruthy();
      }
    });

    test('Enterキーでボタンやリンクを活性化できる', async ({ page }) => {
      // ボタンを探してEnterキーで活性化
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        await expect(firstButton).toBeFocused();

        // Enterキーを押してボタンを活性化
        await page.keyboard.press('Enter');

        // ページが応答することを確認（エラーが発生しないこと）
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
      }

      // リンクを探してEnterキーで活性化
      const links = page.locator('a[href]');
      const linkCount = await links.count();

      if (linkCount > 0) {
        const firstLink = links.first();
        await firstLink.focus();
        await expect(firstLink).toBeFocused();

        // リンクのhref属性を確認
        const href = await firstLink.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          // 外部リンクでない場合のみEnterキーをテスト
          if (href.startsWith('/') || href.startsWith('#')) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('スキップリンクが機能する', async ({ page }) => {
      // Tabキーでスキップリンクにフォーカス
      await page.keyboard.press('Tab');
      
      // スキップリンクが表示されることを確認
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toBeVisible();

      // Enterキーでスキップリンクを活性化
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // メインコンテンツが存在することを確認
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
      await expect(mainContent).toBeFocused();
    });

    test('キーボードのみで検索→比較→詳細カードCTAまで到達できる', async ({ page }) => {
      // 1. 検索バーに直接フォーカス
      const searchInput = page.locator('input[type="text"][role="combobox"]');
      await searchInput.focus();
      await expect(searchInput).toBeFocused();

      // 2. 検索クエリを入力
      await searchInput.fill('ビタミンD');
      
      // 3. Enterキーで検索実行
      await page.keyboard.press('Enter');
      
      // 4. 比較セクションが表示されるまで待機
      await page.waitForTimeout(2000);
      
      // 5. 比較セクションが存在することを確認
      const comparisonsSection = page.locator('#popular-comparisons-section');
      await expect(comparisonsSection).toBeVisible();
      
      // 6. 比較セクションの最初のカードを探す
      const firstCompareCard = page.locator('[role="article"]').first().locator('button').last(); // 詳細ボタンを選択
      await expect(firstCompareCard).toBeVisible();
      
      // 7. カードにフォーカスを移動
      await firstCompareCard.focus();
      await expect(firstCompareCard).toBeFocused();
      
      // 8. Enterキーで詳細を表示
      await page.keyboard.press('Enter');
      
      // エラーが発生しないことを確認
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    });

    test('矢印キーで比較カード間を移動できる', async ({ page }) => {
      // 比較セクションが存在することを確認
      const comparisonsSection = page.locator('#popular-comparisons-section');
      await expect(comparisonsSection).toBeVisible();
      
      // 比較セクションまでスクロール
      await comparisonsSection.scrollIntoViewIfNeeded();
      
      // 最初の比較カードにフォーカス
      const firstCard = page.locator('[role="article"]').first().locator('button').last(); // 詳細ボタン
      await firstCard.focus();
      await expect(firstCard).toBeFocused();
      
      // 右矢印キーで次のカードに移動
      await page.keyboard.press('ArrowRight');
      
      // 2番目のカードにフォーカスが移動していることを確認
      const secondCard = page.locator('[role="article"]').nth(1).locator('button').last(); // 詳細ボタン
      await expect(secondCard).toBeFocused();
      
      // 左矢印キーで前のカードに戻る
      await page.keyboard.press('ArrowLeft');
      await expect(firstCard).toBeFocused();
    });

    test('グローバルキーボードショートカットが機能する', async ({ page }) => {
      // Alt + S: 検索バーにフォーカス
      await page.keyboard.press('Alt+s');
      await page.waitForTimeout(500);
      const searchInput = page.locator('input[type="text"][role="combobox"]');
      await expect(searchInput).toBeFocused();
      
      // Alt + C: 比較セクションにナビゲート
      await page.keyboard.press('Alt+c');
      await page.waitForTimeout(1000);
      
      // 比較セクションが表示されていることを確認
      const comparisonsSection = page.locator('#popular-comparisons-section');
      await expect(comparisonsSection).toBeInViewport();
      
      // Alt + M: メインコンテンツにナビゲート
      await page.keyboard.press('Alt+m');
      await page.waitForTimeout(500);
      
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeFocused();
    });
  });

  test.describe('ARIA属性とセマンティクス', () => {
    test('適切なランドマーク要素が存在する', async ({ page }) => {
      // header要素またはrole="banner"が存在することを確認
      const header = page.locator('header, [role="banner"]');
      await expect(header.first()).toBeVisible();

      // main要素またはrole="main"が存在することを確認
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();

      // footer要素またはrole="contentinfo"が存在することを確認
      const footer = page.locator('footer, [role="contentinfo"]');
      await expect(footer.first()).toBeVisible();
    });

    test('見出し階層が適切である', async ({ page }) => {
      // h1要素が存在することを確認
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // 見出し要素が存在することを確認
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });

    test('フォーム要素に適切なラベルが付いている', async ({ page }) => {
      // input要素を取得
      const inputs = page.locator('input');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputType = await input.getAttribute('type');

        // hidden, submit, button以外の入力要素をチェック
        if (
          inputType !== 'hidden' &&
          inputType !== 'submit' &&
          inputType !== 'button'
        ) {
          // aria-label、aria-labelledby、またはlabel要素との関連付けがあることを確認
          const hasAriaLabel = await input.getAttribute('aria-label');
          const hasAriaLabelledby = await input.getAttribute('aria-labelledby');
          const inputId = await input.getAttribute('id');

          let hasLabel = false;
          if (inputId) {
            const label = page.locator(`label[for="${inputId}"]`);
            hasLabel = (await label.count()) > 0;
          }

          const hasAccessibleName =
            hasAriaLabel || hasAriaLabelledby || hasLabel;
          expect(hasAccessibleName).toBeTruthy();
        }
      }
    });

    test('画像に適切なalt属性が設定されている', async ({ page }) => {
      // img要素を取得
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        // alt属性が存在することを確認（空文字列でも可）
        expect(alt).not.toBeNull();
      }
    });

    test('リンクに適切なアクセシブル名が設定されている', async ({ page }) => {
      // a要素を取得
      const links = page.locator('a[href]');
      const linkCount = await links.count();

      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);

        // リンクテキスト、aria-label、またはaria-labelledbyがあることを確認
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const ariaLabelledby = await link.getAttribute('aria-labelledby');

        const hasAccessibleName =
          (linkText && linkText.trim().length > 0) ||
          ariaLabel ||
          ariaLabelledby;
        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });

  test.describe('色とコントラスト', () => {
    test('重要な要素のコントラスト比が適切である', async ({ page }) => {
      // axe-coreのcolor-contrastルールのみを実行
      const contrastResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      // 重大なコントラスト違反がないことを確認
      const criticalContrastViolations = contrastResults.violations.filter(
        violation =>
          violation.impact === 'critical' || violation.impact === 'serious'
      );

      expect(criticalContrastViolations).toEqual([]);
    });
  });

  test.describe('動的コンテンツのアクセシビリティ', () => {
    test('動的に表示されるコンテンツが適切に通知される', async ({ page }) => {
      // aria-live領域が存在するかを確認
      const liveRegions = page.locator(
        '[aria-live], [role="status"], [role="alert"]'
      );
      const liveRegionCount = await liveRegions.count();

      // 動的コンテンツがある場合は、適切なaria-live属性が設定されていることを確認
      if (liveRegionCount > 0) {
        for (let i = 0; i < liveRegionCount; i++) {
          const region = liveRegions.nth(i);
          const ariaLive = await region.getAttribute('aria-live');
          const role = await region.getAttribute('role');

          const hasLiveAttribute =
            ariaLive || role === 'status' || role === 'alert';
          expect(hasLiveAttribute).toBeTruthy();
        }
      }
    });

    test('モーダルやドロップダウンが適切にフォーカス管理される', async ({
      page,
    }) => {
      // ドロップダウンやモーダルを開くボタンを探す
      const triggerButtons = page.locator(
        'button[aria-expanded], button[aria-haspopup]'
      );
      const triggerCount = await triggerButtons.count();

      if (triggerCount > 0) {
        const firstTrigger = triggerButtons.first();

        // ボタンが存在し、適切なARIA属性が設定されていることを確認
        const ariaExpanded = await firstTrigger.getAttribute('aria-expanded');
        const ariaHaspopup = await firstTrigger.getAttribute('aria-haspopup');

        expect(ariaExpanded !== null || ariaHaspopup !== null).toBeTruthy();

        // ボタンをクリックしてもエラーが発生しないことを確認
        await firstTrigger.click();
        await page.waitForTimeout(500);

        // ページが正常に動作することを確認
        await expect(page.locator('body')).toBeVisible();

        // Escapeキーを押してもエラーが発生しないことを確認
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      } else {
        // ドロップダウンボタンが存在しない場合はテストをスキップ
        test.skip();
      }
    });
  });
});
