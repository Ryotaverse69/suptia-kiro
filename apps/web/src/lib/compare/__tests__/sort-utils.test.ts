import { describe, it, expect } from "vitest";
import {
  sortByScore,
  sortByPrice,
  sortByName,
  sortByWarnings,
  sortProducts,
  getDefaultSortDirection,
  validateSortConfig,
  createSortConfig,
  productSorter,
} from "../sort-utils";
import type { Product, SortConfig } from "@/components/compare/types";

describe("Sort Utils", () => {
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "Product A",
      price: 1000,
      totalScore: 85,
      scoreBreakdown: { effectiveness: 90, safety: 80 },
      warnings: [
        {
          id: "w1",
          type: "warning",
          category: "safety",
          message: "Minor warning",
          severity: 3,
          productId: "1",
        },
      ],
      url: "/product-a",
    },
    {
      id: "2",
      name: "Product B",
      price: 800,
      totalScore: 92,
      scoreBreakdown: { effectiveness: 95, safety: 89 },
      warnings: [
        {
          id: "w2",
          type: "critical",
          category: "safety",
          message: "Critical warning",
          severity: 9,
          productId: "2",
        },
        {
          id: "w3",
          type: "info",
          category: "usage",
          message: "Info",
          severity: 1,
          productId: "2",
        },
      ],
      url: "/product-b",
    },
    {
      id: "3",
      name: "Product C",
      price: 1200,
      totalScore: 78,
      scoreBreakdown: { effectiveness: 75, safety: 81 },
      warnings: [],
      url: "/product-c",
    },
  ];

  describe("sortByScore", () => {
    it("sorts products by score in descending order by default", () => {
      const sorted = sortByScore(mockProducts);
      expect(sorted.map((p) => p.totalScore)).toEqual([92, 85, 78]);
    });

    it("sorts products by score in ascending order", () => {
      const sorted = sortByScore(mockProducts, "asc");
      expect(sorted.map((p) => p.totalScore)).toEqual([78, 85, 92]);
    });

    it("does not mutate original array", () => {
      const original = [...mockProducts];
      sortByScore(mockProducts);
      expect(mockProducts).toEqual(original);
    });
  });

  describe("sortByPrice", () => {
    it("sorts products by price in ascending order by default", () => {
      const sorted = sortByPrice(mockProducts);
      expect(sorted.map((p) => p.price)).toEqual([800, 1000, 1200]);
    });

    it("sorts products by price in descending order", () => {
      const sorted = sortByPrice(mockProducts, "desc");
      expect(sorted.map((p) => p.price)).toEqual([1200, 1000, 800]);
    });

    it("does not mutate original array", () => {
      const original = [...mockProducts];
      sortByPrice(mockProducts);
      expect(mockProducts).toEqual(original);
    });
  });

  describe("sortByName", () => {
    it("sorts products by name in ascending order by default", () => {
      const sorted = sortByName(mockProducts);
      expect(sorted.map((p) => p.name)).toEqual([
        "Product A",
        "Product B",
        "Product C",
      ]);
    });

    it("sorts products by name in descending order", () => {
      const sorted = sortByName(mockProducts, "desc");
      expect(sorted.map((p) => p.name)).toEqual([
        "Product C",
        "Product B",
        "Product A",
      ]);
    });

    it("handles Japanese locale correctly", () => {
      const japaneseProducts: Product[] = [
        { ...mockProducts[0], name: "あ製品" },
        { ...mockProducts[1], name: "か製品" },
        { ...mockProducts[2], name: "い製品" },
      ];

      const sorted = sortByName(japaneseProducts);
      expect(sorted.map((p) => p.name)).toEqual(["あ製品", "い製品", "か製品"]);
    });

    it("does not mutate original array", () => {
      const original = [...mockProducts];
      sortByName(mockProducts);
      expect(mockProducts).toEqual(original);
    });
  });

  describe("sortByWarnings", () => {
    it("sorts products by warning score in ascending order by default (fewer warnings first)", () => {
      const sorted = sortByWarnings(mockProducts);
      // Product C (0 warnings), Product A (1 warning, severity 3), Product B (2 warnings, 1 critical)
      expect(sorted.map((p) => p.id)).toEqual(["3", "1", "2"]);
    });

    it("sorts products by warning score in descending order (more warnings first)", () => {
      const sorted = sortByWarnings(mockProducts, "desc");
      expect(sorted.map((p) => p.id)).toEqual(["2", "1", "3"]);
    });

    it("prioritizes critical warnings in scoring", () => {
      const productsWithCritical: Product[] = [
        {
          ...mockProducts[0],
          warnings: [
            {
              id: "w1",
              type: "warning",
              category: "safety",
              message: "Warning",
              severity: 5,
              productId: "1",
            },
            {
              id: "w2",
              type: "warning",
              category: "safety",
              message: "Warning",
              severity: 5,
              productId: "1",
            },
          ],
        },
        {
          ...mockProducts[1],
          warnings: [
            {
              id: "w3",
              type: "critical",
              category: "safety",
              message: "Critical",
              severity: 8,
              productId: "2",
            },
          ],
        },
      ];

      const sorted = sortByWarnings(productsWithCritical, "desc");
      // Product with critical warning should come first despite having fewer total warnings
      expect(sorted[0].id).toBe("2");
    });

    it("does not mutate original array", () => {
      const original = [...mockProducts];
      sortByWarnings(mockProducts);
      expect(mockProducts).toEqual(original);
    });
  });

  describe("sortProducts", () => {
    it("delegates to correct sort function based on field", () => {
      const scoreConfig: SortConfig = { field: "score", direction: "desc" };
      const sorted = sortProducts(mockProducts, scoreConfig);
      expect(sorted.map((p) => p.totalScore)).toEqual([92, 85, 78]);
    });

    it("handles all sort fields correctly", () => {
      const configs: SortConfig[] = [
        { field: "score", direction: "desc" },
        { field: "price", direction: "asc" },
        { field: "name", direction: "asc" },
        { field: "warnings", direction: "asc" },
      ];

      configs.forEach((config) => {
        const sorted = sortProducts(mockProducts, config);
        expect(sorted).toHaveLength(mockProducts.length);
        expect(sorted).not.toBe(mockProducts); // Should return new array
      });
    });

    it("returns original array for invalid field", () => {
      const invalidConfig = {
        field: "invalid" as any,
        direction: "asc" as any,
      };
      const sorted = sortProducts(mockProducts, invalidConfig);
      expect(sorted).toEqual(mockProducts);
    });
  });

  describe("getDefaultSortDirection", () => {
    it("returns correct default directions for each field", () => {
      expect(getDefaultSortDirection("score")).toBe("desc");
      expect(getDefaultSortDirection("price")).toBe("asc");
      expect(getDefaultSortDirection("name")).toBe("asc");
      expect(getDefaultSortDirection("warnings")).toBe("asc");
    });

    it("returns asc for unknown fields", () => {
      expect(getDefaultSortDirection("unknown" as any)).toBe("asc");
    });
  });

  describe("validateSortConfig", () => {
    it("validates correct configurations", () => {
      const validConfigs: SortConfig[] = [
        { field: "score", direction: "desc" },
        { field: "price", direction: "asc" },
        { field: "name", direction: "desc" },
        { field: "warnings", direction: "asc" },
      ];

      validConfigs.forEach((config) => {
        expect(validateSortConfig(config)).toBe(true);
      });
    });

    it("rejects invalid field", () => {
      const invalidConfig = { field: "invalid" as any, direction: "asc" };
      expect(validateSortConfig(invalidConfig)).toBe(false);
    });

    it("rejects invalid direction", () => {
      const invalidConfig = { field: "score", direction: "invalid" as any };
      expect(validateSortConfig(invalidConfig)).toBe(false);
    });
  });

  describe("createSortConfig", () => {
    it("creates valid configuration with default direction", () => {
      const config = createSortConfig("score");
      expect(config).toEqual({ field: "score", direction: "desc" });
    });

    it("creates valid configuration with specified direction", () => {
      const config = createSortConfig("price", "desc");
      expect(config).toEqual({ field: "price", direction: "desc" });
    });

    it("throws error for invalid configuration", () => {
      expect(() => createSortConfig("invalid" as any)).toThrow(
        "Invalid sort configuration",
      );
    });
  });

  describe("productSorter", () => {
    it("implements ProductSorter interface correctly", () => {
      expect(typeof productSorter.sortProducts).toBe("function");
      expect(typeof productSorter.sortByScore).toBe("function");
      expect(typeof productSorter.sortByPrice).toBe("function");
      expect(typeof productSorter.sortByName).toBe("function");
      expect(typeof productSorter.sortByWarnings).toBe("function");
    });

    it("delegates to correct functions", () => {
      const config: SortConfig = { field: "score", direction: "desc" };
      const sorted = productSorter.sortProducts(mockProducts, config);
      expect(sorted.map((p) => p.totalScore)).toEqual([92, 85, 78]);
    });
  });

  describe("edge cases", () => {
    it("handles empty product array", () => {
      const emptyProducts: Product[] = [];
      const sorted = sortByScore(emptyProducts);
      expect(sorted).toEqual([]);
    });

    it("handles single product array", () => {
      const singleProduct = [mockProducts[0]];
      const sorted = sortByScore(singleProduct);
      expect(sorted).toEqual(singleProduct);
    });

    it("handles products with identical values", () => {
      const identicalProducts: Product[] = [
        { ...mockProducts[0], totalScore: 85 },
        { ...mockProducts[1], totalScore: 85 },
        { ...mockProducts[2], totalScore: 85 },
      ];

      const sorted = sortByScore(identicalProducts);
      expect(sorted).toHaveLength(3);
      expect(sorted.every((p) => p.totalScore === 85)).toBe(true);
    });
  });
});
