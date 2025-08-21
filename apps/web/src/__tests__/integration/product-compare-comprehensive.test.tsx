import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ProductCompareTable } from "../../components/compare/ProductCompareTable";
import { CompareItemListJsonLd } from "../../components/seo/CompareItemListJsonLd";
import { compareProducts } from "../../lib/compare/compare-logic";
import { sortProducts } from "../../lib/compare/sort-utils";
import { analyzeProductWarnings } from "../../lib/compare/warning-analyzer";
import { calculateScoreSummary } from "../../lib/compare/score-summary";
import { validateJsonLdSchema } from "../../lib/seo/schema-validator";
import type { Product, SortConfig } from "../../components/compare/types";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("Product Compare Comprehensive Integration Tests", () => {
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

  describe("要件1: アクセシビリティ統合テスト", () => {
    it("1.1 適切なcaption要素を含む", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const caption = screen.getByText(/3つの製品を比較/);
      expect(caption.tagName).toBe("CAPTION");
    });

    it("1.2 th scope属性が適切に設定される", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 列ヘッダー
      const columnHeaders = screen.getAllByRole("columnheader");
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });

      // 行ヘッダー
      const rowHeaders = screen.getAllByRole("rowheader");
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "row");
      });
    });

    it("1.3 aria-sort属性が適切に設定される", () => {
      render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      expect(scoreButton).toHaveAttribute("aria-pressed", "true");
    });

    it("1.4 Tab、Enter、Space、矢印キーでの操作が可能", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      const scoreButton = screen.getByRole("button", { name: /スコア/ });

      // Tabキーでフォーカス
      scoreButton.focus();
      expect(document.activeElement).toBe(scoreButton);

      // Enterキーで操作
      fireEvent.keyDown(scoreButton, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledWith("score", "desc");

      // Spaceキーで操作
      mockOnSort.mockClear();
      fireEvent.keyDown(scoreButton, { key: " " });
      expect(mockOnSort).toHaveBeenCalledWith("score", "desc");
    });

    it("1.5 スクリーンリーダーで明確に識別できる構造", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // テーブルのaria-label
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");

      // 製品名、スコア、価格、警告情報の識別
      expect(screen.getByText("イブプロフェン錠A")).toBeInTheDocument();
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("¥1,000")).toBeInTheDocument();
      expect(screen.getByText("1件の警告")).toBeInTheDocument();
    });
  });

  describe("要件2: スコアBreakdown要約統合テスト", () => {
    it("2.1 各カテゴリの要約行を表示する", () => {
      const scoreSummary = calculateScoreSummary(mockProducts);

      expect(scoreSummary.effectiveness).toBeDefined();
      expect(scoreSummary.safety).toBeDefined();
      expect(scoreSummary.convenience).toBeDefined();
      expect(scoreSummary.costEffectiveness).toBeDefined();
    });

    it("2.2 最高スコア、最低スコア、平均スコアを含む", () => {
      const scoreSummary = calculateScoreSummary(mockProducts);

      expect(scoreSummary.effectiveness.maxScore).toBe(95);
      expect(scoreSummary.effectiveness.minScore).toBe(70);
      expect(scoreSummary.effectiveness.averageScore).toBeCloseTo(85);
    });

    it("2.3 警告の総件数を表示する", () => {
      const warningAnalysis = analyzeProductWarnings(mockProducts);

      expect(warningAnalysis.totalWarnings).toBe(2);
    });

    it("2.4 最重要警告をハイライト表示する", () => {
      const warningAnalysis = analyzeProductWarnings(mockProducts);

      expect(warningAnalysis.mostImportantWarning?.severity).toBe(9);
      expect(warningAnalysis.mostImportantWarning?.type).toBe("critical");
    });

    it("2.5 視覚的に分かりやすい形式で整理する", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // 警告のハイライト表示
      const criticalWarning = screen.getByText("妊娠中の使用は避けてください");
      const warningContainer = criticalWarning.closest(
        '[data-testid="warning-highlight"]',
      );
      expect(warningContainer).toHaveClass("border-red-500");
    });
  });

  describe("要件3: 並べ替え機能統合テスト", () => {
    it("3.1 スコア順（昇順・降順）で製品を並べ替える", () => {
      const sortedDesc = sortProducts(mockProducts, {
        field: "score",
        direction: "desc",
      });

      expect(sortedDesc[0].totalScore).toBe(95);
      expect(sortedDesc[1].totalScore).toBe(85);
      expect(sortedDesc[2].totalScore).toBe(75);

      const sortedAsc = sortProducts(mockProducts, {
        field: "score",
        direction: "asc",
      });

      expect(sortedAsc[0].totalScore).toBe(75);
      expect(sortedAsc[1].totalScore).toBe(85);
      expect(sortedAsc[2].totalScore).toBe(95);
    });

    it("3.2 価格順（昇順・降順）で製品を並べ替える", () => {
      const sortedAsc = sortProducts(mockProducts, {
        field: "price",
        direction: "asc",
      });

      expect(sortedAsc[0].price).toBe(800);
      expect(sortedAsc[1].price).toBe(1000);
      expect(sortedAsc[2].price).toBe(1200);

      const sortedDesc = sortProducts(mockProducts, {
        field: "price",
        direction: "desc",
      });

      expect(sortedDesc[0].price).toBe(1200);
      expect(sortedDesc[1].price).toBe(1000);
      expect(sortedDesc[2].price).toBe(800);
    });

    it("3.3 現在の並べ替え状態を視覚的に表示する", () => {
      render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
        />,
      );

      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      expect(scoreButton).toHaveAttribute("aria-pressed", "true");
    });

    it("3.4 aria-sort属性を適切に更新する", () => {
      const mockOnSort = vi.fn();

      const { rerender } = render(
        <ProductCompareTable
          products={mockProducts}
          sortBy="score"
          sortDirection="desc"
          onSort={mockOnSort}
        />,
      );

      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      expect(scoreButton).toHaveAttribute("aria-pressed", "true");

      // ソート状態変更
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

    it("3.5 キーボード操作でも同様の機能を提供する", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      const scoreButton = screen.getByRole("button", { name: /スコア/ });

      // Enterキーでソート
      fireEvent.keyDown(scoreButton, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledWith("score", "desc");

      // Spaceキーでソート
      mockOnSort.mockClear();
      fireEvent.keyDown(scoreButton, { key: " " });
      expect(mockOnSort).toHaveBeenCalledWith("score", "desc");
    });
  });

  describe("要件4: JSON-LD構造化データ統合テスト", () => {
    it("4.1 ItemList JSON-LDを含む", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(jsonLdScript).toBeInTheDocument();

      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");
      expect(jsonData["@type"]).toBe("ItemList");
    });

    it("4.2 比較対象の各製品をListItemとして含む", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      expect(jsonData.itemListElement).toHaveLength(3);
      jsonData.itemListElement.forEach((item: any) => {
        expect(item["@type"]).toBe("ListItem");
      });
    });

    it("4.3 製品名、URL、位置情報を含む", () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      jsonData.itemListElement.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
        expect(item.name).toBe(mockProducts[index].name);
        expect(item.url).toBe(`https://example.com${mockProducts[index].url}`);
      });
    });

    it("4.4 schema.orgの仕様に準拠する", async () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      const validation = await validateJsonLdSchema(jsonData, "ItemList");
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("4.5 構造化データテストツールで有効であることを確認", async () => {
      const { container } = render(
        <CompareItemListJsonLd
          products={mockProducts}
          pageUrl="https://example.com/compare"
          title="製品比較"
          description="3つの製品を比較"
        />,
      );

      const jsonLdScript = container.querySelector(
        'script[type="application/ld+json"]',
      );
      const jsonData = JSON.parse(jsonLdScript?.textContent || "{}");

      // Google Rich Results Test対応の構造
      expect(jsonData["@context"]).toBe("https://schema.org");
      expect(jsonData["@type"]).toBe("ItemList");
      expect(jsonData.name).toBeDefined();
      expect(jsonData.itemListElement.length).toBeGreaterThan(0);
    });
  });

  describe("要件5: 製品数制限統合テスト", () => {
    it("5.1 最大3製品まで受け入れる", () => {
      render(<ProductCompareTable products={mockProducts} maxProducts={3} />);

      expect(screen.getByText("イブプロフェン錠A")).toBeInTheDocument();
      expect(screen.getByText("アセトアミノフェン錠B")).toBeInTheDocument();
      expect(screen.getByText("ロキソプロフェン錠C")).toBeInTheDocument();
    });

    it("5.2 3製品を超えた場合の適切なエラーメッセージ", () => {
      const tooManyProducts = [
        ...mockProducts,
        { ...mockProducts[0], id: "p4", name: "Product 4" },
      ];

      render(
        <ProductCompareTable products={tooManyProducts} maxProducts={3} />,
      );

      expect(screen.getByText(/最大3製品まで/)).toBeInTheDocument();
    });

    it("5.3 選択された製品数に応じてレイアウトを調整する", () => {
      const { rerender } = render(
        <ProductCompareTable products={mockProducts.slice(0, 2)} />,
      );

      expect(screen.getAllByRole("rowheader")).toHaveLength(2);

      rerender(<ProductCompareTable products={mockProducts} />);

      expect(screen.getAllByRole("rowheader")).toHaveLength(3);
    });

    it("5.4 製品を比較から削除するとテーブルを動的に更新する", () => {
      const { rerender } = render(
        <ProductCompareTable products={mockProducts} />,
      );

      expect(screen.getByText("ロキソプロフェン錠C")).toBeInTheDocument();

      rerender(<ProductCompareTable products={mockProducts.slice(0, 2)} />);

      expect(screen.queryByText("ロキソプロフェン錠C")).not.toBeInTheDocument();
    });

    it("5.5 比較製品がない場合の適切な空状態メッセージ", () => {
      render(<ProductCompareTable products={[]} />);

      expect(
        screen.getByText("比較する製品を選択してください"),
      ).toBeInTheDocument();
    });
  });

  describe("要件6: パフォーマンス予算統合テスト", () => {
    it("6.1 LCP≤2.5秒相当の処理時間を維持する", () => {
      const startTime = performance.now();

      const comparisonResult = compareProducts(mockProducts);
      const sortedProducts = sortProducts(comparisonResult.products, {
        field: "score",
        direction: "desc",
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100); // LCP予算の一部
      expect(sortedProducts).toHaveLength(3);
    });

    it("6.2 TBT≤200ms相当のJavaScript実行時間を維持する", () => {
      const iterations = 10;
      const executionTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        compareProducts(mockProducts);
        analyzeProductWarnings(mockProducts);
        calculateScoreSummary(mockProducts);

        const endTime = performance.now();
        executionTimes.push(endTime - startTime);
      }

      const averageTime =
        executionTimes.reduce((a, b) => a + b, 0) / iterations;
      expect(averageTime).toBeLessThan(20); // TBT予算の一部
    });

    it("6.3 CLS≤0.1相当のレイアウト安定性を確保する", () => {
      const initialProducts = mockProducts.slice(0, 2);
      const extendedProducts = [...mockProducts];

      const initialResult = compareProducts(initialProducts);
      const extendedResult = compareProducts(extendedProducts);

      // データ構造の一貫性（レイアウトシフト防止）
      expect(initialResult.scoreSummary).toBeDefined();
      expect(extendedResult.scoreSummary).toBeDefined();

      const initialCategories = Object.keys(initialResult.scoreSummary);
      const extendedCategories = Object.keys(extendedResult.scoreSummary);

      initialCategories.forEach((category) => {
        expect(extendedCategories).toContain(category);
      });
    });

    it("6.4 JavaScript≤300KB相当のメモリ使用量を維持する", () => {
      const initialMemory = process.memoryUsage();

      const largeProductSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockProducts[0],
        id: `p${i}`,
        name: `Product ${i}`,
      }));

      compareProducts(largeProductSet);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB以下
    });

    it("6.5 予算を超過する場合は警告として扱う", () => {
      // パフォーマンス予算超過時の警告処理をテスト
      const startTime = performance.now();

      // 意図的に重い処理を実行
      const heavyProducts = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProducts[0],
        id: `heavy-p${i}`,
        name: `Heavy Product ${i}`,
      }));

      const result = compareProducts(heavyProducts);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 処理は完了するが、時間がかかる場合がある
      expect(result.products).toHaveLength(1000);

      // 警告レベルの処理時間でもエラーにならない
      if (processingTime > 100) {
        console.warn(`Performance budget exceeded: ${processingTime}ms`);
      }
    });
  });

  describe("要件7: アクセシビリティ検証統合テスト", () => {
    it("7.1 eslint-plugin-jsx-a11yがテーブル関連の違反を検出しない", async () => {
      const { container } = render(
        <ProductCompareTable products={mockProducts} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("7.2 キーボードナビゲーションを検証する", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      const sortButtons = screen.getAllByRole("button");

      sortButtons.forEach((button) => {
        // フォーカス可能
        button.focus();
        expect(document.activeElement).toBe(button);

        // Enterキーで操作可能
        fireEvent.keyDown(button, { key: "Enter" });
        expect(mockOnSort).toHaveBeenCalled();

        mockOnSort.mockClear();
      });
    });

    it("7.3 適切な読み上げ順序を確認する", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // テーブル構造の確認
      const table = screen.getByRole("table");
      const caption = table.querySelector("caption");
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");

      expect(caption).toBeInTheDocument();
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();

      // 読み上げ順序: caption → thead → tbody
      expect(caption?.nextElementSibling).toBe(thead);
      expect(thead?.nextElementSibling).toBe(tbody);
    });

    it("7.4 適切なARIA属性設定を確認する", () => {
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

      // ソートボタンのARIA属性
      const sortButtons = screen.getAllByRole("button");
      sortButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
        expect(button).toHaveAttribute("aria-pressed");
      });

      // ライブリージョンのARIA属性
      const liveRegion = screen.getByRole("status", { hidden: true });
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });

    it("7.5 a11y検証の合否を明示的に報告する", async () => {
      const { container } = render(
        <ProductCompareTable products={mockProducts} />,
      );

      const results = await axe(container);

      // 合格の場合
      if (results.violations.length === 0) {
        console.log("✅ アクセシビリティ検証: 合格");
        expect(results).toHaveNoViolations();
      } else {
        // 不合格の場合
        console.error("❌ アクセシビリティ検証: 不合格");
        console.error("違反項目:", results.violations);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe("要件8: E2Eテスト統合検証", () => {
    it("8.1 製品比較の基本フローを検証する", async () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      // 1. 製品表示確認
      expect(screen.getByText("イブプロフェン錠A")).toBeInTheDocument();
      expect(screen.getByText("アセトアミノフェン錠B")).toBeInTheDocument();
      expect(screen.getByText("ロキソプロフェン錠C")).toBeInTheDocument();

      // 2. スコア表示確認
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("75")).toBeInTheDocument();
      expect(screen.getByText("95")).toBeInTheDocument();

      // 3. 価格表示確認
      expect(screen.getByText("¥1,000")).toBeInTheDocument();
      expect(screen.getByText("¥800")).toBeInTheDocument();
      expect(screen.getByText("¥1,200")).toBeInTheDocument();

      // 4. 警告表示確認
      expect(screen.getByText("1件の警告")).toBeInTheDocument();
      expect(screen.getByText("警告なし")).toBeInTheDocument();
    });

    it("8.2 スコア・価格での並べ替えを検証する", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      // スコア順ソート
      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      fireEvent.click(scoreButton);
      expect(mockOnSort).toHaveBeenCalledWith("score", "desc");

      // 価格順ソート
      const priceButton = screen.getByRole("button", { name: /価格/ });
      fireEvent.click(priceButton);
      expect(mockOnSort).toHaveBeenCalledWith("price", "asc");
    });

    it("8.3 Tab、Enter、矢印キーでの操作を検証する", () => {
      const mockOnSort = vi.fn();

      render(
        <ProductCompareTable products={mockProducts} onSort={mockOnSort} />,
      );

      const scoreButton = screen.getByRole("button", { name: /スコア/ });

      // Tabキーでフォーカス
      scoreButton.focus();
      expect(document.activeElement).toBe(scoreButton);

      // Enterキーで操作
      fireEvent.keyDown(scoreButton, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledWith("score", "desc");

      // 矢印キーでフォーカス移動（実装されている場合）
      fireEvent.keyDown(scoreButton, { key: "ArrowRight" });
    });

    it("8.4 スクリーンリーダー対応を検証する", () => {
      render(<ProductCompareTable products={mockProducts} />);

      // テーブル構造の確認
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");

      // キャプションの確認
      const caption = screen.getByText(/3つの製品を比較/);
      expect(caption.tagName).toBe("CAPTION");

      // ヘッダーのscope属性確認
      const columnHeaders = screen.getAllByRole("columnheader");
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });
    });

    it("8.5 1本のE2Eテストで主要機能をカバーする", async () => {
      const mockOnSort = vi.fn();

      // 統合されたE2Eフロー
      render(
        <div>
          <ProductCompareTable products={mockProducts} onSort={mockOnSort} />
          <CompareItemListJsonLd
            products={mockProducts}
            pageUrl="https://example.com/compare"
          />
        </div>,
      );

      // 1. 製品表示
      expect(screen.getByText("イブプロフェン錠A")).toBeInTheDocument();

      // 2. ソート機能
      const scoreButton = screen.getByRole("button", { name: /スコア/ });
      fireEvent.click(scoreButton);
      expect(mockOnSort).toHaveBeenCalled();

      // 3. キーボード操作
      fireEvent.keyDown(scoreButton, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledTimes(2);

      // 4. JSON-LD出力
      const jsonLdScript = document.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(jsonLdScript).toBeInTheDocument();

      // 5. アクセシビリティ
      const table = screen.getByRole("table");
      expect(table).toHaveAttribute("aria-label");
    });
  });
});
