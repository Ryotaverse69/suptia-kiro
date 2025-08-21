/**
 * Product Compare Table Accessibility Test Suite
 * 比較テーブルコンポーネントの包括的なアクセシビリティテスト
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { ProductCompareTable } from "../../components/compare/ProductCompareTable";
import { CompareTableHeader } from "../../components/compare/CompareTableHeader";
import { CompareTableRow } from "../../components/compare/CompareTableRow";
import { ScoreSummaryRow } from "../../components/compare/ScoreSummaryRow";
import { WarningHighlight } from "../../components/compare/WarningHighlight";
import { CompareControls } from "../../components/compare/CompareControls";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data for testing
const mockProducts = [
  {
    id: "product-1",
    name: "テスト製品A",
    price: 1000,
    totalScore: 85,
    scoreBreakdown: {
      effectiveness: 90,
      safety: 80,
      costPerformance: 85,
    },
    warnings: [
      {
        id: "warning-1",
        type: "critical" as const,
        category: "safety",
        message: "重要な安全性の警告",
        severity: 8,
        productId: "product-1",
      },
    ],
    imageUrl: "/test-image-1.jpg",
    url: "/products/test-product-a",
  },
  {
    id: "product-2",
    name: "テスト製品B",
    price: 1500,
    totalScore: 75,
    scoreBreakdown: {
      effectiveness: 70,
      safety: 85,
      costPerformance: 70,
    },
    warnings: [],
    imageUrl: "/test-image-2.jpg",
    url: "/products/test-product-b",
  },
  {
    id: "product-3",
    name: "テスト製品C",
    price: 800,
    totalScore: 90,
    scoreBreakdown: {
      effectiveness: 95,
      safety: 90,
      costPerformance: 85,
    },
    warnings: [
      {
        id: "warning-2",
        type: "warning" as const,
        category: "effectiveness",
        message: "効果に関する注意事項",
        severity: 5,
        productId: "product-3",
      },
    ],
    imageUrl: "/test-image-3.jpg",
    url: "/products/test-product-c",
  },
];

const mockScoreSummary = {
  category: "effectiveness",
  maxScore: 95,
  minScore: 70,
  averageScore: 85,
  products: [
    { productId: "product-1", score: 90 },
    { productId: "product-2", score: 70 },
    { productId: "product-3", score: 95 },
  ],
};

describe("Product Compare Table Accessibility", () => {
  describe("Table Structure and ARIA Attributes", () => {
    test("テーブルに適切なcaption要素が含まれる (Requirement 1.1)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // caption要素の存在確認
      const caption = screen.getByText(/製品比較表/);
      expect(caption).toBeInTheDocument();
      expect(caption.tagName.toLowerCase()).toBe("caption");
    });

    test("テーブルヘッダーに適切なscope属性が設定される (Requirement 1.2)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 列ヘッダーのscope="col"確認
      const columnHeaders = screen.getAllByRole("columnheader");
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });

      // 行ヘッダーのscope="row"確認（製品名）
      const rowHeaders = screen.getAllByRole("rowheader");
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "row");
      });
    });

    test("並べ替え機能にaria-sort属性が適切に設定される (Requirement 1.3)", async () => {
      const user = userEvent.setup();
      const mockOnSort = jest.fn();

      render(
        <ProductCompareTable
          products={mockProducts}
          onSort={mockOnSort}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      // 並べ替え可能なヘッダーを取得
      const sortableHeaders = screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-sort") !== null);

      expect(sortableHeaders.length).toBeGreaterThan(0);

      // 現在の並べ替え状態確認
      const scoreHeader = sortableHeaders.find((header) =>
        header.textContent?.includes("スコア"),
      );

      if (scoreHeader) {
        expect(scoreHeader).toHaveAttribute("aria-sort", "descending");

        // 並べ替えボタンクリック
        await user.click(scoreHeader);

        // aria-sort属性の更新確認
        await waitFor(() => {
          expect(mockOnSort).toHaveBeenCalled();
        });
      }
    });

    test("テーブルに適切なaria-label属性が設定される (Requirement 1.4)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");

      const ariaLabel = table.getAttribute("aria-label");
      expect(ariaLabel).toContain("製品比較");
      expect(ariaLabel).toContain(mockProducts.length.toString());
    });

    test("スクリーンリーダー用の適切な構造が提供される (Requirement 1.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // テーブル構造の確認
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // ヘッダー行の確認
      const headerRow = screen.getByRole("row", { name: /製品名|スコア|価格/ });
      expect(headerRow).toBeInTheDocument();

      // データ行の確認
      mockProducts.forEach((product) => {
        const productRow = screen.getByRole("row", {
          name: new RegExp(product.name),
        });
        expect(productRow).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Navigation", () => {
    test("Tab、Enter、Space、矢印キーでの操作が可能 (Requirement 7.2)", async () => {
      const user = userEvent.setup();
      const mockOnSort = jest.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      // 並べ替えボタンにフォーカス
      const sortButtons = screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-sort") !== null);

      if (sortButtons.length > 0) {
        const firstSortButton = sortButtons[0];

        // Tabキーでフォーカス移動
        await user.tab();
        expect(document.activeElement).toBe(firstSortButton);

        // Enterキーで並べ替え実行
        await user.keyboard("{Enter}");
        expect(mockOnSort).toHaveBeenCalled();

        // Spaceキーで並べ替え実行
        mockOnSort.mockClear();
        await user.keyboard(" ");
        expect(mockOnSort).toHaveBeenCalled();

        // 矢印キーでのナビゲーション（実装されている場合）
        await user.keyboard("{ArrowRight}");
        await user.keyboard("{ArrowLeft}");
      }
    });

    test("キーボードナビゲーションの順序が論理的である (Requirement 7.2)", async () => {
      const user = userEvent.setup();

      render(<ProductCompareTable products={mockProducts} />);

      // フォーカス可能な要素を取得
      const focusableElements = screen.getAllByRole("button");

      if (focusableElements.length > 1) {
        // 最初の要素にフォーカス
        focusableElements[0].focus();
        expect(document.activeElement).toBe(focusableElements[0]);

        // Tabキーで次の要素に移動
        await user.tab();
        expect(document.activeElement).toBe(focusableElements[1]);

        // Shift+Tabで前の要素に戻る
        await user.keyboard("{Shift>}{Tab}{/Shift}");
        expect(document.activeElement).toBe(focusableElements[0]);
      }
    });

    test("フォーカス管理が適切に動作する (Requirement 7.5)", async () => {
      const user = userEvent.setup();

      render(<ProductCompareTable products={mockProducts} />);

      // フォーカス可能な要素の確認
      const interactiveElements = screen.getAllByRole("button");

      interactiveElements.forEach((element) => {
        // tabindex属性の確認
        const tabIndex = element.getAttribute("tabindex");
        expect(tabIndex === null || tabIndex === "0" || tabIndex === "-1").toBe(
          true,
        );

        // フォーカス可能性の確認
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe("Screen Reader Support", () => {
    test("テーブル構造が適切に読み上げられる (Requirement 7.3)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // テーブルのアクセシブルな名前
      const table = screen.getByRole("table");
      const accessibleName =
        table.getAttribute("aria-label") ||
        screen.queryByText(/製品比較表/)?.textContent;
      expect(accessibleName).toBeTruthy();

      // 列ヘッダーの確認
      const columnHeaders = screen.getAllByRole("columnheader");
      expect(columnHeaders.length).toBeGreaterThan(0);

      columnHeaders.forEach((header) => {
        expect(header.textContent?.trim()).toBeTruthy();
      });

      // 行ヘッダーの確認（製品名）
      const rowHeaders = screen.getAllByRole("rowheader");
      expect(rowHeaders.length).toBe(mockProducts.length);

      rowHeaders.forEach((header, index) => {
        expect(header.textContent).toContain(mockProducts[index].name);
      });
    });

    test("コンテンツが適切に読み上げられる (Requirement 7.3)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 各製品のデータセルを確認
      mockProducts.forEach((product) => {
        // 製品名
        expect(screen.getByText(product.name)).toBeInTheDocument();

        // スコア
        expect(
          screen.getByText(product.totalScore.toString()),
        ).toBeInTheDocument();

        // 価格
        expect(screen.getByText(product.price.toString())).toBeInTheDocument();
      });
    });
  });

  describe("ARIA Attributes Validation", () => {
    test("aria-sort属性が適切に設定される (Requirement 7.4)", () => {
      render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      const sortableHeaders = screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-sort") !== null);

      sortableHeaders.forEach((header) => {
        const ariaSortValue = header.getAttribute("aria-sort");
        expect(["ascending", "descending", "none"]).toContain(ariaSortValue);
      });
    });

    test("scope属性が適切に設定される (Requirement 7.4)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 列ヘッダーのscope="col"
      const columnHeaders = screen.getAllByRole("columnheader");
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });

      // 行ヘッダーのscope="row"
      const rowHeaders = screen.getAllByRole("rowheader");
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "row");
      });
    });

    test("caption要素が適切に設定される (Requirement 7.4)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const caption = screen.getByText(/製品比較表/);
      expect(caption).toBeInTheDocument();
      expect(caption.tagName.toLowerCase()).toBe("caption");

      // captionの内容が説明的である
      expect(caption.textContent).toContain("製品");
      expect(caption.textContent).toContain(mockProducts.length.toString());
    });
  });

  describe("Component-Specific Accessibility", () => {
    test("ScoreSummaryRowのアクセシビリティ", () => {
      render(
        <ScoreSummaryRow summary={mockScoreSummary} products={mockProducts} />,
      );

      // 要約行の適切な構造
      const summaryRow = screen.getByRole("row");
      expect(summaryRow).toBeInTheDocument();

      // スコア値のアクセシブルな表示
      expect(
        screen.getByText(mockScoreSummary.maxScore.toString()),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockScoreSummary.minScore.toString()),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockScoreSummary.averageScore.toString()),
      ).toBeInTheDocument();
    });

    test("WarningHighlightのアクセシビリティ", () => {
      const criticalWarning = mockProducts[0].warnings[0];
      render(<WarningHighlight warning={criticalWarning} />);

      // 警告の適切な表示
      const warningElement = screen.getByText(criticalWarning.message);
      expect(warningElement).toBeInTheDocument();

      // 重要度に応じた適切なaria属性
      const warningContainer = warningElement.closest("[role]");
      if (warningContainer) {
        expect(["alert", "status"]).toContain(
          warningContainer.getAttribute("role"),
        );
      }
    });

    test("CompareControlsのアクセシビリティ", () => {
      const mockOnSort = jest.fn();
      render(<CompareControls onSort={mockOnSort} />);

      // 並べ替えコントロールの確認
      const sortButtons = screen.getAllByRole("button");
      expect(sortButtons.length).toBeGreaterThan(0);

      sortButtons.forEach((button) => {
        // ボタンにアクセシブルな名前がある
        const accessibleName =
          button.getAttribute("aria-label") || button.textContent;
        expect(accessibleName?.trim()).toBeTruthy();

        // フォーカス可能である
        expect(button).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Axe Accessibility Testing", () => {
    test("ProductCompareTableにアクセシビリティ違反がない (Requirement 7.1)", async () => {
      const { container } = render(
        <ProductCompareTable products={mockProducts} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test("CompareTableHeaderにアクセシビリティ違反がない (Requirement 7.1)", async () => {
      const mockOnSort = jest.fn();
      const { container } = render(
        <table>
          <thead>
            <CompareTableHeader
              products={mockProducts}
              onSort={mockOnSort}
              sortBy="score"
              sortDirection="desc"
            />
          </thead>
        </table>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test("CompareTableRowにアクセシビリティ違反がない (Requirement 7.1)", async () => {
      const { container } = render(
        <table>
          <tbody>
            <CompareTableRow product={mockProducts[0]} index={0} />
          </tbody>
        </table>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test("ScoreSummaryRowにアクセシビリティ違反がない (Requirement 7.1)", async () => {
      const { container } = render(
        <table>
          <tbody>
            <ScoreSummaryRow
              summary={mockScoreSummary}
              products={mockProducts}
            />
          </tbody>
        </table>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test("WarningHighlightにアクセシビリティ違反がない (Requirement 7.1)", async () => {
      const { container } = render(
        <WarningHighlight warning={mockProducts[0].warnings[0]} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Integration Testing", () => {
    test("全コンポーネントが統合された状態でアクセシビリティ要件を満たす", async () => {
      const mockOnSort = jest.fn();
      const { container } = render(
        <div>
          <CompareControls onSort={mockOnSort} />
          <ProductCompareTable
            products={mockProducts}
            onSort={mockOnSort}
            sortBy="score"
            sortDirection="desc"
          />
        </div>,
      );

      // 統合されたコンポーネントのaxeテスト
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // 基本的なアクセシビリティ要件の確認
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
      expect(screen.getAllByRole("rowheader").length).toBe(mockProducts.length);
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
});
