/**
 * Enhanced Price Table Component Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PriceTable } from "../PriceTable";
import type { NormalizedPrice } from "@/lib/pricing/price-normalizer";
import type { CostPerDay } from "@/lib/pricing/cost-calculator";

describe("PriceTable", () => {
  let mockPrices: NormalizedPrice[];
  let mockCosts: CostPerDay[];

  beforeEach(() => {
    mockPrices = [
      {
        productId: "test-product-1",
        source: "rakuten",
        sourceProductId: "rakuten-vitamin-d",
        basePrice: 1980,
        shippingCost: 500,
        totalPrice: 2480,
        inStock: true,
        isSubscription: false,
        lastUpdated: "2023-01-01T10:00:00Z",
        sourceUrl: "https://item.rakuten.co.jp/test/vitamin-d/",
        shopName: "HealthBrand Store",
        currency: "JPY",
        taxIncluded: true,
        metadata: {},
      },
      {
        productId: "test-product-1",
        source: "yahoo",
        sourceProductId: "yahoo-vitamin-d",
        basePrice: 1890,
        shippingCost: 300,
        totalPrice: 2190,
        inStock: true,
        isSubscription: true,
        subscriptionDiscount: 0.1,
        subscriptionInterval: "monthly",
        lastUpdated: "2023-01-01T11:00:00Z",
        sourceUrl: "https://shopping.yahoo.co.jp/products/vitamin-d/",
        shopName: "Yahoo Health Store",
        currency: "JPY",
        taxIncluded: true,
        metadata: {},
      },
    ];

    mockCosts = [
      {
        productId: "test-product-1",
        source: "rakuten",
        sourceProductId: "rakuten-vitamin-d",
        servingSize: 1,
        servingsPerContainer: 90,
        recommendedDailyIntake: 1,
        daysPerContainer: 90,
        costPerDay: 27.56,
        costPerServing: 27.56,
        costPerUnit: 27.56,
        totalPrice: 2480,
        currency: "JPY",
        calculatedAt: "2023-01-01T10:00:00Z",
        metadata: {
          unitType: "count",
          unit: "粒",
        },
      },
      {
        productId: "test-product-1",
        source: "yahoo",
        sourceProductId: "yahoo-vitamin-d",
        servingSize: 1,
        servingsPerContainer: 90,
        recommendedDailyIntake: 1,
        daysPerContainer: 90,
        costPerDay: 24.33,
        costPerServing: 24.33,
        costPerUnit: 24.33,
        totalPrice: 2190,
        currency: "JPY",
        calculatedAt: "2023-01-01T11:00:00Z",
        metadata: {
          unitType: "count",
          unit: "粒",
        },
      },
    ];
  });

  describe("Basic rendering", () => {
    it("should render price table with data", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      expect(
        screen.getByRole("region", { name: /ビタミンD 1000IUの価格比較表/ }),
      ).toBeInTheDocument();
      expect(screen.getByText("価格比較")).toBeInTheDocument();
      expect(screen.getByText("2件の価格情報")).toBeInTheDocument();
    });

    it("should display source names correctly", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      expect(screen.getByText("楽天市場")).toBeInTheDocument();
      expect(screen.getByText("Yahoo!ショッピング")).toBeInTheDocument();
    });

    it("should display prices and costs correctly", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      expect(screen.getByText("¥2,480")).toBeInTheDocument();
      expect(screen.getByText("¥2,190")).toBeInTheDocument();
    });

    it("should highlight lowest cost option", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      // Yahoo!が最安値なので、最安値バッジが表示されるはず
      expect(
        screen.getByRole("status", { name: /最安値/ }),
      ).toBeInTheDocument();
    });

    it("should show subscription indicators", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      expect(screen.getByText("定期便")).toBeInTheDocument();
      expect(screen.getByText("定期便 10%オフ")).toBeInTheDocument();
    });
  });

  describe("Sorting functionality", () => {
    it("should sort by total price", async () => {
      const mockOnSort = vi.fn();

      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          onSort={mockOnSort}
          sortBy="totalPrice"
          sortOrder="asc"
        />,
      );

      const priceHeader = screen.getByRole("button", {
        name: /価格で並べ替え/,
      });
      fireEvent.click(priceHeader);

      expect(mockOnSort).toHaveBeenCalledWith("totalPrice", "desc");
    });

    it("should sort by cost per day", async () => {
      const mockOnSort = vi.fn();

      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          onSort={mockOnSort}
          sortBy="costPerDay"
          sortOrder="asc"
        />,
      );

      const costHeader = screen.getByRole("button", {
        name: /実効コスト\/日で並べ替え/,
      });
      fireEvent.click(costHeader);

      expect(mockOnSort).toHaveBeenCalledWith("costPerDay", "desc");
    });

    it("should handle keyboard navigation for sorting", async () => {
      const mockOnSort = vi.fn();

      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          onSort={mockOnSort}
        />,
      );

      const sourceHeader = screen.getByRole("button", {
        name: /ソースで並べ替え/,
      });

      fireEvent.keyDown(sourceHeader, { key: "Enter" });
      expect(mockOnSort).toHaveBeenCalledWith("source", "asc");

      fireEvent.keyDown(sourceHeader, { key: " " });
      expect(mockOnSort).toHaveBeenCalledTimes(2);
    });
  });

  describe("Row expansion functionality", () => {
    it("should expand and collapse row details", async () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          showSourceDetails={true}
        />,
      );

      const detailButtons = screen.getAllByText("詳細");
      expect(detailButtons).toHaveLength(2);

      // Expand first row
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("コスト詳細")).toBeInTheDocument();
        expect(screen.getByText("価格詳細")).toBeInTheDocument();
        expect(screen.getByText("ショップ情報")).toBeInTheDocument();
      });

      // Collapse first row
      const closeButton = screen.getByText("閉じる");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("コスト詳細")).not.toBeInTheDocument();
      });
    });

    it("should show detailed cost breakdown in expanded view", async () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          showSourceDetails={true}
        />,
      );

      const detailButton = screen.getAllByText("詳細")[0];
      fireEvent.click(detailButton);

      await waitFor(() => {
        expect(screen.getByText("1回分コスト:")).toBeInTheDocument();
        expect(screen.getByText("継続日数:")).toBeInTheDocument();
        expect(screen.getByText("1日摂取回数:")).toBeInTheDocument();
        expect(screen.getByText("90日")).toBeInTheDocument();
        expect(screen.getByText("1回")).toBeInTheDocument();
      });
    });

    it("should show price breakdown in expanded view", async () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          showSourceDetails={true}
        />,
      );

      const detailButton = screen.getAllByText("詳細")[0];
      fireEvent.click(detailButton);

      await waitFor(() => {
        expect(screen.getByText("商品価格:")).toBeInTheDocument();
        expect(screen.getByText("送料:")).toBeInTheDocument();
        expect(screen.getByText("合計:")).toBeInTheDocument();
        expect(screen.getByText("¥1,980")).toBeInTheDocument();
        expect(screen.getByText("¥500")).toBeInTheDocument();
      });
    });
  });

  describe("Empty state handling", () => {
    it("should show empty state when no prices available", () => {
      render(
        <PriceTable prices={[]} costs={[]} productName="ビタミンD 1000IU" />,
      );

      expect(
        screen.getByText("価格情報が見つかりませんでした"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("しばらく時間をおいて再度お試しください"),
      ).toBeInTheDocument();
    });

    it("should handle mismatched prices and costs gracefully", () => {
      const mismatchedCosts = [
        {
          ...mockCosts[0],
          sourceProductId: "non-existent-product",
        },
      ];

      render(
        <PriceTable
          prices={mockPrices}
          costs={mismatchedCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      // Should only show rows where price and cost data match
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(1); // Header row only, no data rows
    });
  });

  describe("Accessibility features", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      const table = screen.getByRole("table");
      expect(table).toHaveAttribute(
        "aria-label",
        "ビタミンD 1000IUの価格比較テーブル",
      );

      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-label",
        "ビタミンD 1000IUの価格比較表",
      );
    });

    it("should have sortable headers with proper ARIA attributes", () => {
      const mockOnSort = vi.fn();

      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          onSort={mockOnSort}
          sortBy="costPerDay"
          sortOrder="asc"
        />,
      );

      const costHeader = screen.getByRole("button", {
        name: /実効コスト\/日で並べ替え/,
      });
      expect(costHeader).toHaveAttribute("aria-sort", "ascending");

      const priceHeader = screen.getByRole("button", {
        name: /価格で並べ替え/,
      });
      expect(priceHeader).toHaveAttribute("aria-sort", "none");
    });

    it("should have proper table caption", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      const caption = screen.getByText(/ビタミンD 1000IUの価格比較情報/);
      expect(caption).toBeInTheDocument();
    });

    it("should provide screen reader announcements", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      const announcement = screen.getByText(/2件の価格情報を表示中/);
      expect(announcement).toHaveClass("sr-only");
      expect(announcement).toHaveAttribute("aria-live", "polite");
    });

    it("should handle keyboard navigation for detail expansion", async () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          showSourceDetails={true}
        />,
      );

      const detailButton = screen.getAllByText("詳細")[0];

      fireEvent.keyDown(detailButton, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByText("コスト詳細")).toBeInTheDocument();
      });

      const closeButton = screen.getByText("閉じる");
      fireEvent.keyDown(closeButton, { key: " " });

      await waitFor(() => {
        expect(screen.queryByText("コスト詳細")).not.toBeInTheDocument();
      });
    });
  });

  describe("Stock status display", () => {
    it("should show out of stock indicator", () => {
      const outOfStockPrices = [
        {
          ...mockPrices[0],
          inStock: false,
        },
      ];

      render(
        <PriceTable
          prices={outOfStockPrices}
          costs={mockCosts.slice(0, 1)}
          productName="ビタミンD 1000IU"
        />,
      );

      expect(screen.getByText("在庫切れ")).toBeInTheDocument();
    });

    it("should show subscription indicator", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
        />,
      );

      expect(screen.getByText("定期便")).toBeInTheDocument();
    });
  });

  describe("Sorting behavior", () => {
    it("should sort data by cost per day by default", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          sortBy="costPerDay"
          sortOrder="asc"
        />,
      );

      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1); // Skip header row

      // Yahoo!が最安値なので最初に表示されるはず
      expect(dataRows[0]).toHaveTextContent("Yahoo!ショッピング");
      expect(dataRows[1]).toHaveTextContent("楽天市場");
    });

    it("should limit rows when maxRows is specified", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={mockCosts}
          productName="ビタミンD 1000IU"
          maxRows={1}
        />,
      );

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(2); // Header + 1 data row
    });
  });

  describe("Error handling", () => {
    it("should handle invalid URLs gracefully", () => {
      const invalidUrlPrices = [
        {
          ...mockPrices[0],
          sourceUrl: "invalid-url",
        },
      ];

      render(
        <PriceTable
          prices={invalidUrlPrices}
          costs={mockCosts.slice(0, 1)}
          productName="ビタミンD 1000IU"
          showSourceDetails={true}
        />,
      );

      const detailButton = screen.getByText("詳細");
      fireEvent.click(detailButton);

      // Should not crash and should handle invalid URL
      expect(screen.getByText("コスト詳細")).toBeInTheDocument();
    });

    it("should handle missing cost data", () => {
      render(
        <PriceTable
          prices={mockPrices}
          costs={[]} // No cost data
          productName="ビタミンD 1000IU"
        />,
      );

      expect(
        screen.getByText("価格情報が見つかりませんでした"),
      ).toBeInTheDocument();
    });

    it("should handle malformed timestamp", () => {
      const malformedTimestampPrices = [
        {
          ...mockPrices[0],
          lastUpdated: "invalid-timestamp",
        },
      ];

      render(
        <PriceTable
          prices={malformedTimestampPrices}
          costs={mockCosts.slice(0, 1)}
          productName="ビタミンD 1000IU"
        />,
      );

      // Should not crash and should show fallback
      expect(screen.getByText("不明")).toBeInTheDocument();
    });
  });

  describe("Performance considerations", () => {
    it("should handle large datasets efficiently", () => {
      const largePrices = Array.from({ length: 100 }, (_, i) => ({
        ...mockPrices[0],
        sourceProductId: `product-${i}`,
        totalPrice: 2000 + i * 10,
      }));

      const largeCosts = Array.from({ length: 100 }, (_, i) => ({
        ...mockCosts[0],
        sourceProductId: `product-${i}`,
        costPerDay: 20 + i * 0.1,
      }));

      const startTime = performance.now();

      render(
        <PriceTable
          prices={largePrices}
          costs={largeCosts}
          productName="ビタミンD 1000IU"
          maxRows={10}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);

      // Should only show maxRows
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(11); // Header + 10 data rows
    });
  });
});
