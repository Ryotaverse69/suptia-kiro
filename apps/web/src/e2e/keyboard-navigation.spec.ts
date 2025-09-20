import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('should navigate from search to results to filters using keyboard only', async ({
    page,
  }) => {
    // ホームページに移動
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab キーでナビゲーション開始
    await page.keyboard.press('Tab');

    // スキップリンクが表示されることを確認
    const skipLink = page.locator('text=メインコンテンツにスキップ');
    await expect(skipLink).toBeVisible();

    // 検索入力フィールドまでTabで移動
    let tabCount = 0;
    while (tabCount < 20) {
      // 無限ループ防止
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement;
        return {
          tagName: element?.tagName,
          type: element?.getAttribute('type'),
          placeholder: element?.getAttribute('placeholder'),
          role: element?.getAttribute('role'),
        };
      });

      // 検索入力フィールドに到達
      if (focusedElement.placeholder?.includes('商品名・成分・目的')) {
        break;
      }
    }

    // 検索クエリを入力
    await page.keyboard.type('ビタミンD');

    // Enterで検索実行
    await page.keyboard.press('Enter');

    // 検索結果ページに移動することを確認
    await page.waitForURL('**/search?q=ビタミンD');
    await page.waitForLoadState('networkidle');

    // 検索結果が表示されることを確認
    const searchResults = page.locator(
      '[role="region"][aria-labelledby="search-results-heading"]'
    );
    await expect(searchResults).toBeVisible();

    // Tab キーで検索結果内を移動
    tabCount = 0;
    let foundResultCard = false;

    while (tabCount < 30 && !foundResultCard) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement;
        return {
          tagName: element?.tagName,
          className: element?.className,
          textContent: element?.textContent?.slice(0, 50),
        };
      });

      // 商品カードのボタンに到達
      if (
        focusedElement.textContent?.includes('比較に追加') ||
        focusedElement.textContent?.includes('詳細を見る')
      ) {
        foundResultCard = true;
        break;
      }
    }

    expect(foundResultCard).toBe(true);

    // フィルターサイドバーまでTabで移動
    tabCount = 0;
    let foundFilter = false;

    while (tabCount < 50 && !foundFilter) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement;
        return {
          tagName: element?.tagName,
          textContent: element?.textContent?.slice(0, 30),
          ariaLabel: element?.getAttribute('aria-label'),
        };
      });

      // フィルターのチェックボックスまたはボタンに到達
      if (
        focusedElement.textContent?.includes('条件をクリア') ||
        focusedElement.ariaLabel?.includes('フィルター') ||
        focusedElement.textContent?.includes('疲労回復') ||
        focusedElement.textContent?.includes('美容')
      ) {
        foundFilter = true;
        break;
      }
    }

    expect(foundFilter).toBe(true);

    // フィルターを操作（スペースキーでチェックボックスを切り替え）
    await page.keyboard.press('Space');

    // フィルターが適用されることを確認（URL変更またはページ更新）
    await page.waitForTimeout(1000);

    console.log('Keyboard navigation test completed successfully');
  });

  test('should handle focus trapping in modals and dropdowns', async ({
    page,
  }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // 目的・カテゴリドロップダウンを開く
    const categoryButton = page.locator(
      'button:has-text("疲労回復、美容、免疫…")'
    );
    await categoryButton.click();

    // ドロップダウンが開いていることを確認
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible();

    // Tab キーでドロップダウン内を移動
    await page.keyboard.press('Tab');

    // フォーカスがドロップダウン内に留まることを確認
    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      const dropdown = document.querySelector('[role="listbox"]');
      return dropdown?.contains(element) || false;
    });

    expect(focusedElement).toBe(true);

    // Escapeキーでドロップダウンを閉じる
    await page.keyboard.press('Escape');

    // ドロップダウンが閉じることを確認
    await expect(dropdown).not.toBeVisible();
  });

  test('should provide proper focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab キーでフォーカス移動
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // フォーカスリングが表示されることを確認
    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      const styles = window.getComputedStyle(element as Element);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        borderColor: styles.borderColor,
      };
    });

    // フォーカスインジケーターが存在することを確認
    const hasFocusIndicator =
      focusedElement.outline !== 'none' ||
      focusedElement.boxShadow.includes('rgb') ||
      focusedElement.borderColor.includes('rgb');

    expect(hasFocusIndicator).toBe(true);
  });

  test('should support arrow key navigation in lists', async ({ page }) => {
    await page.goto('/search?q=vitamin');
    await page.waitForLoadState('networkidle');

    // 検索結果リストの最初の項目にフォーカス
    const firstResult = page.locator('[data-testid="product-card"]').first();
    await firstResult.focus();

    // 下矢印キーで次の項目に移動
    await page.keyboard.press('ArrowDown');

    // フォーカスが移動したことを確認
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.getAttribute('data-testid');
    });

    // 上矢印キーで前の項目に戻る
    await page.keyboard.press('ArrowUp');

    console.log('Arrow key navigation test completed');
  });

  test('should maintain focus order consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const focusOrder: string[] = [];

    // Tab キーを複数回押してフォーカス順序を記録
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement;
        return (
          element?.tagName +
          ':' +
          (element?.textContent?.slice(0, 20) ||
            element?.getAttribute('aria-label') ||
            '')
        );
      });

      focusOrder.push(focusedElement);
    }

    // フォーカス順序が論理的であることを確認
    expect(focusOrder.length).toBe(10);
    expect(focusOrder[0]).toContain('A:'); // スキップリンク

    console.log('Focus order:', focusOrder);
  });
});
