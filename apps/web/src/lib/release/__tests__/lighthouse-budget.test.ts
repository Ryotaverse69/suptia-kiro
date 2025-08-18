import { describe, it, expect } from "vitest";
import {
  LighthouseBudgetManager,
  DEFAULT_BUDGET_THRESHOLDS,
  PerformanceMetrics,
  BudgetViolation,
} from "../lighthouse-budget";

describe("LighthouseBudgetManager", () => {
  const budgetManager = new LighthouseBudgetManager();

  describe("checkBudget", () => {
    it("should pass when all metrics are within budget", () => {
      const metrics: PerformanceMetrics = {
        lcp: 2000, // < 2500ms warning threshold
        tbt: 150, // < 200ms warning threshold
        cls: 0.05, // < 0.1 warning threshold
        fcp: 1500,
        si: 2500,
        jsSize: 250, // < 300KB warning threshold
        cssSize: 30,
        imageSize: 400,
      };

      const result = budgetManager.checkBudget(metrics);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.summary.warnings).toBe(0);
      expect(result.summary.errors).toBe(0);
      expect(result.summary.totalChecks).toBe(4);
    });

    it("should detect warning violations but still pass", () => {
      const metrics: PerformanceMetrics = {
        lcp: 3000, // > 2500ms warning, < 4000ms error
        tbt: 250, // > 200ms warning, < 600ms error
        cls: 0.15, // > 0.1 warning, < 0.25 error
        fcp: 1500,
        si: 2500,
        jsSize: 350, // > 300KB warning, < 500KB error
        cssSize: 30,
        imageSize: 400,
      };

      const result = budgetManager.checkBudget(metrics);

      expect(result.passed).toBe(true); // 警告のみなので通過
      expect(result.violations).toHaveLength(4);
      expect(result.summary.warnings).toBe(4);
      expect(result.summary.errors).toBe(0);

      // 各違反の詳細をチェック
      const lcpViolation = result.violations.find((v) => v.metric === "lcp");
      expect(lcpViolation).toBeDefined();
      expect(lcpViolation?.severity).toBe("warning");
      expect(lcpViolation?.actual).toBe(3000);
      expect(lcpViolation?.threshold).toBe(2500);
    });

    it("should detect error violations and fail", () => {
      const metrics: PerformanceMetrics = {
        lcp: 5000, // > 4000ms error threshold
        tbt: 700, // > 600ms error threshold
        cls: 0.3, // > 0.25 error threshold
        fcp: 1500,
        si: 2500,
        jsSize: 600, // > 500KB error threshold
        cssSize: 30,
        imageSize: 400,
      };

      const result = budgetManager.checkBudget(metrics);

      expect(result.passed).toBe(false); // エラーがあるので失敗
      expect(result.violations).toHaveLength(4);
      expect(result.summary.warnings).toBe(0);
      expect(result.summary.errors).toBe(4);

      // 各エラーの詳細をチェック
      const lcpViolation = result.violations.find((v) => v.metric === "lcp");
      expect(lcpViolation?.severity).toBe("error");
      expect(lcpViolation?.actual).toBe(5000);
      expect(lcpViolation?.threshold).toBe(4000);
    });

    it("should handle mixed warning and error violations", () => {
      const metrics: PerformanceMetrics = {
        lcp: 3000, // warning
        tbt: 700, // error
        cls: 0.05, // ok
        fcp: 1500,
        si: 2500,
        jsSize: 350, // warning
        cssSize: 30,
        imageSize: 400,
      };

      const result = budgetManager.checkBudget(metrics);

      expect(result.passed).toBe(false); // エラーがあるので失敗
      expect(result.violations).toHaveLength(3);
      expect(result.summary.warnings).toBe(2);
      expect(result.summary.errors).toBe(1);
    });
  });

  describe("extractMetricsFromLighthouseReport", () => {
    it("should extract metrics from Lighthouse report", () => {
      const mockReport = {
        audits: {
          "largest-contentful-paint": { numericValue: 2500 },
          "total-blocking-time": { numericValue: 150 },
          "cumulative-layout-shift": { numericValue: 0.08 },
          "first-contentful-paint": { numericValue: 1800 },
          "speed-index": { numericValue: 2800 },
          "resource-summary": {
            details: {
              items: [
                { resourceType: "script", transferSize: 307200 }, // 300KB
                { resourceType: "stylesheet", transferSize: 51200 }, // 50KB
                { resourceType: "image", transferSize: 512000 }, // 500KB
              ],
            },
          },
        },
      };

      const metrics =
        budgetManager.extractMetricsFromLighthouseReport(mockReport);

      expect(metrics.lcp).toBe(2500);
      expect(metrics.tbt).toBe(150);
      expect(metrics.cls).toBe(0.08);
      expect(metrics.fcp).toBe(1800);
      expect(metrics.si).toBe(2800);
      expect(metrics.jsSize).toBe(300); // 307200 / 1024
      expect(metrics.cssSize).toBe(50); // 51200 / 1024
      expect(metrics.imageSize).toBe(500); // 512000 / 1024
    });

    it("should handle missing audit data gracefully", () => {
      const mockReport = {
        audits: {},
      };

      const metrics =
        budgetManager.extractMetricsFromLighthouseReport(mockReport);

      expect(metrics.lcp).toBe(0);
      expect(metrics.tbt).toBe(0);
      expect(metrics.cls).toBe(0);
      expect(metrics.fcp).toBe(0);
      expect(metrics.si).toBe(0);
      expect(metrics.jsSize).toBe(0);
      expect(metrics.cssSize).toBe(0);
      expect(metrics.imageSize).toBe(0);
    });
  });

  describe("formatBudgetReport", () => {
    it("should format a passing report correctly", () => {
      const result = {
        passed: true,
        violations: [],
        summary: {
          warnings: 0,
          errors: 0,
          totalChecks: 4,
        },
      };

      const report = budgetManager.formatBudgetReport(result);

      expect(report).toContain("🚀 Lighthouse Budget Report");
      expect(report).toContain("✅ All budget checks passed!");
      expect(report).toContain("📊 Summary: 0 warnings, 0 errors");
      expect(report).toContain("💡 Budget Thresholds:");
    });

    it("should format a failing report with violations", () => {
      const violations: BudgetViolation[] = [
        {
          metric: "lcp",
          actual: 3000,
          threshold: 2500,
          severity: "warning",
          message: "LCP 3000ms exceeds warning threshold 2500ms",
        },
        {
          metric: "tbt",
          actual: 700,
          threshold: 600,
          severity: "error",
          message: "TBT 700ms exceeds error threshold 600ms",
        },
      ];

      const result = {
        passed: false,
        violations,
        summary: {
          warnings: 1,
          errors: 1,
          totalChecks: 4,
        },
      };

      const report = budgetManager.formatBudgetReport(result);

      expect(report).toContain("❌ Budget violations detected");
      expect(report).toContain("📊 Summary: 1 warnings, 1 errors");
      expect(report).toContain("📋 Violations:");
      expect(report).toContain(
        "⚠️ LCP 3000ms exceeds warning threshold 2500ms",
      );
      expect(report).toContain("❌ TBT 700ms exceeds error threshold 600ms");
    });
  });

  describe("DEFAULT_BUDGET_THRESHOLDS", () => {
    it("should have correct threshold values", () => {
      expect(DEFAULT_BUDGET_THRESHOLDS.lcp.warning).toBe(2500);
      expect(DEFAULT_BUDGET_THRESHOLDS.lcp.error).toBe(4000);
      expect(DEFAULT_BUDGET_THRESHOLDS.tbt.warning).toBe(200);
      expect(DEFAULT_BUDGET_THRESHOLDS.tbt.error).toBe(600);
      expect(DEFAULT_BUDGET_THRESHOLDS.cls.warning).toBe(0.1);
      expect(DEFAULT_BUDGET_THRESHOLDS.cls.error).toBe(0.25);
      expect(DEFAULT_BUDGET_THRESHOLDS.jsSize.warning).toBe(300);
      expect(DEFAULT_BUDGET_THRESHOLDS.jsSize.error).toBe(500);
    });
  });

  describe("custom thresholds", () => {
    it("should accept custom budget thresholds", () => {
      const customThresholds = {
        lcp: { warning: 2000, error: 3500 },
        tbt: { warning: 150, error: 500 },
        cls: { warning: 0.08, error: 0.2 },
        jsSize: { warning: 250, error: 400 },
      };

      const customBudgetManager = new LighthouseBudgetManager(customThresholds);

      const metrics: PerformanceMetrics = {
        lcp: 2200, // > 2000ms custom warning
        tbt: 100, // < 150ms custom warning
        cls: 0.05, // < 0.08 custom warning
        fcp: 1500,
        si: 2500,
        jsSize: 200, // < 250KB custom warning
        cssSize: 30,
        imageSize: 400,
      };

      const result = customBudgetManager.checkBudget(metrics);

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].metric).toBe("lcp");
      expect(result.violations[0].threshold).toBe(2000);
    });
  });
});
