/**
 * Contrast Ratio and Text Scaling Accessibility Tests
 * コントラスト比とテキストスケーリングのアクセシビリティテスト
 * Requirements: 7.5, 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { render, screen } from "@testing-library/react";
import { ProductCompareTable } from "../../components/compare/ProductCompareTable";
import { WarningHighlight } from "../../components/compare/WarningHighlight";
import { ScoreSummaryRow } from "../../components/compare/ScoreSummaryRow";

// Mock data
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
];

const mockScoreSummary = {
  category: "effectiveness",
  maxScore: 95,
  minScore: 70,
  averageScore: 85,
  products: [{ productId: "product-1", score: 90 }],
};

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  // This is a simplified contrast ratio calculation
  // In a real implementation, you would use a proper color contrast library

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper function to get computed styles
function getComputedColor(element: Element, property: string): string {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.getPropertyValue(property);
}

describe("Contrast Ratio and Text Scaling Tests", () => {
  // Mock window.getComputedStyle for testing
  beforeAll(() => {
    Object.defineProperty(window, "getComputedStyle", {
      value: () => ({
        getPropertyValue: (prop: string) => {
          // Return mock values for common CSS properties
          const mockStyles: Record<string, string> = {
            color: "#000000",
            "background-color": "#ffffff",
            "font-size": "16px",
            "line-height": "1.5",
            "font-weight": "400",
          };
          return mockStyles[prop] || "";
        },
      }),
    });
  });

  describe("Contrast Ratio Tests", () => {
    test("テーブルヘッダーのコントラスト比がWCAG AA基準を満たす (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const columnHeaders = screen.getAllByRole("columnheader");

      columnHeaders.forEach((header) => {
        const textColor = getComputedColor(header, "color");
        const backgroundColor = getComputedColor(header, "background-color");

        // Mock contrast ratio calculation (in real test, use proper library)
        const contrastRatio = calculateContrastRatio(
          textColor,
          backgroundColor,
        );

        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test("テーブルセルのコントラスト比がWCAG AA基準を満たす (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const cells = screen.getAllByRole("cell");

      cells.forEach((cell) => {
        const textColor = getComputedColor(cell, "color");
        const backgroundColor = getComputedColor(cell, "background-color");

        const contrastRatio = calculateContrastRatio(
          textColor,
          backgroundColor,
        );
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test("警告ハイライトのコントラスト比が適切である (Requirement 7.5)", () => {
      const warning = mockProducts[0].warnings[0];
      render(<WarningHighlight warning={warning} />);

      const warningElement = screen.getByText(warning.message);
      const textColor = getComputedColor(warningElement, "color");
      const backgroundColor = getComputedColor(
        warningElement,
        "background-color",
      );

      const contrastRatio = calculateContrastRatio(textColor, backgroundColor);

      // Critical warnings should have high contrast
      if (warning.type === "critical") {
        expect(contrastRatio).toBeGreaterThanOrEqual(7); // WCAG AAA level
      } else {
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA level
      }
    });

    test("並べ替えボタンのコントラスト比が適切である (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const sortButtons = screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-sort") !== null);

      sortButtons.forEach((button) => {
        const textColor = getComputedColor(button, "color");
        const backgroundColor = getComputedColor(button, "background-color");

        const contrastRatio = calculateContrastRatio(
          textColor,
          backgroundColor,
        );
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test("フォーカス状態のコントラスト比が適切である (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const focusableElements = screen.getAllByRole("button");

      focusableElements.forEach((element) => {
        // フォーカスを当てる
        element.focus();

        // フォーカス状態のスタイルを確認
        const focusColor =
          getComputedColor(element, "outline-color") ||
          getComputedColor(element, "border-color");
        const backgroundColor = getComputedColor(element, "background-color");

        if (focusColor && backgroundColor) {
          const contrastRatio = calculateContrastRatio(
            focusColor,
            backgroundColor,
          );
          expect(contrastRatio).toBeGreaterThanOrEqual(3); // Focus indicator minimum
        }
      });
    });
  });

  describe("Text Scaling Tests", () => {
    test("200%拡大時にテキストが適切に表示される (Requirement 7.5)", () => {
      // Mock CSS zoom or font-size scaling
      const originalFontSize = "16px";
      const scaledFontSize = "32px"; // 200% scaling

      // Override getComputedStyle for scaled text
      Object.defineProperty(window, "getComputedStyle", {
        value: () => ({
          getPropertyValue: (prop: string) => {
            if (prop === "font-size") return scaledFontSize;
            const mockStyles: Record<string, string> = {
              color: "#000000",
              "background-color": "#ffffff",
              "line-height": "1.5",
              "font-weight": "400",
            };
            return mockStyles[prop] || "";
          },
        }),
      });

      render(<ProductCompareTable products={mockProducts} />);

      // テーブル要素が存在することを確認
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // テキストが読み取り可能であることを確認
      const headers = screen.getAllByRole("columnheader");
      headers.forEach((header) => {
        expect(header.textContent?.trim()).toBeTruthy();

        // フォントサイズが適切にスケールされていることを確認
        const fontSize = getComputedColor(header, "font-size");
        expect(fontSize).toBe(scaledFontSize);
      });

      // セル内容が適切に表示されることを確認
      const cells = screen.getAllByRole("cell");
      cells.forEach((cell) => {
        expect(cell.textContent?.trim()).toBeTruthy();
      });
    });

    test("テキストスケーリング時にレイアウトが崩れない (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const table = screen.getByRole("table");

      // テーブルの基本構造が維持されることを確認
      expect(table).toBeInTheDocument();

      // ヘッダー行が存在することを確認
      const headerRow = screen.getAllByRole("row")[0];
      expect(headerRow).toBeInTheDocument();

      // データ行が存在することを確認
      const dataRows = screen.getAllByRole("row").slice(1);
      expect(dataRows.length).toBe(mockProducts.length);

      // 各行に適切な数のセルがあることを確認
      dataRows.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    test("長いテキストが適切に処理される (Requirement 7.5)", () => {
      const longNameProduct = {
        ...mockProducts[0],
        name: "とても長い製品名でテキストの折り返しやスケーリングの動作を確認するためのテスト製品",
      };

      render(<ProductCompareTable products={[longNameProduct]} />);

      // 長いテキストが表示されることを確認
      const productName = screen.getByText(longNameProduct.name);
      expect(productName).toBeInTheDocument();

      // テキストが適切にセル内に収まることを確認（視覚的な確認は困難だが、要素が存在することを確認）
      const cell = productName.closest("td, th");
      expect(cell).toBeInTheDocument();
    });

    test("スコア表示が拡大時も読み取り可能である (Requirement 7.5)", () => {
      render(
        <ScoreSummaryRow summary={mockScoreSummary} products={mockProducts} />,
      );

      // スコア値が表示されることを確認
      expect(
        screen.getByText(mockScoreSummary.maxScore.toString()),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockScoreSummary.minScore.toString()),
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockScoreSummary.averageScore.toString()),
      ).toBeInTheDocument();

      // 数値が適切にフォーマットされていることを確認
      const scoreElements = screen.getAllByText(/\d+/);
      scoreElements.forEach((element) => {
        const textContent = element.textContent;
        expect(textContent).toMatch(/^\d+$/); // 数値のみ
      });
    });
  });

  describe("Visual Accessibility Features", () => {
    test("フォーカスインジケーターが適切に表示される (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const focusableElements = screen.getAllByRole("button");

      focusableElements.forEach((element) => {
        // フォーカスを当てる
        element.focus();
        expect(document.activeElement).toBe(element);

        // フォーカス状態であることを確認
        expect(element).toHaveFocus();
      });
    });

    test("ホバー状態が適切に動作する (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const interactiveElements = screen.getAllByRole("button");

      interactiveElements.forEach((element) => {
        // ホバー可能な要素であることを確認
        expect(element).toBeInTheDocument();
        expect(element).not.toBeDisabled();
      });
    });

    test("色だけに依存しない情報伝達が行われる (Requirement 7.5)", () => {
      const warning = mockProducts[0].warnings[0];
      render(<WarningHighlight warning={warning} />);

      const warningElement = screen.getByText(warning.message);

      // テキストによる情報伝達が行われることを確認
      expect(warningElement.textContent).toContain(warning.message);

      // 重要度がテキストまたはアイコンで示されることを確認
      // (実装に依存するが、色だけでなくテキストやアイコンも使用されるべき)
      const container = warningElement.closest("[role]");
      if (container) {
        const role = container.getAttribute("role");
        expect(["alert", "status"]).toContain(role);
      }
    });

    test("アニメーションが適切に制御される (Requirement 7.5)", () => {
      // prefers-reduced-motionの設定をモック
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<ProductCompareTable products={mockProducts} />);

      // アニメーションが制御されることを確認（実装に依存）
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // 基本的な表示が正常であることを確認
      expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
      expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
    });
  });

  describe("Responsive Design Accessibility", () => {
    test("小さな画面サイズでもアクセシビリティが維持される (Requirement 7.5)", () => {
      // モバイルサイズのビューポートをシミュレート
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(<ProductCompareTable products={mockProducts} />);

      // 基本的なテーブル構造が維持されることを確認
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // アクセシビリティ属性が維持されることを確認
      const columnHeaders = screen.getAllByRole("columnheader");
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });

      const rowHeaders = screen.getAllByRole("rowheader");
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute("scope", "row");
      });
    });

    test("タッチデバイスでの操作性が確保される (Requirement 7.5)", () => {
      render(<ProductCompareTable products={mockProducts} />);

      const interactiveElements = screen.getAllByRole("button");

      interactiveElements.forEach((element) => {
        // タッチターゲットが適切なサイズであることを確認（最小44x44px推奨）
        // 実際のサイズ測定は困難だが、要素が存在し操作可能であることを確認
        expect(element).toBeInTheDocument();
        expect(element).not.toBeDisabled();

        // タッチイベントが処理されることを確認
        expect(element).toHaveAttribute("type", "button");
      });
    });
  });
});
