'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals(metric => {
    // Core Web Vitals監視
    if (metric.label === 'web-vital') {
      // 本番環境でのみ送信
      if (process.env.NODE_ENV === 'production') {
        // Analytics APIに送信
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: metric.name,
            value: metric.value,
            id: metric.id,
            delta: metric.delta,
            rating: metric.rating,
            navigationType: metric.navigationType,
          }),
        }).catch(() => {
          // エラーは無視（監視に影響しないように）
        });
      }

      // 開発環境ではコンソールに出力
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        });
      }
    }
  });

  return null;
}

// Core Web Vitals閾値チェック
export function checkWebVitalsThresholds(metrics: {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}) {
  const thresholds = {
    lcp: 1000, // 1.0s (要件: LCP<1.0s)
    fid: 100, // 100ms
    cls: 0.02, // 0.02 (要件: CLS<0.02)
    fcp: 800, // 800ms
    ttfb: 200, // 200ms (要件: TTFB<200ms)
  };

  const results = {
    lcp: metrics.lcp ? metrics.lcp <= thresholds.lcp : null,
    fid: metrics.fid ? metrics.fid <= thresholds.fid : null,
    cls: metrics.cls ? metrics.cls <= thresholds.cls : null,
    fcp: metrics.fcp ? metrics.fcp <= thresholds.fcp : null,
    ttfb: metrics.ttfb ? metrics.ttfb <= thresholds.ttfb : null,
  };

  return {
    results,
    allPassed: Object.values(results).every(result => result !== false),
    summary: Object.entries(results)
      .filter(([_, passed]) => passed !== null)
      .map(
        ([metric, passed]) => `${metric.toUpperCase()}: ${passed ? '✓' : '✗'}`
      )
      .join(', '),
  };
}
