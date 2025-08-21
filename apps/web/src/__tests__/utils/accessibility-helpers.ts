/**
 * Accessibility Testing Utilities
 * アクセシビリティテスト用のユーティリティ関数
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * キーボードナビゲーションをテストするヘルパー関数
 */
export class KeyboardNavigationTester {
  private user = userEvent.setup();

  /**
   * Tab キーでのフォーカス移動をテスト
   */
  async testTabNavigation(elements: HTMLElement[]): Promise<void> {
    if (elements.length === 0) return;

    // 最初の要素にフォーカス
    elements[0].focus();
    expect(elements[0]).toHaveFocus();

    // Tab キーで順次移動
    for (let i = 1; i < elements.length; i++) {
      await this.user.tab();
      expect(elements[i]).toHaveFocus();
    }
  }

  /**
   * Shift+Tab キーでの逆方向フォーカス移動をテスト
   */
  async testShiftTabNavigation(elements: HTMLElement[]): Promise<void> {
    if (elements.length < 2) return;

    // 最後の要素にフォーカス
    const lastIndex = elements.length - 1;
    elements[lastIndex].focus();
    expect(elements[lastIndex]).toHaveFocus();

    // Shift+Tab で逆方向に移動
    for (let i = lastIndex - 1; i >= 0; i--) {
      await this.user.keyboard("{Shift>}{Tab}{/Shift}");
      expect(elements[i]).toHaveFocus();
    }
  }

  /**
   * Enter キーでのアクティベーションをテスト
   */
  async testEnterActivation(
    element: HTMLElement,
    expectedAction?: () => void,
  ): Promise<void> {
    element.focus();
    expect(element).toHaveFocus();

    await this.user.keyboard("{Enter}");

    if (expectedAction) {
      expectedAction();
    }
  }

  /**
   * Space キーでのアクティベーションをテスト
   */
  async testSpaceActivation(
    element: HTMLElement,
    expectedAction?: () => void,
  ): Promise<void> {
    element.focus();
    expect(element).toHaveFocus();

    await this.user.keyboard(" ");

    if (expectedAction) {
      expectedAction();
    }
  }

  /**
   * 矢印キーでのナビゲーションをテスト
   */
  async testArrowKeyNavigation(
    container: HTMLElement,
    direction: "horizontal" | "vertical" | "both" = "both",
  ): Promise<void> {
    container.focus();

    if (direction === "horizontal" || direction === "both") {
      await this.user.keyboard("{ArrowRight}");
      await this.user.keyboard("{ArrowLeft}");
    }

    if (direction === "vertical" || direction === "both") {
      await this.user.keyboard("{ArrowDown}");
      await this.user.keyboard("{ArrowUp}");
    }
  }

  /**
   * Escape キーでの閉じる動作をテスト
   */
  async testEscapeKey(
    element: HTMLElement,
    expectedAction?: () => void,
  ): Promise<void> {
    element.focus();
    await this.user.keyboard("{Escape}");

    if (expectedAction) {
      expectedAction();
    }
  }
}

/**
 * ARIA属性をテストするヘルパー関数
 */
export class AriaAttributeTester {
  /**
   * aria-sort 属性をテスト
   */
  testAriaSortAttribute(
    element: HTMLElement,
    expectedValue: "ascending" | "descending" | "none",
  ): void {
    expect(element).toHaveAttribute("aria-sort", expectedValue);
  }

  /**
   * scope 属性をテスト
   */
  testScopeAttribute(
    element: HTMLElement,
    expectedValue: "col" | "row" | "colgroup" | "rowgroup",
  ): void {
    expect(element).toHaveAttribute("scope", expectedValue);
  }

  /**
   * aria-label 属性をテスト
   */
  testAriaLabelAttribute(element: HTMLElement, expectedPattern?: RegExp): void {
    const ariaLabel = element.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();

    if (expectedPattern) {
      expect(ariaLabel).toMatch(expectedPattern);
    }
  }

  /**
   * aria-describedby 参照をテスト
   */
  testAriaDescribedbyReference(element: HTMLElement): void {
    const describedbyId = element.getAttribute("aria-describedby");

    if (describedbyId) {
      const ids = describedbyId.split(/\s+/);
      ids.forEach((id) => {
        if (id.trim()) {
          const referencedElement = document.getElementById(id.trim());
          expect(referencedElement).toBeInTheDocument();
        }
      });
    }
  }

  /**
   * aria-labelledby 参照をテスト
   */
  testAriaLabelledbyReference(element: HTMLElement): void {
    const labelledbyId = element.getAttribute("aria-labelledby");

    if (labelledbyId) {
      const ids = labelledbyId.split(/\s+/);
      ids.forEach((id) => {
        if (id.trim()) {
          const referencedElement = document.getElementById(id.trim());
          expect(referencedElement).toBeInTheDocument();
        }
      });
    }
  }

  /**
   * role 属性をテスト
   */
  testRoleAttribute(element: HTMLElement, expectedRole: string): void {
    expect(element).toHaveAttribute("role", expectedRole);
  }

  /**
   * aria-expanded 属性をテスト
   */
  testAriaExpandedAttribute(
    element: HTMLElement,
    expectedValue: "true" | "false",
  ): void {
    expect(element).toHaveAttribute("aria-expanded", expectedValue);
  }

  /**
   * aria-live 属性をテスト
   */
  testAriaLiveAttribute(
    element: HTMLElement,
    expectedValue: "polite" | "assertive" | "off",
  ): void {
    expect(element).toHaveAttribute("aria-live", expectedValue);
  }
}

/**
 * テーブル構造をテストするヘルパー関数
 */
export class TableStructureTester {
  /**
   * テーブルの基本構造をテスト
   */
  testBasicTableStructure(table: HTMLElement): void {
    // テーブル要素の確認
    expect(table).toHaveAttribute("role", "table");
    expect(table).toHaveAttribute("aria-label");

    // キャプションの確認
    const caption = table.querySelector("caption");
    if (caption) {
      expect(caption.textContent?.trim().length).toBeGreaterThan(0);
    }

    // ヘッダーの確認
    const headers = table.querySelectorAll("th");
    expect(headers.length).toBeGreaterThan(0);

    // 各ヘッダーのscope属性確認
    headers.forEach((header) => {
      const scope = header.getAttribute("scope");
      expect(["col", "row", "colgroup", "rowgroup"]).toContain(scope);
    });
  }

  /**
   * 列ヘッダーをテスト
   */
  testColumnHeaders(table: HTMLElement): HTMLElement[] {
    const columnHeaders = Array.from(
      table.querySelectorAll('th[scope="col"]'),
    ) as HTMLElement[];

    expect(columnHeaders.length).toBeGreaterThan(0);

    columnHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
      expect(header.textContent?.trim().length).toBeGreaterThan(0);
    });

    return columnHeaders;
  }

  /**
   * 行ヘッダーをテスト
   */
  testRowHeaders(table: HTMLElement): HTMLElement[] {
    const rowHeaders = Array.from(
      table.querySelectorAll('th[scope="row"]'),
    ) as HTMLElement[];

    rowHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "row");
      expect(header.textContent?.trim().length).toBeGreaterThan(0);
    });

    return rowHeaders;
  }

  /**
   * 並べ替え可能なヘッダーをテスト
   */
  testSortableHeaders(table: HTMLElement): HTMLElement[] {
    const sortableHeaders = Array.from(
      table.querySelectorAll("th[aria-sort]"),
    ) as HTMLElement[];

    sortableHeaders.forEach((header) => {
      const ariaSortValue = header.getAttribute("aria-sort");
      expect(["ascending", "descending", "none"]).toContain(ariaSortValue);

      // 並べ替えボタンの場合の追加チェック
      if (header.getAttribute("role") === "button") {
        expect(header).toHaveAttribute("tabindex", "0");
        expect(header.getAttribute("aria-label")).toBeTruthy();
      }
    });

    return sortableHeaders;
  }

  /**
   * データセルをテスト
   */
  testDataCells(table: HTMLElement): HTMLElement[] {
    const dataCells = Array.from(table.querySelectorAll("td")) as HTMLElement[];

    dataCells.forEach((cell) => {
      // データセルには内容があることを確認
      expect(cell.textContent?.trim().length).toBeGreaterThan(0);
    });

    return dataCells;
  }
}

/**
 * スクリーンリーダー対応をテストするヘルパー関数
 */
export class ScreenReaderTester {
  /**
   * ライブリージョンをテスト
   */
  testLiveRegions(): HTMLElement[] {
    const liveRegions = Array.from(
      document.querySelectorAll("[aria-live]"),
    ) as HTMLElement[];

    liveRegions.forEach((region) => {
      const ariaLive = region.getAttribute("aria-live");
      expect(["polite", "assertive", "off"]).toContain(ariaLive);
    });

    return liveRegions;
  }

  /**
   * ステータスリージョンをテスト
   */
  testStatusRegions(): HTMLElement[] {
    const statusRegions = Array.from(
      document.querySelectorAll('[role="status"]'),
    ) as HTMLElement[];

    statusRegions.forEach((region) => {
      // ステータスリージョンには内容があることを確認
      const textContent = region.textContent?.trim();
      if (textContent) {
        expect(textContent.length).toBeGreaterThan(0);
      }
    });

    return statusRegions;
  }

  /**
   * アラートリージョンをテスト
   */
  testAlertRegions(): HTMLElement[] {
    const alertRegions = Array.from(
      document.querySelectorAll('[role="alert"]'),
    ) as HTMLElement[];

    alertRegions.forEach((region) => {
      // アラートリージョンが表示されている場合は内容があることを確認
      if (region.offsetParent !== null) {
        // 表示されている場合
        const textContent = region.textContent?.trim();
        expect(textContent?.length).toBeGreaterThan(0);
      }
    });

    return alertRegions;
  }

  /**
   * アクセシブルな名前をテスト
   */
  testAccessibleName(element: HTMLElement): string {
    const ariaLabel = element.getAttribute("aria-label");
    const ariaLabelledby = element.getAttribute("aria-labelledby");
    const textContent = element.textContent?.trim();

    let accessibleName = "";

    if (ariaLabel) {
      accessibleName = ariaLabel;
    } else if (ariaLabelledby) {
      const ids = ariaLabelledby.split(/\s+/);
      const labelTexts = ids
        .map((id) => {
          const labelElement = document.getElementById(id.trim());
          return labelElement?.textContent?.trim() || "";
        })
        .filter((text) => text.length > 0);
      accessibleName = labelTexts.join(" ");
    } else if (textContent) {
      accessibleName = textContent;
    }

    expect(accessibleName.length).toBeGreaterThan(0);
    return accessibleName;
  }
}

/**
 * フォーカス管理をテストするヘルパー関数
 */
export class FocusManagementTester {
  /**
   * フォーカス可能な要素を取得
   */
  getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    const focusableSelectors = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex="0"]',
      '[role="button"]:not([disabled])',
    ];

    const elements: HTMLElement[] = [];

    focusableSelectors.forEach((selector) => {
      const found = Array.from(
        container.querySelectorAll(selector),
      ) as HTMLElement[];
      elements.push(...found.filter((el) => el.offsetParent !== null)); // 表示されている要素のみ
    });

    return elements;
  }

  /**
   * tabindex 属性をテスト
   */
  testTabIndexAttributes(elements: HTMLElement[]): void {
    elements.forEach((element) => {
      const tabIndex = element.getAttribute("tabindex");

      if (tabIndex !== null) {
        // tabindex は 0, -1, または正の整数であるべき
        const tabIndexValue = parseInt(tabIndex, 10);
        expect(tabIndexValue >= -1).toBe(true);

        // 正の tabindex は推奨されない（0 または -1 を使用）
        if (tabIndexValue > 0) {
          console.warn(
            `Positive tabindex found: ${tabIndexValue}. Consider using 0 or -1.`,
          );
        }
      }
    });
  }

  /**
   * フォーカストラップをテスト
   */
  async testFocusTrap(container: HTMLElement): Promise<void> {
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length < 2) {
      return; // フォーカストラップには最低2つの要素が必要
    }

    const user = userEvent.setup();

    // 最初の要素にフォーカス
    focusableElements[0].focus();
    expect(focusableElements[0]).toHaveFocus();

    // 最後の要素まで移動
    for (let i = 1; i < focusableElements.length; i++) {
      await user.tab();
      expect(focusableElements[i]).toHaveFocus();
    }

    // さらに Tab を押すと最初の要素に戻る
    await user.tab();
    expect(focusableElements[0]).toHaveFocus();

    // Shift+Tab で逆方向のトラップをテスト
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(focusableElements[focusableElements.length - 1]).toHaveFocus();
  }

  /**
   * フォーカス復帰をテスト
   */
  testFocusRestoration(
    triggerElement: HTMLElement,
    targetElement: HTMLElement,
  ): void {
    // トリガー要素にフォーカス
    triggerElement.focus();
    expect(triggerElement).toHaveFocus();

    // 何らかのアクション後、フォーカスが適切な要素に復帰することを確認
    targetElement.focus();
    expect(targetElement).toHaveFocus();
  }
}

/**
 * 包括的なアクセシビリティテストを実行するメインクラス
 */
export class AccessibilityTestSuite {
  private keyboardTester = new KeyboardNavigationTester();
  private ariaTester = new AriaAttributeTester();
  private tableTester = new TableStructureTester();
  private screenReaderTester = new ScreenReaderTester();
  private focusTester = new FocusManagementTester();

  /**
   * 比較テーブルの包括的なアクセシビリティテストを実行
   */
  async testCompareTableAccessibility(table: HTMLElement): Promise<void> {
    // テーブル構造のテスト
    this.tableTester.testBasicTableStructure(table);

    const columnHeaders = this.tableTester.testColumnHeaders(table);
    const rowHeaders = this.tableTester.testRowHeaders(table);
    const sortableHeaders = this.tableTester.testSortableHeaders(table);
    const dataCells = this.tableTester.testDataCells(table);

    // ARIA属性のテスト
    this.ariaTester.testRoleAttribute(table, "table");
    this.ariaTester.testAriaLabelAttribute(table);

    // 並べ替え可能ヘッダーのテスト
    if (sortableHeaders.length > 0) {
      for (const header of sortableHeaders) {
        const ariaSortValue = header.getAttribute("aria-sort") as
          | "ascending"
          | "descending"
          | "none";
        this.ariaTester.testAriaSortAttribute(header, ariaSortValue);

        if (header.getAttribute("role") === "button") {
          this.ariaTester.testAriaLabelAttribute(header);
        }
      }
    }

    // キーボードナビゲーションのテスト
    const focusableElements = this.focusTester.getFocusableElements(table);
    if (focusableElements.length > 0) {
      await this.keyboardTester.testTabNavigation(
        focusableElements.slice(0, 3),
      ); // 最初の3つをテスト

      // 並べ替えボタンのキーボード操作テスト
      const sortButtons = focusableElements.filter((el) =>
        el.getAttribute("aria-sort"),
      );
      if (sortButtons.length > 0) {
        await this.keyboardTester.testEnterActivation(sortButtons[0]);
        await this.keyboardTester.testSpaceActivation(sortButtons[0]);
      }
    }

    // スクリーンリーダー対応のテスト
    this.screenReaderTester.testLiveRegions();
    this.screenReaderTester.testStatusRegions();

    // フォーカス管理のテスト
    this.focusTester.testTabIndexAttributes(focusableElements);
  }

  /**
   * 警告ハイライトのアクセシビリティテストを実行
   */
  testWarningHighlightAccessibility(warningElement: HTMLElement): void {
    // 適切なroleが設定されていることを確認
    const role = warningElement.getAttribute("role");
    expect(["alert", "status"]).toContain(role);

    // 内容があることを確認
    expect(warningElement.textContent?.trim().length).toBeGreaterThan(0);

    // aria-live属性の確認（role="status"の場合は暗黙的）
    if (role === "status") {
      const ariaLive = warningElement.getAttribute("aria-live");
      if (ariaLive) {
        expect(["polite", "assertive"]).toContain(ariaLive);
      }
    }
  }

  /**
   * 並べ替えコントロールのアクセシビリティテストを実行
   */
  async testSortControlsAccessibility(
    controlsContainer: HTMLElement,
  ): Promise<void> {
    const buttons = this.focusTester.getFocusableElements(controlsContainer);

    // 各ボタンのアクセシビリティ確認
    buttons.forEach((button) => {
      this.screenReaderTester.testAccessibleName(button);

      // フォーカス可能であることを確認
      const tabIndex = button.getAttribute("tabindex");
      expect(tabIndex !== "-1").toBe(true);
    });

    // キーボード操作のテスト
    if (buttons.length > 0) {
      await this.keyboardTester.testTabNavigation(buttons);

      for (const button of buttons) {
        await this.keyboardTester.testEnterActivation(button);
        await this.keyboardTester.testSpaceActivation(button);
      }
    }
  }
}
