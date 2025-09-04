/**
 * パフォーマンス監視設定
 * 本番環境対応の監視・分析機能
 */

import { env, isProduction } from './env-validation';

/**
 * Web Vitalsの閾値設定
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  
  // First Input Delay (FID)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * パフォーマンスメトリクスの型定義
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

/**
 * エラー情報の型定義
 */
export interface ErrorInfo {
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

/**
 * パフォーマンスメトリクスの評価
 */
export function evaluateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Web Vitalsの送信
 */
export function sendWebVitals(metric: PerformanceMetric) {
  if (!env.features.monitoring) return;
  
  // Google Analytics 4への送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
  
  // カスタム分析エンドポイントへの送信
  if (isProduction) {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...metric,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(error => {
      console.warn('Failed to send web vitals:', error);
    });
  }
}

/**
 * エラーの送信
 */
export function sendError(error: ErrorInfo) {
  if (!env.features.monitoring) return;
  
  // 本番環境でのみエラーを送信
  if (isProduction) {
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
    }).catch(err => {
      console.warn('Failed to send error:', err);
    });
  } else {
    console.error('Application Error:', error);
  }
}

/**
 * カスタムイベントの送信
 */
export function sendCustomEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (!env.features.analytics) return;
  
  // Google Analytics 4への送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...parameters,
      timestamp: Date.now(),
    });
  }
  
  // カスタム分析エンドポイントへの送信
  if (isProduction) {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        parameters,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: Date.now(),
      }),
    }).catch(error => {
      console.warn('Failed to send custom event:', error);
    });
  }
}

/**
 * ページビューの送信
 */
export function sendPageView(url: string, title?: string) {
  if (!env.features.analytics) return;
  
  // Google Analytics 4への送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_title: title,
      page_location: url,
    });
  }
  
  // カスタム分析エンドポイントへの送信
  sendCustomEvent('page_view', {
    page_title: title,
    page_location: url,
  });
}

/**
 * ユーザーアクションの追跡
 */
export const trackUserAction = {
  // 検索実行
  search: (query: string, resultsCount: number) => {
    sendCustomEvent('search', {
      search_term: query,
      results_count: resultsCount,
    });
  },
  
  // 診断実行
  diagnosis: (answers: Record<string, any>, score: number) => {
    sendCustomEvent('diagnosis_completed', {
      total_score: score,
      answer_count: Object.keys(answers).length,
    });
  },
  
  // 商品詳細表示
  productView: (productId: string, productName: string) => {
    sendCustomEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: 'supplement',
    });
  },
  
  // お気に入り追加
  addToFavorites: (productId: string, productName: string) => {
    sendCustomEvent('add_to_wishlist', {
      item_id: productId,
      item_name: productName,
      item_category: 'supplement',
    });
  },
  
  // 比較機能使用
  compareProducts: (productIds: string[]) => {
    sendCustomEvent('compare_products', {
      item_count: productIds.length,
      item_ids: productIds.join(','),
    });
  },
  
  // 価格アラート設定
  setPriceAlert: (productId: string, targetPrice: number) => {
    sendCustomEvent('set_price_alert', {
      item_id: productId,
      target_price: targetPrice,
    });
  },
};

/**
 * パフォーマンス監視の初期化
 */
export function initializeMonitoring() {
  if (typeof window === 'undefined' || !env.features.monitoring) return;
  
  // Web Vitalsの監視（web-vitalsパッケージが利用可能な場合のみ）
  // TODO: web-vitalsパッケージをインストール後に有効化
  /*
  try {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendWebVitals);
      getFID(sendWebVitals);
      getFCP(sendWebVitals);
      getLCP(sendWebVitals);
      getTTFB(sendWebVitals);
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
  } catch (error) {
    console.warn('Web Vitals package not available:', error);
  }
  */
  
  // グローバルエラーハンドラー
  window.addEventListener('error', (event) => {
    sendError({
      message: event.message,
      stack: event.error?.stack,
      url: event.filename || window.location.href,
      line: event.lineno,
      column: event.colno,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  });
  
  // Promise rejection ハンドラー
  window.addEventListener('unhandledrejection', (event) => {
    sendError({
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  });
  
  // ページ離脱時の処理
  window.addEventListener('beforeunload', () => {
    // 未送信のデータがあれば送信
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        event: 'page_unload',
        url: window.location.href,
        timestamp: Date.now(),
      });
      
      navigator.sendBeacon('/api/analytics/events', data);
    }
  });
}

/**
 * リソース使用量の監視
 */
export function monitorResourceUsage() {
  if (typeof window === 'undefined' || !env.features.monitoring) return;
  
  // メモリ使用量の監視（対応ブラウザのみ）
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    sendCustomEvent('resource_usage', {
      used_js_heap_size: memory.usedJSHeapSize,
      total_js_heap_size: memory.totalJSHeapSize,
      js_heap_size_limit: memory.jsHeapSizeLimit,
    });
  }
  
  // ネットワーク情報の監視（対応ブラウザのみ）
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    sendCustomEvent('network_info', {
      effective_type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      save_data: connection.saveData,
    });
  }
}

/**
 * Google Analytics 4の設定
 */
export function configureGoogleAnalytics() {
  if (!env.features.analytics || !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;
  
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

/**
 * 型定義の拡張
 */
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}