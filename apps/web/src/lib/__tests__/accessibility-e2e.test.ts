/**
 * アクセシビリティE2Eテスト
 * axe-coreを使用したWCAG準拠テスト
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('アクセシビリティテスト', () => {
  test('ホームページのアクセシビリティ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('検索ページのアクセシビリティ', async ({ page }) => {
    await page.goto('/');
    
    // 検索を実行
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('ビタミン');
    await searchInput.press('Enter');
    
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('診断ページのアクセシビリティ', async ({ page }) => {
    await page.goto('/diagnosis');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('商品詳細ページのアクセシビリティ', async ({ page }) => {
    await page.goto('/products/test-supplement');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('比較ページのアクセシビリティ', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('成分ガイドページのアクセシビリティ', async ({ page }) => {
    await page.goto('/ingredients');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('マイページのアクセシビリティ', async ({ page }) => {
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('キーボードナビゲーション', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 複数回Tabキーを押してフォーカスが移動することを確認
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }

    // Shift+Tabで逆方向にナビゲーション
    await page.keyboard.press('Shift+Tab');
    focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('スクリーンリーダー対応', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // aria-labelの確認
    const elementsWithAriaLabel = page.locator('[aria-label]');
    const count = await elementsWithAriaLabel.count();
    expect(count).toBeGreaterThan(0);

    // 見出し構造の確認
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // h1が1つだけであることを確認
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    expect(h1Count).toBe(1);
  });

  test('カラーコントラスト', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // axe-coreでカラーコントラストをチェック
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[data-testid="color-contrast"]')
      .analyze();

    // カラーコントラストの違反がないことを確認
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    expect(colorContrastViolations).toEqual([]);
  });

  test('フォーカス管理', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // モーダルを開く（存在する場合）
    const modalTrigger = page.getByRole('button', { name: /詳細/ });
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      // モーダル内にフォーカスがトラップされることを確認
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      
      // フォーカスがモーダル内の要素にあることを確認
      const modalContent = page.locator('[role="dialog"]');
      if (await modalContent.isVisible()) {
        const isInsideModal = await focusedElement.evaluate((el, modal) => {
          return modal.contains(el);
        }, await modalContent.elementHandle());
        expect(isInsideModal).toBe(true);
      }
    }
  });

  test('代替テキスト', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // すべての画像に代替テキストがあることを確認
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const ariaLabelledby = await image.getAttribute('aria-labelledby');
      
      // 装飾的な画像でない限り、代替テキストが必要
      const isDecorative = await image.getAttribute('role') === 'presentation' ||
                          await image.getAttribute('aria-hidden') === 'true';
      
      if (!isDecorative) {
        expect(alt || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('フォームのアクセシビリティ', async ({ page }) => {
    await page.goto('/diagnosis');
    await page.waitForLoadState('networkidle');

    // すべてのフォーム要素にラベルがあることを確認
    const formElements = page.locator('input, select, textarea');
    const formElementCount = await formElements.count();

    for (let i = 0; i < formElementCount; i++) {
      const element = formElements.nth(i);
      const id = await element.getAttribute('id');
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledby = await element.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('ランドマークとセクション', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 主要なランドマークが存在することを確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // ナビゲーションが適切にマークアップされていることを確認
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });
});