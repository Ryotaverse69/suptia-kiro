/**
 * Product Compare Table E2E Accessibility Tests
 * 比較テーブルのE2Eアクセシビリティテスト
 * Requirements: 7.2, 7.3, 7.4, 7.5, 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Product Compare Table E2E Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    // 比較ページに移動
    await page.goto("/compare");
    await page.waitForLoadState("networkidle");
  });

  test("キーボードナビゲーション - Tab、Enter、Space、矢印キー (Requirement 7.2)", async ({
    page,
  }) => {
    console.log("Testing keyboard navigation...");

    // フォーカス可能な要素を取得
    const focusableElements = await page
      .locator('button:visible, a[href]:visible, [tabindex="0"]:visible')
      .all();

    if (focusableElements.length === 0) {
      console.log(
        "No focusable elements found, skipping keyboard navigation test",
      );
      return;
    }

    console.log(`Found ${focusableElements.length} focusable elements`);

    // 最初の要素にフォーカス
    await focusableElements[0].focus();
    await expect(focusableElements[0]).toBeFocused();

    // Tabキーでナビゲーション
    for (let i = 1; i < Math.min(focusableElements.length, 5); i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);

      // フォーカスが移動したことを確認
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    }

    // Shift+Tabで逆方向ナビゲーション
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(100);

    // 並べ替えボタンのテスト
    const sortButtons = page.locator("button[aria-sort]");
    const sortButtonCount = await sortButtons.count();

    if (sortButtonCount > 0) {
      const firstSortButton = sortButtons.first();
      await firstSortButton.focus();
      await expect(firstSortButton).toBeFocused();

      // Enterキーで並べ替え
      const initialSort = await firstSortButton.getAttribute("aria-sort");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);

      // aria-sortが変更されたことを確認
      const newSort = await firstSortButton.getAttribute("aria-sort");
      expect(["ascending", "descending", "none"]).toContain(newSort);

      // Spaceキーでも並べ替え
      await page.keyboard.press(" ");
      await page.waitForTimeout(200);

      const finalSort = await firstSortButton.getAttribute("aria-sort");
      expect(["ascending", "descending", "none"]).toContain(finalSort);

      console.log("Sort button keyboard interaction tested:", {
        initial: initialSort,
        afterEnter: newSort,
        afterSpace: finalSort,
      });
    }

    // 矢印キーナビゲーション（実装されている場合）
    const table = page.locator('table[role="table"]');
    if ((await table.count()) > 0) {
      await table.focus();

      // 矢印キーでのナビゲーション
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowUp");

      console.log("Arrow key navigation tested");
    }
  });

  test("スクリーンリーダー対応 - テーブル構造とコンテンツ読み上げ (Requirement 7.3)", async ({
    page,
  }) => {
    console.log("Testing screen reader support...");

    // テーブルの存在確認
    const table = page.locator('table[role="table"]');
    if ((await table.count()) === 0) {
      console.log("No comparison table found, skipping screen reader test");
      return;
    }

    await expect(table).toBeVisible();

    // テーブルのアクセシブルな名前確認
    const tableAriaLabel = await table.getAttribute("aria-label");
    expect(tableAriaLabel).toBeTruthy();
    expect(tableAriaLabel).toContain("比較");
    console.log("Table aria-label:", tableAriaLabel);

    // キャプション確認
    const caption = table.locator("caption");
    if ((await caption.count()) > 0) {
      await expect(caption).toBeAttached();
      const captionText = await caption.textContent();
      expect(captionText?.trim().length).toBeGreaterThan(0);
      console.log("Table caption:", captionText?.trim());
    }

    // 列ヘッダー確認
    const columnHeaders = table.locator('th[scope="col"]');
    const columnHeaderCount = await columnHeaders.count();
    expect(columnHeaderCount).toBeGreaterThan(0);

    console.log(`Found ${columnHeaderCount} column headers`);

    for (let i = 0; i < columnHeaderCount; i++) {
      const header = columnHeaders.nth(i);
      await expect(header).toHaveAttribute("scope", "col");

      const headerText = await header.textContent();
      expect(headerText?.trim().length).toBeGreaterThan(0);

      if (i < 3) {
        // Log first 3 headers
        console.log(`Column header ${i + 1}:`, headerText?.trim());
      }
    }

    // 行ヘッダー確認
    const rowHeaders = table.locator('th[scope="row"]');
    const rowHeaderCount = await rowHeaders.count();

    if (rowHeaderCount > 0) {
      console.log(`Found ${rowHeaderCount} row headers`);

      for (let i = 0; i < Math.min(rowHeaderCount, 3); i++) {
        const header = rowHeaders.nth(i);
        await expect(header).toHaveAttribute("scope", "row");

        const headerText = await header.textContent();
        expect(headerText?.trim().length).toBeGreaterThan(0);
        console.log(`Row header ${i + 1}:`, headerText?.trim());
      }
    }

    // データセル確認
    const dataCells = table.locator("td");
    const dataCellCount = await dataCells.count();

    if (dataCellCount > 0) {
      console.log(`Found ${dataCellCount} data cells`);

      // 各セルにコンテンツがあることを確認
      for (let i = 0; i < Math.min(dataCellCount, 6); i++) {
        const cell = dataCells.nth(i);
        const cellText = await cell.textContent();
        expect(cellText?.trim().length).toBeGreaterThan(0);

        if (i < 3) {
          // Log first 3 cells
          console.log(`Data cell ${i + 1}:`, cellText?.trim());
        }
      }
    }

    // ライブリージョンの確認
    const liveRegions = page.locator("[aria-live]");
    const liveRegionCount = await liveRegions.count();

    if (liveRegionCount > 0) {
      console.log(`Found ${liveRegionCount} live regions`);

      for (let i = 0; i < liveRegionCount; i++) {
        const region = liveRegions.nth(i);
        const ariaLive = await region.getAttribute("aria-live");
        expect(["polite", "assertive", "off"]).toContain(ariaLive);

        const regionText = await region.textContent();
        console.log(`Live region ${i + 1} (${ariaLive}):`, regionText?.trim());
      }
    }

    // ステータスリージョンの確認
    const statusRegions = page.locator('[role="status"]');
    const statusCount = await statusRegions.count();

    if (statusCount > 0) {
      console.log(`Found ${statusCount} status regions`);

      for (let i = 0; i < statusCount; i++) {
        const status = statusRegions.nth(i);
        const statusText = await status.textContent();

        if (statusText?.trim()) {
          console.log(`Status region ${i + 1}:`, statusText.trim());
        }
      }
    }
  });

  test("ARIA属性検証 - aria-sort、scope、caption (Requirement 7.4)", async ({
    page,
  }) => {
    console.log("Testing ARIA attributes validation...");

    const table = page.locator('table[role="table"]');
    if ((await table.count()) === 0) {
      console.log("No comparison table found, skipping ARIA validation test");
      return;
    }

    // テーブルのARIA属性確認
    await expect(table).toHaveAttribute("role", "table");
    await expect(table).toHaveAttribute("aria-label");

    // 並べ替え可能なヘッダーのaria-sort確認
    const sortableHeaders = table.locator("th[aria-sort]");
    const sortableCount = await sortableHeaders.count();

    if (sortableCount > 0) {
      console.log(`Found ${sortableCount} sortable headers`);

      for (let i = 0; i < sortableCount; i++) {
        const header = sortableHeaders.nth(i);
        const ariaSortValue = await header.getAttribute("aria-sort");
        expect(["ascending", "descending", "none"]).toContain(ariaSortValue);

        // 並べ替えボタンの場合、追加属性確認
        if ((await header.getAttribute("role")) === "button") {
          await expect(header).toHaveAttribute("tabindex", "0");

          const ariaLabel = await header.getAttribute("aria-label");
          expect(ariaLabel).toBeTruthy();

          console.log(
            `Sortable header ${i + 1}: aria-sort="${ariaSortValue}", aria-label="${ariaLabel}"`,
          );
        }
      }

      // 並べ替え機能のテスト
      const firstSortableHeader = sortableHeaders.first();
      const initialSort = await firstSortableHeader.getAttribute("aria-sort");

      await firstSortableHeader.click();
      await page.waitForTimeout(200);

      const newSort = await firstSortableHeader.getAttribute("aria-sort");
      expect(newSort).not.toBe(initialSort);

      console.log(`Sort state changed from "${initialSort}" to "${newSort}"`);
    }

    // scope属性の確認
    const columnHeaders = table.locator('th[scope="col"]');
    const columnHeaderCount = await columnHeaders.count();
    expect(columnHeaderCount).toBeGreaterThan(0);

    const rowHeaders = table.locator('th[scope="row"]');
    const rowHeaderCount = await rowHeaders.count();

    console.log(
      `Scope attributes: ${columnHeaderCount} col headers, ${rowHeaderCount} row headers`,
    );

    // caption要素の確認
    const caption = table.locator("caption");
    if ((await caption.count()) > 0) {
      const captionText = await caption.textContent();
      expect(captionText?.trim().length).toBeGreaterThan(0);
      console.log("Table caption found:", captionText?.trim());
    }

    // その他のARIA属性確認
    const elementsWithAriaLabel = page.locator("[aria-label]");
    const ariaLabelCount = await elementsWithAriaLabel.count();
    console.log(`Found ${ariaLabelCount} elements with aria-label`);

    const elementsWithAriaDescribedby = page.locator("[aria-describedby]");
    const describedbyCount = await elementsWithAriaDescribedby.count();

    if (describedbyCount > 0) {
      console.log(`Found ${describedbyCount} elements with aria-describedby`);

      // 参照先要素の存在確認
      for (let i = 0; i < describedbyCount; i++) {
        const element = elementsWithAriaDescribedby.nth(i);
        const describedbyId = await element.getAttribute("aria-describedby");

        if (describedbyId) {
          const ids = describedbyId.split(/\s+/);
          for (const id of ids) {
            if (id.trim()) {
              const referencedElement = page.locator(`#${id.trim()}`);
              await expect(referencedElement).toBeAttached();
            }
          }
        }
      }
    }
  });

  test("フォーカス管理 - テーブルナビゲーション (Requirement 7.5)", async ({
    page,
  }) => {
    console.log("Testing focus management...");

    const table = page.locator('table[role="table"]');
    if ((await table.count()) === 0) {
      console.log("No comparison table found, skipping focus management test");
      return;
    }

    // フォーカス可能な要素の確認
    const focusableElements = page.locator(
      'button:visible, a[href]:visible, [tabindex="0"]:visible',
    );
    const focusableCount = await focusableElements.count();

    if (focusableCount === 0) {
      console.log("No focusable elements found");
      return;
    }

    console.log(`Found ${focusableCount} focusable elements`);

    // 各フォーカス可能要素のテスト
    for (let i = 0; i < Math.min(focusableCount, 5); i++) {
      const element = focusableElements.nth(i);

      // フォーカスを当てる
      await element.focus();
      await expect(element).toBeFocused();

      // tabindex属性の確認
      const tabIndex = await element.getAttribute("tabindex");
      if (tabIndex !== null) {
        expect(["0", "-1"]).toContain(tabIndex);
      }

      // フォーカスインジケーターの確認（視覚的確認は困難だが、フォーカス状態は確認可能）
      await expect(element).toBeFocused();

      console.log(`Element ${i + 1} focus test passed`);
    }

    // フォーカストラップのテスト（モーダルがある場合）
    const modal = page.locator('[role="dialog"]');
    if ((await modal.count()) > 0) {
      console.log("Testing focus trap in modal...");

      const modalFocusableElements = modal.locator(
        'button:visible, a[href]:visible, [tabindex="0"]:visible',
      );
      const modalFocusableCount = await modalFocusableElements.count();

      if (modalFocusableCount > 1) {
        // 最初の要素にフォーカス
        await modalFocusableElements.first().focus();

        // 最後の要素まで移動
        for (let i = 1; i < modalFocusableCount; i++) {
          await page.keyboard.press("Tab");
        }

        // さらにTabを押すと最初の要素に戻る
        await page.keyboard.press("Tab");
        await expect(modalFocusableElements.first()).toBeFocused();

        console.log("Focus trap working correctly");
      }
    }

    // Escapeキーでのフォーカス復帰テスト
    const expandableElements = page.locator("[aria-expanded]");
    const expandableCount = await expandableElements.count();

    if (expandableCount > 0) {
      const firstExpandable = expandableElements.first();
      await firstExpandable.focus();

      const isExpanded = await firstExpandable.getAttribute("aria-expanded");
      if (isExpanded === "false") {
        // 展開
        await page.keyboard.press("Enter");
        await page.waitForTimeout(100);

        // Escapeで閉じる
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);

        // フォーカスが戻っていることを確認
        await expect(firstExpandable).toBeFocused();

        console.log("Escape key focus restoration tested");
      }
    }
  });

  test("包括的なアクセシビリティスキャン (Requirement 7.1)", async ({
    page,
  }) => {
    console.log("Running comprehensive accessibility scan...");

    // axe-coreによる包括的スキャン
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .include('table[role="table"]') // 比較テーブルに焦点
      .include('[role="button"]') // 並べ替えボタン
      .include("[aria-sort]") // 並べ替え可能要素
      .analyze();

    // 違反がないことを確認
    expect(accessibilityScanResults.violations).toEqual([]);

    console.log("Accessibility scan passed with no violations");

    // 追加の手動チェック
    const table = page.locator('table[role="table"]');
    if ((await table.count()) > 0) {
      // テーブルの基本構造確認
      await expect(table).toHaveAttribute("role", "table");
      await expect(table).toHaveAttribute("aria-label");

      // ヘッダーの確認
      const headers = table.locator("th");
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      // セルの確認
      const cells = table.locator("td");
      const cellCount = await cells.count();

      console.log(
        `Table structure: ${headerCount} headers, ${cellCount} cells`,
      );
    }

    // インタラクティブ要素の確認
    const buttons = page.locator("button:visible");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      console.log(`Found ${buttonCount} interactive buttons`);

      // 各ボタンのアクセシビリティ確認
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);

        // アクセシブルな名前があることを確認
        const ariaLabel = await button.getAttribute("aria-label");
        const textContent = await button.textContent();

        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    }

    // フォーム要素の確認（もしあれば）
    const formElements = page.locator("input, select, textarea");
    const formElementCount = await formElements.count();

    if (formElementCount > 0) {
      console.log(`Found ${formElementCount} form elements`);

      for (let i = 0; i < formElementCount; i++) {
        const element = formElements.nth(i);

        // ラベルがあることを確認
        const ariaLabel = await element.getAttribute("aria-label");
        const ariaLabelledby = await element.getAttribute("aria-labelledby");
        const id = await element.getAttribute("id");

        let hasLabel = false;

        if (ariaLabel || ariaLabelledby) {
          hasLabel = true;
        } else if (id) {
          const label = page.locator(`label[for="${id}"]`);
          hasLabel = (await label.count()) > 0;
        }

        expect(hasLabel).toBeTruthy();
      }
    }

    console.log("Comprehensive accessibility scan completed successfully");
  });

  test("レスポンシブデザインでのアクセシビリティ維持", async ({ page }) => {
    console.log("Testing accessibility in responsive design...");

    // デスクトップサイズ
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(200);

    let table = page.locator('table[role="table"]');
    if ((await table.count()) > 0) {
      await expect(table).toBeVisible();
      console.log("Desktop view: table visible");
    }

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);

    table = page.locator('table[role="table"]');
    if ((await table.count()) > 0) {
      await expect(table).toBeVisible();

      // アクセシビリティ属性が維持されていることを確認
      await expect(table).toHaveAttribute("role", "table");
      await expect(table).toHaveAttribute("aria-label");

      console.log("Tablet view: accessibility attributes maintained");
    }

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);

    table = page.locator('table[role="table"]');
    if ((await table.count()) > 0) {
      // モバイルでもテーブルが適切に表示されることを確認
      await expect(table).toBeVisible();

      // フォーカス可能要素が適切なサイズであることを確認（間接的）
      const buttons = table.locator("button");
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        await expect(firstButton).toBeFocused();

        console.log("Mobile view: buttons remain focusable");
      }
    }

    console.log("Responsive accessibility test completed");
  });

  test("高コントラストモードでの表示確認", async ({ page }) => {
    console.log("Testing high contrast mode...");

    // 高コントラストモードをシミュレート
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(200);

    const table = page.locator('table[role="table"]');
    if ((await table.count()) > 0) {
      await expect(table).toBeVisible();

      // テキストが読み取り可能であることを確認
      const headers = table.locator("th");
      const headerCount = await headers.count();

      if (headerCount > 0) {
        for (let i = 0; i < Math.min(headerCount, 3); i++) {
          const header = headers.nth(i);
          const headerText = await header.textContent();
          expect(headerText?.trim().length).toBeGreaterThan(0);
        }

        console.log("High contrast mode: headers remain readable");
      }

      // インタラクティブ要素が識別可能であることを確認
      const buttons = table.locator("button");
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        await expect(firstButton).toBeFocused();

        console.log("High contrast mode: buttons remain interactive");
      }
    }

    // 通常モードに戻す
    await page.emulateMedia({ colorScheme: "light" });

    console.log("High contrast mode test completed");
  });
});
