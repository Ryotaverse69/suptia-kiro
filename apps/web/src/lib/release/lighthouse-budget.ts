/**
 * Lighthouse Budget Management
 * パフォーマンス予算の管理とチェック機能
 */

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  tbt: number; // Total Blocking Time (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  si: number; // Speed Index
  jsSize: number; // JavaScript bundle size (KB)
  cssSize: number; // CSS bundle size (KB)
  imageSize: number; // Image total size (KB)
}

export interface BudgetThresholds {
  lcp: { warning: number; error: number };
  tbt: { warning: number; error: number };
  cls: { warning: number; error: number };
  jsSize: { warning: number; error: number }; // KB
}

export interface BudgetViolation {
  metric: keyof PerformanceMetrics;
  actual: number;
  threshold: number;
  severity: "warning" | "error";
  message: string;
}

export interface BudgetCheckResult {
  passed: boolean;
  violations: BudgetViolation[];
  summary: {
    warnings: number;
    errors: number;
    totalChecks: number;
  };
}

/**
 * デフォルトの予算閾値
 * Requirements: 7.1, 7.2, 7.3, 7.4に基づく
 */
export const DEFAULT_BUDGET_THRESHOLDS: BudgetThresholds = {
  lcp: { warning: 2500, error: 4000 }, // LCP≤2.5s
  tbt: { warning: 200, error: 600 }, // TBT≤200ms
  cls: { warning: 0.1, error: 0.25 }, // CLS≤0.1
  jsSize: { warning: 300, error: 500 }, // JS≤300KB
};

/**
 * Lighthouse Budget Manager
 * パフォーマンス予算の管理クラス
 */
export class LighthouseBudgetManager {
  private thresholds: BudgetThresholds;

  constructor(thresholds: BudgetThresholds = DEFAULT_BUDGET_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * パフォーマンスメトリクスを予算と照合
   */
  checkBudget(metrics: PerformanceMetrics): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    // LCP (Largest Contentful Paint) チェック
    if (metrics.lcp > this.thresholds.lcp.error) {
      violations.push({
        metric: "lcp",
        actual: metrics.lcp,
        threshold: this.thresholds.lcp.error,
        severity: "error",
        message: `LCP ${metrics.lcp}ms exceeds error threshold ${this.thresholds.lcp.error}ms`,
      });
    } else if (metrics.lcp > this.thresholds.lcp.warning) {
      violations.push({
        metric: "lcp",
        actual: metrics.lcp,
        threshold: this.thresholds.lcp.warning,
        severity: "warning",
        message: `LCP ${metrics.lcp}ms exceeds warning threshold ${this.thresholds.lcp.warning}ms`,
      });
    }

    // TBT (Total Blocking Time) チェック
    if (metrics.tbt > this.thresholds.tbt.error) {
      violations.push({
        metric: "tbt",
        actual: metrics.tbt,
        threshold: this.thresholds.tbt.error,
        severity: "error",
        message: `TBT ${metrics.tbt}ms exceeds error threshold ${this.thresholds.tbt.error}ms`,
      });
    } else if (metrics.tbt > this.thresholds.tbt.warning) {
      violations.push({
        metric: "tbt",
        actual: metrics.tbt,
        threshold: this.thresholds.tbt.warning,
        severity: "warning",
        message: `TBT ${metrics.tbt}ms exceeds warning threshold ${this.thresholds.tbt.warning}ms`,
      });
    }

    // CLS (Cumulative Layout Shift) チェック
    if (metrics.cls > this.thresholds.cls.error) {
      violations.push({
        metric: "cls",
        actual: metrics.cls,
        threshold: this.thresholds.cls.error,
        severity: "error",
        message: `CLS ${metrics.cls} exceeds error threshold ${this.thresholds.cls.error}`,
      });
    } else if (metrics.cls > this.thresholds.cls.warning) {
      violations.push({
        metric: "cls",
        actual: metrics.cls,
        threshold: this.thresholds.cls.warning,
        severity: "warning",
        message: `CLS ${metrics.cls} exceeds warning threshold ${this.thresholds.cls.warning}`,
      });
    }

    // JavaScript Bundle Size チェック
    if (metrics.jsSize > this.thresholds.jsSize.error) {
      violations.push({
        metric: "jsSize",
        actual: metrics.jsSize,
        threshold: this.thresholds.jsSize.error,
        severity: "error",
        message: `JS bundle ${metrics.jsSize}KB exceeds error threshold ${this.thresholds.jsSize.error}KB`,
      });
    } else if (metrics.jsSize > this.thresholds.jsSize.warning) {
      violations.push({
        metric: "jsSize",
        actual: metrics.jsSize,
        threshold: this.thresholds.jsSize.warning,
        severity: "warning",
        message: `JS bundle ${metrics.jsSize}KB exceeds warning threshold ${this.thresholds.jsSize.warning}KB`,
      });
    }

    const warnings = violations.filter((v) => v.severity === "warning").length;
    const errors = violations.filter((v) => v.severity === "error").length;

    return {
      passed: errors === 0, // エラーがなければ通過（警告は許可）
      violations,
      summary: {
        warnings,
        errors,
        totalChecks: 4, // LCP, TBT, CLS, JSSize
      },
    };
  }

  /**
   * Lighthouseレポートからメトリクスを抽出
   */
  extractMetricsFromLighthouseReport(report: any): PerformanceMetrics {
    const audits = report.audits;

    return {
      lcp: audits["largest-contentful-paint"]?.numericValue || 0,
      tbt: audits["total-blocking-time"]?.numericValue || 0,
      cls: audits["cumulative-layout-shift"]?.numericValue || 0,
      fcp: audits["first-contentful-paint"]?.numericValue || 0,
      si: audits["speed-index"]?.numericValue || 0,
      jsSize: this.calculateResourceSize(audits, "script") / 1024, // Convert to KB
      cssSize: this.calculateResourceSize(audits, "stylesheet") / 1024,
      imageSize: this.calculateResourceSize(audits, "image") / 1024,
    };
  }

  /**
   * リソースサイズを計算
   */
  private calculateResourceSize(audits: any, resourceType: string): number {
    const resourceSummary = audits["resource-summary"];
    if (!resourceSummary?.details?.items) return 0;

    const item = resourceSummary.details.items.find(
      (item: any) => item.resourceType === resourceType,
    );

    return item?.transferSize || 0;
  }

  /**
   * 予算チェック結果をフォーマット
   */
  formatBudgetReport(result: BudgetCheckResult): string {
    const lines: string[] = [];

    lines.push("🚀 Lighthouse Budget Report");
    lines.push("=".repeat(50));

    if (result.passed) {
      lines.push("✅ All budget checks passed!");
    } else {
      lines.push("❌ Budget violations detected");
    }

    lines.push("");
    lines.push(
      `📊 Summary: ${result.summary.warnings} warnings, ${result.summary.errors} errors`,
    );
    lines.push("");

    if (result.violations.length > 0) {
      lines.push("📋 Violations:");
      result.violations.forEach((violation) => {
        const icon = violation.severity === "error" ? "❌" : "⚠️";
        lines.push(`${icon} ${violation.message}`);
      });
      lines.push("");
    }

    lines.push("💡 Budget Thresholds:");
    lines.push(
      `   LCP: ≤${this.thresholds.lcp.warning}ms (warning), ≤${this.thresholds.lcp.error}ms (error)`,
    );
    lines.push(
      `   TBT: ≤${this.thresholds.tbt.warning}ms (warning), ≤${this.thresholds.tbt.error}ms (error)`,
    );
    lines.push(
      `   CLS: ≤${this.thresholds.cls.warning} (warning), ≤${this.thresholds.cls.error} (error)`,
    );
    lines.push(
      `   JS:  ≤${this.thresholds.jsSize.warning}KB (warning), ≤${this.thresholds.jsSize.error}KB (error)`,
    );

    return lines.join("\n");
  }
}

/**
 * デフォルトの予算マネージャーインスタンス
 */
export const defaultBudgetManager = new LighthouseBudgetManager();
