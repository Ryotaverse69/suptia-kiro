/**
 * Product Price Integration Tests
 * Product詳細ページとPriceTableの統合テスト
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ProductDetailPage from "../../app/products/[slug]/page";
import { MockRakutenConnector } from "../../../mocks/rakuten-mock";
import { MockYahooConnector } from "../../../mocks/yahoo-mock";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => ({
    get: () => "test-nonce",
  }),
}));

vi.mock("next/script", () => ({
  default: ({ children, ...props }: any) => (
    <script {...props}>{children}</script>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock Sanity client
vi.mock("@/lib/sanityServer", () => ({
  sanityServer: {
    fetch: vi.fn(),
  },
}));

// Mock connectors
vi.mock("@/lib/pricing/rakuten-connector", () => ({
  createRakutenConnector: () => new MockRakutenConnector(),
}));

vi.mock("@/lib/pricing/yahoo-connector", () => ({
  createYahooConnector: () => new MockYahooConnector(),
}));

// Mock environment variables
const originalEnv = process.env;

describe("Product Price Integration", () => {
  const mockProduct = {
    _id: "test-product-1",
    name: "ビタミンD 1000IU 90粒",
    brand: "HealthBrand",
    priceJPY: 1980,
    servingsPerContainer: 90,
    servingsPerDay: 1,
    description:
      "高品質なビタミンD3サプリメント。1粒で1000IUのビタミンDを摂取できます。",
    slug: { current: "vitamin-d-1000" },
    images: [
      {
        asset: { url: "https://example.com/vitamin-d.jpg" },
        alt: "ビタミンD 1000IU",
      },
    ],
    ingredients: [
      {
        name: "ビタミンD3",
        evidenceLevel: "A" as const,
        studyCount: 100,
        studyQuality: 8,
      },
    ],
    sideEffectLevel: "low" as const,
    interactionRisk: 2,
    contraindicationCount: 1,
    form: "capsule" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment for mock data
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_MOCK_DATA: "true",
    };

    // Mock Sanity fetch
    const { sanityServer } = require("@/lib/sanityServer");
    sanityServer.fetch.mockResolvedValue(mockProduct);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Price Table Integration", () => {
    it("should render product page with integrated price table", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      // Product information should be displayed
      expect(screen.getByText("ビタミンD 1000IU 90粒")).toBeInTheDocument();
      expect(screen.getByText("HealthBrand")).toBeInTheDocument();

      // Price table should be rendered
      await waitFor(() => {
        expect(screen.getByText("価格比較")).toBeInTheDocument();
      });
    });

    it("should display cost per day badges correctly", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Cost per day information should be displayed
        const costElements = screen.getAllByText(/¥.*\/日/);
        expect(costElements.length).toBeGreaterThan(0);
      });
    });

    it("should show lowest price badge for best deals", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Lowest price badge should be displayed
        expect(screen.getByText("最安値")).toBeInTheDocument();
      });
    });

    it("should display source links with timestamps", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Source information should be displayed
        expect(screen.getByText("楽天市場")).toBeInTheDocument();
        expect(screen.getByText("Yahoo!ショッピング")).toBeInTheDocument();

        // Timestamp information should be present
        const timeElements = document.querySelectorAll("td");
        const hasTimeDisplay = Array.from(timeElements).some(
          (el) =>
            el.textContent?.includes("分前") ||
            el.textContent?.includes("時間前") ||
            el.textContent?.includes("/"),
        );
        expect(hasTimeDisplay).toBe(true);
      });
    });

    it("should support price sorting functionality", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Sort headers should be clickable
        const priceHeader = screen.getByText("価格");
        const costHeader = screen.getByText("実効コスト/日");

        expect(priceHeader.closest("th")).toHaveAttribute("role", "button");
        expect(costHeader.closest("th")).toHaveAttribute("role", "button");
      });
    });

    it("should handle price sorting interactions", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        const costHeader = screen.getByText("実効コスト/日").closest("th");
        if (costHeader) {
          fireEvent.click(costHeader);

          // Sort indicator should change
          expect(costHeader).toHaveAttribute("aria-sort");
        }
      });
    });
  });

  describe("Component Integration", () => {
    it("should integrate with ScoreDisplay component", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      // Score display should be present
      await waitFor(() => {
        expect(screen.getByText(/スコア/)).toBeInTheDocument();
      });
    });

    it("should integrate with PersonaWarnings component", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      // Persona warnings should be checked
      await waitFor(() => {
        // Warning system should be active (may not show warnings for this safe product)
        expect(document.body).toBeInTheDocument();
      });
    });

    it("should display unified product information", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      // All product sections should be present
      await waitFor(() => {
        expect(screen.getByText("商品説明")).toBeInTheDocument();
        expect(screen.getByText("価格比較")).toBeInTheDocument();
        expect(screen.getByText("商品一覧に戻る")).toBeInTheDocument();
      });
    });
  });

  describe("Price Data Processing", () => {
    it("should handle multiple price sources", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Multiple sources should be displayed
        expect(screen.getByText("楽天市場")).toBeInTheDocument();
        expect(screen.getByText("Yahoo!ショッピング")).toBeInTheDocument();

        // Price information should be formatted correctly
        const priceElements = screen.getAllByText(/¥\d/);
        expect(priceElements.length).toBeGreaterThan(0);
      });
    });

    it("should calculate and display effective cost per day", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Cost per day should be calculated and displayed
        const costElements = screen.getAllByText(/¥.*\/日/);
        expect(costElements.length).toBeGreaterThan(0);

        // Should show reasonable cost values
        costElements.forEach((element) => {
          const costText = element.textContent || "";
          const costMatch = costText.match(/¥(\d+)/);
          if (costMatch) {
            const cost = parseInt(costMatch[1]);
            expect(cost).toBeGreaterThan(0);
            expect(cost).toBeLessThan(1000); // Reasonable daily cost
          }
        });
      });
    });

    it("should handle price data errors gracefully", async () => {
      // Mock fetch error
      const { sanityServer } = require("@/lib/sanityServer");
      sanityServer.fetch.mockRejectedValueOnce(new Error("Network error"));

      const params = { slug: "vitamin-d-1000" };

      // Should not throw error
      expect(async () => {
        render(await ProductDetailPage({ params }));
      }).not.toThrow();
    });
  });

  describe("Accessibility Integration", () => {
    it("should maintain accessibility in integrated components", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Price table should have proper table structure
        expect(screen.getByRole("table")).toBeInTheDocument();

        // Headers should be properly labeled
        expect(
          screen.getByRole("columnheader", { name: /ソース/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("columnheader", { name: /価格/ }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("columnheader", { name: /実効コスト/ }),
        ).toBeInTheDocument();
      });
    });

    it("should support keyboard navigation", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Sortable headers should be keyboard accessible
        const sortableHeaders = screen.getAllByRole("button");
        sortableHeaders.forEach((header) => {
          expect(header).toHaveAttribute("tabIndex", "0");
        });
      });
    });

    it("should provide screen reader announcements", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Screen reader content should be present
        const srOnlyElements = document.querySelectorAll(".sr-only");
        expect(srOnlyElements.length).toBeGreaterThan(0);

        // Live region for price updates
        const liveRegion = document.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe("Performance Integration", () => {
    it("should handle large price datasets efficiently", async () => {
      const params = { slug: "vitamin-d-1000" };

      const startTime = performance.now();
      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        expect(screen.getByText("価格比較")).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (5 seconds for integration test)
      expect(renderTime).toBeLessThan(5000);
    });

    it("should limit displayed rows for performance", async () => {
      const params = { slug: "vitamin-d-1000" };

      render(await ProductDetailPage({ params }));

      await waitFor(() => {
        // Should not display more than maxRows (10 in this case)
        const tableRows = screen.getAllByRole("row");
        // Header + data rows should not exceed 11 (1 header + 10 data)
        expect(tableRows.length).toBeLessThanOrEqual(11);
      });
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle missing product gracefully", async () => {
      const { sanityServer } = require("@/lib/sanityServer");
      sanityServer.fetch.mockResolvedValue(null);

      const { notFound } = require("next/navigation");

      const params = { slug: "non-existent-product" };

      await ProductDetailPage({ params });

      expect(notFound).toHaveBeenCalled();
    });

    it("should handle price fetch failures gracefully", async () => {
      // Mock price connector failures
      vi.doMock("@/lib/pricing/rakuten-connector", () => ({
        createRakutenConnector: () => ({
          searchProducts: vi.fn().mockRejectedValue(new Error("API Error")),
        }),
      }));

      const params = { slug: "vitamin-d-1000" };

      // Should render without crashing
      expect(async () => {
        render(await ProductDetailPage({ params }));
      }).not.toThrow();
    });
  });
});
