import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProductCompareTable } from "../ProductCompareTable";
import type { Product } from "../types";

// Mock products for testing
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Product A",
    price: 1000,
    totalScore: 85.5,
    scoreBreakdown: {
      効果: 90,
      安全性: 85,
      コスト: 80,
    },
    warnings: [
      {
        id: "w1",
        type: "warning",
        category: "副作用",
        message: "軽微な副作用の可能性",
        severity: 3,
        productId: "1",
      },
    ],
    url: "https://example.com/product-a",
  },
  {
    id: "2",
    name: "Product B",
    price: 1500,
    totalScore: 92.0,
    scoreBreakdown: {
      効果: 95,
      安全性: 90,
      コスト: 85,
    },
    warnings: [],
    url: "https://example.com/product-b",
  },
  {
    id: "3",
    name: "Product C",
    price: 800,
    totalScore: 78.5,
    scoreBreakdown: {
      効果: 75,
      安全性: 80,
      コスト: 85,
    },
    warnings: [
      {
        id: "w2",
        type: "critical",
        category: "禁忌",
        message: "特定条件下で使用禁止",
        severity: 8,
        productId: "3",
      },
      {
        id: "w3",
        type: "info",
        category: "注意",
        message: "使用前に医師に相談",
        severity: 2,
        productId: "3",
      },
    ],
    url: "https://example.com/product-c",
  },
];

describe("ProductCompareTable", () => {
  it("最大3製品まで表示する", () => {
    render(<ProductCompareTable products={mockProducts} />);

    // All 3 products should be displayed (check by product names in the table)
    const table = screen.getByRole("table");
    expect(table).toHaveTextContent("Product A");
    expect(table).toHaveTextContent("Product B");
    expect(table).toHaveTextContent("Product C");

    // Should have 3 product rows + 3 summary rows = 6 total rows with headers
    const productRows = screen.getAllByRole("rowheader");
    expect(productRows).toHaveLength(6); // 3 products + 3 score summaries
  });

  it("適切なテーブル構造を生成する", () => {
    render(<ProductCompareTable products={mockProducts} />);

    // Table should have proper structure
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Should have caption
    const caption = screen.getByText(/3製品の比較テーブル/);
    expect(caption).toBeInTheDocument();

    // Should have column headers (check within table context)
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders).toHaveLength(4);
    expect(columnHeaders[0]).toHaveTextContent("製品名");
    expect(columnHeaders[1]).toHaveTextContent("総合スコア");
    expect(columnHeaders[2]).toHaveTextContent("価格");
    expect(columnHeaders[3]).toHaveTextContent("警告");
  });

  it("アクセシビリティ属性が正しく設定される", () => {
    render(<ProductCompareTable products={mockProducts} />);

    // Table should have proper ARIA attributes
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-label", "製品比較テーブル");

    // Column headers should have scope="col"
    const columnHeaders = screen.getAllByRole("columnheader");
    columnHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });

    // Row headers should have scope="row"
    const rowHeaders = screen.getAllByRole("rowheader");
    rowHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "row");
    });
  });

  it("並べ替え機能が正常に動作する", () => {
    const mockOnSort = vi.fn();
    render(
      <ProductCompareTable
        products={mockProducts}
        onSort={mockOnSort}
        sortBy="name"
        sortDirection="asc"
      />,
    );

    // Click on score sort button in CompareControls (not table header)
    const scoreButtons = screen.getAllByLabelText(/スコア/);
    const controlsScoreButton = scoreButtons.find(
      (button) =>
        button.textContent?.includes("スコア") &&
        !button.textContent?.includes("総合"),
    );
    expect(controlsScoreButton).toBeInTheDocument();
    fireEvent.click(controlsScoreButton!);

    expect(mockOnSort).toHaveBeenCalledWith("score", "desc");

    // Click on price sort button in CompareControls
    const priceButtons = screen.getAllByLabelText(/価格/);
    const controlsPriceButton = priceButtons.find(
      (button) => button.getAttribute("aria-pressed") === "false",
    );
    expect(controlsPriceButton).toBeInTheDocument();
    fireEvent.click(controlsPriceButton!);

    expect(mockOnSort).toHaveBeenCalledWith("price", "asc");
  });

  it("キーボードナビゲーションが機能する", () => {
    render(<ProductCompareTable products={mockProducts} />);

    const table = screen.getByRole("table");

    // Test arrow key navigation
    fireEvent.keyDown(table, { key: "ArrowDown" });
    fireEvent.keyDown(table, { key: "ArrowRight" });
    fireEvent.keyDown(table, { key: "ArrowUp" });
    fireEvent.keyDown(table, { key: "ArrowLeft" });

    // Should not throw errors
    expect(table).toBeInTheDocument();
  });

  it("空状態を適切に表示する", () => {
    render(<ProductCompareTable products={[]} />);

    expect(
      screen.getByText("比較する製品を選択してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("最大3製品まで比較できます")).toBeInTheDocument();
  });

  it("スコア要約行を表示する", () => {
    render(<ProductCompareTable products={mockProducts} />);

    // Should display score summary rows for each category
    expect(screen.getByText("効果 要約")).toBeInTheDocument();
    expect(screen.getByText("安全性 要約")).toBeInTheDocument();
    expect(screen.getByText("コスト 要約")).toBeInTheDocument();
  });

  it("警告情報を適切に表示する", () => {
    render(<ProductCompareTable products={mockProducts} />);

    // Product A should show 1 warning (compact mode shows "1件")
    expect(screen.getByText("1件")).toBeInTheDocument();

    // Product B should show no warnings
    expect(screen.getByText("✓ 警告なし")).toBeInTheDocument();

    // Product C should show 2 warnings (compact mode shows "2件")
    expect(screen.getByText("2件")).toBeInTheDocument();

    // Warning summary should be displayed
    expect(screen.getByText("警告サマリー")).toBeInTheDocument();
    expect(screen.getByText("合計 3 件")).toBeInTheDocument(); // Total warnings across all products
  });

  it("価格とスコアを適切にフォーマットする", () => {
    render(<ProductCompareTable products={mockProducts} />);

    // Prices should be formatted as Japanese Yen (use getAllByText for multiple matches)
    const priceElements1000 = screen.getAllByText((content, element) => {
      return element?.textContent === "￥1,000";
    });
    expect(priceElements1000.length).toBeGreaterThan(0);

    const priceElements1500 = screen.getAllByText((content, element) => {
      return element?.textContent === "￥1,500";
    });
    expect(priceElements1500.length).toBeGreaterThan(0);

    const priceElements800 = screen.getAllByText((content, element) => {
      return element?.textContent === "￥800";
    });
    expect(priceElements800.length).toBeGreaterThan(0);

    // Scores should be formatted with one decimal place
    expect(screen.getByText("85.5")).toBeInTheDocument();
    expect(screen.getByText("92.0")).toBeInTheDocument();
    expect(screen.getByText("78.5")).toBeInTheDocument();
  });
});
