import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CompareTableRow } from "../CompareTableRow";
import type { Product } from "../types";

const mockProduct: Product = {
  id: "1",
  name: "Test Product",
  price: 1500,
  totalScore: 85.5,
  scoreBreakdown: {
    効果: 90,
    安全性: 85,
    コスト: 80,
  },
  warnings: [
    {
      id: "w1",
      type: "critical",
      category: "副作用",
      message: "重要な副作用",
      severity: 8,
      productId: "1",
    },
    {
      id: "w2",
      type: "warning",
      category: "注意",
      message: "軽微な注意事項",
      severity: 3,
      productId: "1",
    },
  ],
  url: "https://example.com/product",
  imageUrl: "https://example.com/image.jpg",
};

// Helper to render row within proper table structure
const renderTableRow = (product: Product, index = 0) => {
  return render(
    <table>
      <tbody>
        <CompareTableRow product={product} index={index} />
      </tbody>
    </table>,
  );
};

describe("CompareTableRow", () => {
  it("製品情報を適切に表示する", () => {
    renderTableRow(mockProduct);

    // Should display product name
    expect(screen.getByText("Test Product")).toBeInTheDocument();

    // Should display formatted score
    expect(screen.getByText("85.5")).toBeInTheDocument();

    // Should display formatted price
    const priceElements = screen.getAllByText((content, element) => {
      return element?.textContent === "￥1,500";
    });
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('scope="row"属性が設定される', () => {
    renderTableRow(mockProduct);

    // Product name cell should have scope="row"
    const productNameCell = screen.getByRole("rowheader");
    expect(productNameCell).toHaveAttribute("scope", "row");
    expect(productNameCell).toHaveTextContent("Test Product");
  });

  it("警告情報を適切に表示する", () => {
    renderTableRow(mockProduct);

    // Should show warning count in compact mode (just "2件")
    expect(screen.getByText("2件")).toBeInTheDocument();

    // Should show most important warning highlighted
    expect(screen.getByText("副作用")).toBeInTheDocument();

    // Should have proper aria-label for warning count
    expect(screen.getByLabelText("警告 2 件")).toBeInTheDocument();
  });

  it("警告がない場合の表示", () => {
    const productWithoutWarnings: Product = {
      ...mockProduct,
      warnings: [],
    };

    renderTableRow(productWithoutWarnings);

    // Should show no warnings message
    expect(screen.getByText("✓ 警告なし")).toBeInTheDocument();
  });

  it("製品画像を表示する", () => {
    renderTableRow(mockProduct);

    // Should display product image
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(image).toHaveAttribute("alt", "");
  });

  it("製品リンクを表示する", () => {
    renderTableRow(mockProduct);

    // Should display product link
    const link = screen.getByRole("link", { name: "詳細を見る" });
    expect(link).toHaveAttribute("href", "https://example.com/product");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("アクセシブルな説明を提供する", () => {
    renderTableRow(mockProduct);

    // Should have accessible description
    const description = screen.getByText(
      /Test Product、総合スコア85.5点、価格￥1,500、警告2件/,
    );
    expect(description).toHaveClass("sr-only");
  });
});
