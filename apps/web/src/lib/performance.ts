/**
 * Core Web Vitals最適化のためのパフォーマンスユーティリティ
 */

// Web Vitals メトリクス型定義
export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// パフォーマンス閾値
export const PERFORMANCE_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
} as const;

/**
 * メトリクスの評価を取得
 */
export function getMetricRating(
  name: WebVitalsMetric['name'],
  value: number
): WebVitalsMetric['rating'] {
  const thresholds = PERFORMANCE_THRESHOLDS[name];

  if (value <= thresholds.good) {
    return 'good';
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Web Vitalsメトリクスを送信
 */
export function sendToAnalytics(metric: WebVitalsMetric) {
  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
    return;
  }

  // 本番環境では分析サービスに送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
    });
  }

  // カスタム分析エンドポイントに送信（オプション）
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web-vitals',
        metric,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
}

/**
 * LCP最適化のためのリソースヒント
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // 重要なフォントをプリロード
  const fontLinks = ['/fonts/inter-var.woff2', '/fonts/noto-sans-jp-var.woff2'];

  fontLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  });

  // 重要な画像をプリロード
  const criticalImages = ['/placeholders/hero-background.svg'];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * CLS最適化のためのレイアウトシフト防止
 */
export function preventLayoutShift() {
  // 画像のアスペクト比を維持するCSS
  const style = document.createElement('style');
  style.textContent = `
    .aspect-ratio-container {
      position: relative;
      width: 100%;
    }
    
    .aspect-ratio-container::before {
      content: '';
      display: block;
      padding-top: var(--aspect-ratio, 75%);
    }
    
    .aspect-ratio-container > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;
  document.head.appendChild(style);
}

/**
 * FID最適化のためのメインスレッド負荷軽減
 */
export function optimizeMainThread() {
  // 重い処理を分割して実行
  function yieldToMain() {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  // 大きなタスクを小さなチャンクに分割
  async function processInChunks<T>(
    items: T[],
    processor: (item: T) => void,
    chunkSize: number = 5
  ) {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunk.forEach(processor);

      // メインスレッドに制御を戻す
      if (i + chunkSize < items.length) {
        await yieldToMain();
      }
    }
  }

  return { yieldToMain, processInChunks };
}

/**
 * リソースローディングの最適化
 */
export function optimizeResourceLoading() {
  if (typeof window === 'undefined') return;

  // 重要でないリソースの遅延読み込み
  const deferredResources = document.querySelectorAll('[data-defer]');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const src = element.dataset.defer;

          if (src) {
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).src = src;
            } else if (element.tagName === 'IFRAME') {
              (element as HTMLIFrameElement).src = src;
            }

            element.removeAttribute('data-defer');
            observer.unobserve(element);
          }
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  deferredResources.forEach(element => {
    observer.observe(element);
  });
}

/**
 * パフォーマンス監視の初期化
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // リソースヒントの適用
  preloadCriticalResources();

  // レイアウトシフト防止
  preventLayoutShift();

  // リソースローディング最適化
  optimizeResourceLoading();

  // パフォーマンスオブザーバーの設定
  if ('PerformanceObserver' in window) {
    // Long Task の監視
    try {
      const longTaskObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 50) {
            console.warn('Long Task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long Task API がサポートされていない場合は無視
    }

    // Layout Shift の監視
    try {
      const clsObserver = new PerformanceObserver(list => {
        let clsValue = 0;

        list.getEntries().forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });

        if (clsValue > 0.1) {
          console.warn('High CLS detected:', clsValue);
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Layout Shift API がサポートされていない場合は無視
    }
  }
}

/**
 * 画像の遅延読み込み最適化
 */
export function optimizeLazyLoading() {
  if (typeof window === 'undefined') return;

  // Intersection Observer を使用した遅延読み込み
  const imageObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '100px', // 100px手前で読み込み開始
    }
  );

  // data-src属性を持つ画像を監視
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * フォントローディングの最適化
 */
export function optimizeFontLoading() {
  if (typeof window === 'undefined') return;

  // フォントの事前読み込み
  const fonts = [
    new FontFace('Inter', 'url(/fonts/inter-var.woff2)', {
      display: 'swap',
      weight: '100 900',
    }),
    new FontFace('Noto Sans JP', 'url(/fonts/noto-sans-jp-var.woff2)', {
      display: 'swap',
      weight: '100 900',
    }),
  ];

  fonts.forEach(font => {
    font
      .load()
      .then(() => {
        document.fonts.add(font);
      })
      .catch(console.error);
  });
}

// グローバル型定義の拡張
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
