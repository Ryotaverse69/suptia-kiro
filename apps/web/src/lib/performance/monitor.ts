/**
 * Performance monitoring utilities for Lighthouse budget compliance
 */

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fcp: number; // First Contentful Paint
  tbt: number; // Total Blocking Time
  cls: number; // Cumulative Layout Shift
  si: number; // Speed Index
  bundleSize: number; // JavaScript bundle size in KB
}

export interface PerformanceBudget {
  lcp: number; // ≤2500ms
  fcp: number; // ≤1800ms
  tbt: number; // ≤200ms
  cls: number; // ≤0.1
  si: number; // ≤3000ms
  bundleSize: number; // ≤300KB
}

// Default Lighthouse budget thresholds
export const DEFAULT_BUDGET: PerformanceBudget = {
  lcp: 2500,
  fcp: 1800,
  tbt: 200,
  cls: 0.1,
  si: 3000,
  bundleSize: 300,
};

/**
 * Measure Web Vitals using Performance Observer API
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private onMetricCallback?: (metric: string, value: number) => void;

  constructor(onMetric?: (metric: string, value: number) => void) {
    this.onMetricCallback = onMetric;
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          startTime: number;
        };
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
          this.onMetricCallback?.("lcp", lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            this.metrics.fcp = entry.startTime;
            this.onMetricCallback?.("fcp", entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ["paint"] });
      this.observers.push(fcpObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
            this.onMetricCallback?.("cls", clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(clsObserver);

      // Total Blocking Time (TBT) - approximation using long tasks
      let tbtValue = 0;
      const tbtObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            tbtValue += entry.duration - 50;
            this.metrics.tbt = tbtValue;
            this.onMetricCallback?.("tbt", tbtValue);
          }
        });
      });
      tbtObserver.observe({ entryTypes: ["longtask"] });
      this.observers.push(tbtObserver);
    } catch (error) {
      console.warn("Performance monitoring not supported:", error);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Check if metrics comply with budget
   */
  checkBudgetCompliance(budget: PerformanceBudget = DEFAULT_BUDGET): {
    compliant: boolean;
    violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      severity: "warning" | "error";
    }>;
  } {
    const violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      severity: "warning" | "error";
    }> = [];

    // Check each metric against budget
    if (this.metrics.lcp && this.metrics.lcp > budget.lcp) {
      violations.push({
        metric: "LCP",
        actual: this.metrics.lcp,
        budget: budget.lcp,
        severity: this.metrics.lcp > budget.lcp * 1.5 ? "error" : "warning",
      });
    }

    if (this.metrics.fcp && this.metrics.fcp > budget.fcp) {
      violations.push({
        metric: "FCP",
        actual: this.metrics.fcp,
        budget: budget.fcp,
        severity: this.metrics.fcp > budget.fcp * 1.5 ? "error" : "warning",
      });
    }

    if (this.metrics.tbt && this.metrics.tbt > budget.tbt) {
      violations.push({
        metric: "TBT",
        actual: this.metrics.tbt,
        budget: budget.tbt,
        severity: this.metrics.tbt > budget.tbt * 2 ? "error" : "warning",
      });
    }

    if (this.metrics.cls && this.metrics.cls > budget.cls) {
      violations.push({
        metric: "CLS",
        actual: this.metrics.cls,
        budget: budget.cls,
        severity: this.metrics.cls > budget.cls * 2 ? "error" : "warning",
      });
    }

    if (this.metrics.si && this.metrics.si > budget.si) {
      violations.push({
        metric: "SI",
        actual: this.metrics.si,
        budget: budget.si,
        severity: this.metrics.si > budget.si * 1.5 ? "error" : "warning",
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Measure bundle size (approximation)
   */
  async measureBundleSize(): Promise<number> {
    if (typeof window === "undefined") return 0;

    try {
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      let totalJSSize = 0;

      resources.forEach((resource) => {
        if (resource.name.includes(".js") && resource.transferSize) {
          totalJSSize += resource.transferSize;
        }
      });

      // Convert to KB
      const sizeInKB = totalJSSize / 1024;
      this.metrics.bundleSize = sizeInKB;
      this.onMetricCallback?.("bundleSize", sizeInKB);

      return sizeInKB;
    } catch (error) {
      console.warn("Bundle size measurement failed:", error);
      return 0;
    }
  }

  /**
   * Generate performance report
   */
  generateReport(budget: PerformanceBudget = DEFAULT_BUDGET): {
    metrics: Partial<PerformanceMetrics>;
    compliance: ReturnType<typeof this.checkBudgetCompliance>;
    recommendations: string[];
  } {
    const compliance = this.checkBudgetCompliance(budget);
    const recommendations: string[] = [];

    // Generate recommendations based on violations
    compliance.violations.forEach((violation) => {
      switch (violation.metric) {
        case "LCP":
          recommendations.push("画像の最適化と遅延読み込みを実装してください");
          recommendations.push("重要なリソースのプリロードを検討してください");
          break;
        case "FCP":
          recommendations.push(
            "クリティカルCSSのインライン化を検討してください",
          );
          recommendations.push("フォントの最適化を実装してください");
          break;
        case "TBT":
          recommendations.push("JavaScriptの実行時間を短縮してください");
          recommendations.push("コード分割を実装してください");
          break;
        case "CLS":
          recommendations.push("画像とiframeにサイズ属性を指定してください");
          recommendations.push("動的コンテンツの挿入を最適化してください");
          break;
        case "SI":
          recommendations.push(
            "重要でないリソースの遅延読み込みを実装してください",
          );
          recommendations.push("画像の最適化を実装してください");
          break;
      }
    });

    return {
      metrics: this.metrics,
      compliance,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }

  /**
   * Clean up observers
   */
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Simple performance monitoring hook for React components
 */
export function usePerformanceMonitor(enabled: boolean = true): {
  metrics: Partial<PerformanceMetrics>;
  compliance: {
    compliant: boolean;
    violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      severity: "warning" | "error";
    }>;
  };
  report: {
    metrics: Partial<PerformanceMetrics>;
    compliance: {
      compliant: boolean;
      violations: Array<{
        metric: string;
        actual: number;
        budget: number;
        severity: "warning" | "error";
      }>;
    };
    recommendations: string[];
  } | null;
  disconnect?: () => void;
} {
  if (typeof window === "undefined" || !enabled) {
    return {
      metrics: {},
      compliance: { compliant: true, violations: [] },
      report: null,
    };
  }

  const monitor = new PerformanceMonitor();

  // Measure bundle size after component mount
  monitor.measureBundleSize();

  return {
    metrics: monitor.getMetrics(),
    compliance: monitor.checkBudgetCompliance(),
    report: monitor.generateReport(),
    disconnect: () => monitor.disconnect(),
  };
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics(
  metrics: Partial<PerformanceMetrics>,
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🚀 Performance Metrics");
  if (metrics.lcp) console.log(`LCP: ${metrics.lcp.toFixed(2)}ms`);
  if (metrics.fcp) console.log(`FCP: ${metrics.fcp.toFixed(2)}ms`);
  if (metrics.tbt) console.log(`TBT: ${metrics.tbt.toFixed(2)}ms`);
  if (metrics.cls) console.log(`CLS: ${metrics.cls.toFixed(3)}`);
  if (metrics.si) console.log(`SI: ${metrics.si.toFixed(2)}ms`);
  if (metrics.bundleSize)
    console.log(`Bundle: ${metrics.bundleSize.toFixed(2)}KB`);
  console.groupEnd();
}
