import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PriceTable } from "../PriceTable";

describe("PriceTable", () => {
  const mockProduct = {
    name: "Test Product",
    priceJPY: 3000,
    servingsPerContainer: 60,
    servingsPerDay: 2,
  };

  it("正常な商品データで価格テーブルを表示する", () => {
    render(<PriceTable product={mockProduct} />);

    // Table elements
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("正規化価格テーブル")).toBeInTheDocument();

    // Table headers
    expect(screen.getByText("項目")).toBeInTheDocument();
    expect(screen.getByText("値")).toBeInTheDocument();

    // Table data
    expect(screen.getByText("実効コスト/日")).toBeInTheDocument();
    expect(screen.getByText("￥100")).toBeInTheDocument(); // (3000/60)*2 = 100

    expect(screen.getByText("継続日数")).toBeInTheDocument();
    expect(screen.getByText("30日")).toBeInTheDocument(); // 60/2 = 30

    expect(screen.getByText("1回あたりコスト")).toBeInTheDocument();
    expect(screen.getByText("￥50")).toBeInTheDocument(); // 3000/60 = 50
  });

  it("計算エラー時にエラーメッセージを表示する", () => {
    const invalidProduct = {
      name: "Invalid Product",
      priceJPY: -1000, // Invalid price
      servingsPerContainer: 60,
      servingsPerDay: 2,
    };

    render(<PriceTable product={invalidProduct} />);

    expect(screen.getByText("計算不可")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("アクセシビリティ属性が正しく設定される", () => {
    render(<PriceTable product={mockProduct} />);

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute(
      "aria-label",
      "Test Productの価格情報テーブル",
    );

    // Column headers
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveAttribute("scope", "col");
    expect(headers[1]).toHaveAttribute("scope", "col");
    expect(headers[1]).toHaveAttribute("aria-sort", "none");

    // Screen reader labels
    expect(screen.getByLabelText("1日あたり100円")).toBeInTheDocument();
    expect(screen.getByLabelText("30日間継続可能")).toBeInTheDocument();
    expect(screen.getByLabelText("1回あたり50円")).toBeInTheDocument();
  });

  it("カスタムクラス名が適用される", () => {
    const { container } = render(
      <PriceTable product={mockProduct} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("ゼロ除算エラーを適切に処理する", () => {
    const zeroProduct = {
      name: "Zero Product",
      priceJPY: 3000,
      servingsPerContainer: 0, // This will cause division by zero
      servingsPerDay: 2,
    };

    render(<PriceTable product={zeroProduct} />);

    expect(screen.getByText("計算不可")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("計算エラー"),
    );
  });

  it("レスポンシブデザインクラスが適用される", () => {
    const { container } = render(<PriceTable product={mockProduct} />);

    const tableContainer = container.querySelector(".overflow-x-auto");
    expect(tableContainer).toBeInTheDocument();
  });
});
