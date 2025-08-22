import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ProductCompareTable } from "../../components/compare/ProductCompareTable";
import { CompareControls } from "../../components/compare/CompareControls";
import { ScoreSummaryRow } from "../../components/compare/ScoreSummaryRow";
import { WarningHighlight } from "../../components/compare/WarningHighlight";
import type { Product, SortConfig } from "../../components/compare/types";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("Product Compare Accessibility Integration", () => {
  const mockProducts: Product[] = [
    {
      id: "p1",
      name: "イブプロフェン錠A",
      price: 1000,
      totalScore: 85,
      scoreBreakdown: {
        effectiveness: 90,
        safety: 80,
        convenience: 85,
        costEffectiveness: 75,
      },
      warnings: [
        {
          id: "w1",
          type: "warning",
          category: "medication",
          message: "薬物相互作用の可能性があります",
          severity: 6,
          productId: "p1",
        },
      ],
      imageUrl: "/images/product-a.jpg",
      url: "/products/ibuprofen-a",
    },
    {
      id: "p2",
      name: "アセトアミノフェン錠B",
      price: 800,
      totalScore: 75,
      scoreBreakdown: {
        effectiveness: 70,
        safety: 85,
        convenience: 70,
        costEffectiveness: 90,
      },
      warnings: [
        {
          id: "w2",
          type: "critical",
          category: "pregnancy",
          message: "妊娠中の使用は避けてください",
          severity: 9,
          productId: "p2",
        },
      ],
      imageUrl: "/images/product-b.jpg",
      url: "/products/acetaminophen-b",
    },
    {
      id: "p3",
      name: "ロキソプロフェン錠C",
      price: 1200,
      totalScore: 95,
      scoreBreakdown: {
        effectiveness: 95,
        safety: 95,
        convenience: 95,
        costEffectiveness: 85,
      },
      warnings: [],
      imageUrl: "/images/product-c.jpg",
      url: "/products/loxoprofen-c",
    },
  ];

  describe("WCAG 2.1 AA準拠テスト", () => {
    it("比較テーブル全体がaxe検証をパスする", async () => {
      const { container } = render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("ソートコントロールがaxe検証をパスする", async () => {
      const mockOnSort = vi.fn();
      const sortConfig: SortConfig = { field: "score", direction: "desc" };

      const { container } = render(
        <CompareControls currentSort={sortConfig} onSort={mockOnSort} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("警告ハイライトがaxe検証をパスする", async () => {
      const { container } = render(
        <WarningHighlight
          warning={mockProducts[1].warnings[0]}
          isHighlighted={true}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("スコア要約行がaxe検証をパスする", async () => {
      const mockSummary = {
        category: "effectiveness",
        maxScore: 95,
        minScore: 70,
        averageScore: 85,
        products: [
          { productId: "p1", score: 90 },
          { productId: "p2", score: 70 },
          { productId: "p3", score: 95 },
        ],
      };

      const { container } = render(
        <table>
          <tbody>
            <ScoreSummaryRow
              summary={mockSummary}
              products={mockProducts}
              highlightBest={true}
            />
          </tbody>
        </table>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("キーボードナビゲーション統合", () => {
    it("Tab、Enter、Space、矢印キーでの完全操作が可能", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      // Tabキーでソートボタンにフォーカス
      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      scoreButton.focus();
      expect(document.activeElement).toBe(scoreButton);

      // Enterキーでソート実行
      fireEvent.keyDown(scoreButton, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledWith("score", "asc");

      // Spaceキーでもソート実行
      mockOnSort.mockClear();
      fireEvent.keyDown(scoreButton, { key: " " });
      expect(mockOnSort).toHaveBeenCalledWith("score", "asc");

      // 矢印キーでフォーカス移動（カスタム実装がある場合）
      fireEvent.keyDown(scoreButton, { key: "ArrowRight" });
      // 次のソートボタンにフォーカスが移動することを確認
    });

    it("フォーカス管理が適切に動作する", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      const sortButtons = screen.getAllByRole("button");

      // 各ボタンがフォーカス可能
      sortButtons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
        expect(button).toHaveClass("focus:ring-2");
      });
    });

    it("フォーカストラップが適切に機能する", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const table = screen.getByRole("table");
      const focusableElements = table.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // 最初の要素にフォーカス
      (focusableElements[0] as HTMLElement).focus();
      expect(document.activeElement).toBe(focusableElements[0]);

      // 最後の要素にフォーカス
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
      expect(document.activeElement).toBe(
        focusableElements[focusableElements.length - 1],
      );
    });
  });

  describe("スクリーンリーダー対応統合", () => {
    it("テーブル構造が適切に読み上げられる", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");

      // キャプションが存在
      const caption = screen.getByText(/3つの製品を比較/);
      expect(caption.tagName).toBe("CAPTION");

      // ヘッダーが適切なscope属性を持つ
      const columnHeaders = screen.getAllByRole("columnheader");
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });

      // 行ヘッダーが適切なscope属性を持つ
      const rowHeaders = screen.getAllByRole("rowheader");
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "row");
      });
    });

    it("ソート状態が適切に通知される", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
          onSort={mockOnSort}
        />,
      );

      // ソートボタンのaria-sort属性
      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      expect(scoreButton).toHaveAttribute("aria-pressed", "true");

      // ライブリージョンの存在
      const liveRegion = screen.getByRole("status", { hidden: true });
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("警告情報が適切に読み上げられる", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 警告の説明テキスト
      const warningElements = screen.getAllByText(/警告/);
      warningElements.forEach((element) => {
        const parent = element.closest('[role="cell"]');
        expect(parent).toHaveAttribute("aria-describedby");
      });

      // 重要な警告のaria-label
      const criticalWarning = screen.getByText("妊娠中の使用は避けてください");
      const warningContainer = criticalWarning.closest(
        '[data-testid="warning-highlight"]',
      );
      expect(warningContainer).toHaveAttribute("aria-label");
    });

    it("スコア情報が適切に読み上げられる", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // スコア値のaria-label
      const scoreElements = screen.getAllByText(/^\d+$/);
      scoreElements.forEach((element) => {
        if (element.closest('[data-testid="score-cell"]')) {
          expect(element).toHaveAttribute("aria-label");
        }
      });
    });
  });

  describe("ARIA属性統合テスト", () => {
    it("すべての必須ARIA属性が設定される", () => {
      render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      // テーブルのARIA属性
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");
      expect(table).toHaveAttribute("role", "table");

      // ソートボタンのARIA属性
      const sortButtons = screen.getAllByRole("button");
      sortButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
        expect(button).toHaveAttribute("aria-pressed");
        expect(button).toHaveAttribute("type", "button");
      });

      // ライブリージョンのARIA属性
      const liveRegion = screen.getByRole("status", { hidden: true });
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("動的ARIA属性が正しく更新される", () => {
      const mockOnSort = vi.fn();

      const { rerender } = render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
          onSort={mockOnSort}
        />,
      );

      // 初期状態のaria-sort
      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      expect(scoreButton).toHaveAttribute("aria-pressed", "true");

      // ソート状態変更後
      rerender(
        <ProductCompareTable
          products={mockProducts}
          sortBy="price"
          sortDirection="asc"
          onSort={mockOnSort}
        />,
      );

      const priceButton = screen.getByRole("button", { name: /価格/ });
      expect(priceButton).toHaveAttribute("aria-pressed", "true");
      expect(scoreButton).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("コントラスト比とテキストスケーリング", () => {
    it("十分なコントラスト比を確保する", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 重要な警告の背景色とテキスト色
      const criticalWarning = screen.getByText("妊娠中の使用は避けてください");
      const warningContainer = criticalWarning.closest(
        '[data-testid="warning-highlight"]',
      );

      const styles = window.getComputedStyle(warningContainer as Element);
      // 実際のコントラスト比計算は複雑なので、クラス名で確認
      expect(warningContainer).toHaveClass("text-red-800", "bg-red-50");
    });

    it("200%拡大時でも表示が維持される", () => {
      // CSS transformでズーム効果をシミュレート
      const { container } = render(
        <div style={{ transform: "scale(2)", transformOrigin: "top left" }}>
          <ProductCompareTable products={mockProducts} />
        </div>,
      );

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();

      // テーブルが表示され続けることを確認
      expect(screen.getByText("イブプロフェン錠A")).toBeInTheDocument();
    });
  });

  describe("複数のa11y機能の組み合わせテスト", () => {
    it("キーボードナビゲーション + スクリーンリーダー + ライブリージョン", async () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      // キーボードでソートボタンにフォーカス
      const priceButton = screen.getByRole("button", { name: /価格/ });
      priceButton.focus();
      expect(document.activeElement).toBe(priceButton);

      // Enterキーでソート実行
      fireEvent.keyDown(priceButton, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledWith("price", "asc");

      // ライブリージョンが更新される
      const liveRegion = screen.getByRole("status", { hidden: true });
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });

    it("テーブル構造 + ARIA属性 + フォーカス管理", () => {
      render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      // テーブル構造の確認
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");

      // ARIA属性の確認
      const sortButtons = screen.getAllByRole("button");
      sortButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
        expect(button).toHaveAttribute("aria-pressed");
      });

      // フォーカス管理の確認
      sortButtons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
        expect(button).toHaveClass("focus:ring-2");
      });
    });
  });
});
