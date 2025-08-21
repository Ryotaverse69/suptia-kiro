import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScoreSummaryRow } from "../ScoreSummaryRow";
import type { Product, ScoreSummary } from "../types";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Product A",
    price: 1000,
    totalScore: 85.5,
    scoreBreakdown: { 効果: 90, 安全性: 85, コスト: 80 },
    warnings: [],
    url: "https://example.com/a",
  },
  {
    id: "2",
    name: "Product B",
    price: 1500,
    totalScore: 92.0,
    scoreBreakdown: { 効果: 95, 安全性: 90, コスト: 85 },
    warnings: [],
    url: "https://example.com/b",
  },
  {
    id: "3",
    name: "Product C",
    price: 800,
    totalScore: 78.5,
    scoreBreakdown: { 効果: 75, 安全性: 80, コスト: 85 },
    warnings: [],
    url: "https://example.com/c",
  },
];

const mockSummary: ScoreSummary = {
  category: "効果",
  maxScore: 95,
  minScore: 75,
  averageScore: 86.7,
  products: [
    { productId: "1", score: 90 },
    { productId: "2", score: 95 },
    { productId: "3", score: 75 },
  ],
};

// Helper to render row within proper table structure
const renderSummaryRow = (
  summary: ScoreSummary,
  products: Product[],
  props = {},
) => {
  return render(
    <table>
      <tbody>
        <ScoreSummaryRow summary={summary} products={products} {...props} />
      </tbody>
    </table>,
  );
};

describe("ScoreSummaryRow", () => {
  it("スコア要約情報を適切に表示する", () => {
    renderSummaryRow(mockSummary, mockProducts);

    // Should display category name
    expect(screen.getByText("効果 要約")).toBeInTheDocument();

    // Should display average score
    expect(screen.getByText("平均: 86.7")).toBeInTheDocument();

    // Should display max and min scores
    expect(screen.getByText("最高: 95.0")).toBeInTheDocument();
    expect(screen.getByText("最低: 75.0")).toBeInTheDocument();
  });

  it('scope="row"属性が設定される', () => {
    renderSummaryRow(mockSummary, mockProducts);

    // Category cell should have scope="row"
    const categoryCell = screen.getByRole("rowheader");
    expect(categoryCell).toHaveAttribute("scope", "row");
    expect(categoryCell).toHaveTextContent("効果 要約");
  });

  it("最高スコア製品をハイライトする", () => {
    renderSummaryRow(mockSummary, mockProducts, { highlightBest: true });

    // Should highlight best performing product
    expect(screen.getByText("🏆 最高スコア")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByText("95.0点")).toBeInTheDocument();
  });

  it("最低スコア製品をハイライトする", () => {
    renderSummaryRow(mockSummary, mockProducts, { highlightWorst: true });

    // Should highlight worst performing product
    expect(screen.getByText("⚠ 最低スコア")).toBeInTheDocument();
    expect(screen.getByText("Product C")).toBeInTheDocument();
    expect(screen.getByText("75.0点")).toBeInTheDocument();
  });

  it("スコア範囲を表示する", () => {
    renderSummaryRow(mockSummary, mockProducts, { highlightWorst: false });

    // Should show score range when not highlighting worst
    expect(screen.getByText("範囲: 20.0点")).toBeInTheDocument();
  });

  it("アクセシブルな説明を提供する", () => {
    renderSummaryRow(mockSummary, mockProducts);

    // Should have accessible description
    const description = screen.getByText(
      /効果カテゴリのスコア要約.*最高95.0点.*最低75.0点.*平均86.7点/,
    );
    expect(description).toHaveClass("sr-only");
  });

  it("適切な背景色とスタイルを適用する", () => {
    renderSummaryRow(mockSummary, mockProducts);

    // Row should have blue background styling
    const row = screen.getByRole("row");
    expect(row).toHaveClass("bg-blue-50", "border-t-2", "border-blue-200");
  });

  it("スコアを適切にフォーマットする", () => {
    renderSummaryRow(mockSummary, mockProducts);

    // Scores should be formatted with one decimal place
    const averageElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("86.7") || false;
    });
    expect(averageElements.length).toBeGreaterThan(0); // average

    const maxElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("95.0") || false;
    });
    expect(maxElements.length).toBeGreaterThan(0); // max

    const minElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("75.0") || false;
    });
    expect(minElements.length).toBeGreaterThan(0); // min
  });
});
