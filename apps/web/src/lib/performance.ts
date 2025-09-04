/**
 * パフォーマンス最適化ユーティリティ
 * Core Web Vitalsの改善とバンドルサイズ最適化のためのヘルパー関数
 */

// 画像の遅延読み込み設定
export const imageOptimizationConfig = {
  // Next.js Imageコンポーネントのデフォルト設定
  defaultProps: {
    loading: 'lazy' as const,
    placeholder: 'blur' as const,
    quality: 85,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  },
  
  // レスポンシブ画像のサイズ設定
  responsiveSizes: {
    mobile: '(max-width: 640px) 100vw',
    tablet: '(max-width: 1024px) 50vw',
    desktop: '33vw',
  },
  
  // 画像品質設定（用途別）
  qualitySettings: {
    thumbnail: 60,
    card: 75,
    hero: 90,
    detail: 95,
  },
};

// レイアウトシフト防止のためのプレースホルダー生成
export function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // グラデーション背景を作成
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

// 重要なリソースのプリロード
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;
  
  const criticalResources = [
    // フォント
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
    // 重要なCSS
    { href: '/styles/critical.css', as: 'style' },
    // 重要な画像
    { href: '/images/logo.webp', as: 'image' },
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.as === 'font') link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  });
}

// DNS プリフェッチ
export function setupDNSPrefetch() {
  if (typeof window === 'undefined') return;
  
  const domains = [
    'cdn.sanity.io',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

// 遅延実行のためのデバウンス
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// スロットリング（パフォーマンス重視のイベント処理）
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Intersection Observer を使った遅延読み込み
export function createLazyLoader(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

// メモリ使用量の監視
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !('performance' in window)) return;
  
  const memory = (performance as any).memory;
  if (!memory) return;
  
  const memoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
  
  // メモリ使用量が80%を超えた場合の警告
  if (memoryInfo.usagePercentage > 80) {
    console.warn('高いメモリ使用量が検出されました:', memoryInfo);
  }
  
  // 開発環境でのログ出力
  if (process.env.NODE_ENV === 'development') {
    console.log('Memory Usage:', memoryInfo);
  }
}

// バンドルサイズ分析のためのチャンク情報取得
export function getBundleInfo(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  
  return new Promise((resolve) => {
    // Next.js のチャンク情報を取得
    const chunks = (window as any).__NEXT_DATA__?.chunks || [];
    const buildId = (window as any).__NEXT_DATA__?.buildId;
    
    resolve({
      chunks,
      buildId,
      timestamp: Date.now(),
    });
  });
}

// Critical Rendering Path の最適化
export function optimizeCriticalRenderingPath(): void {
  if (typeof window === 'undefined') return;
  
  // Above-the-fold コンテンツの優先読み込み
  const criticalElements = document.querySelectorAll('[data-critical]');
  criticalElements.forEach(element => {
    element.setAttribute('loading', 'eager');
  });
  
  // Below-the-fold コンテンツの遅延読み込み
  const lazyElements = document.querySelectorAll('[data-lazy]');
  const lazyLoader = createLazyLoader((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        element.removeAttribute('data-lazy');
        lazyLoader?.unobserve(element);
      }
    });
  });
  
  if (lazyLoader) {
    lazyElements.forEach(element => lazyLoader.observe(element));
  }
}

// Service Worker の登録（キャッシュ戦略）
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    
    // アップデート確認
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新しいバージョンが利用可能
            console.log('新しいバージョンが利用可能です');
          }
        });
      }
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

// パフォーマンス最適化の設定を適用
export function applyPerformanceOptimizations(): void {
  if (typeof window === 'undefined') return;
  
  // DNS プリフェッチ
  setupDNSPrefetch();
  
  // 重要なリソースのプリロード
  preloadCriticalResources();
  
  // Critical Rendering Path の最適化
  optimizeCriticalRenderingPath();
  
  // メモリ監視の開始
  setInterval(monitorMemoryUsage, 30000); // 30秒ごと
  
  // Service Worker の登録
  registerServiceWorker();
}

// パフォーマンス測定結果の型定義
export interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  loadTime: number;
  domContentLoaded: number;
}

// パフォーマンス測定の実行
export function measurePerformance(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({} as PerformanceMetrics);
      return;
    }
    
    const metrics: Partial<PerformanceMetrics> = {};
    
    // Navigation Timing API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }
    
    // Web Vitals の測定は PerformanceMonitor コンポーネントで実行
    
    resolve(metrics as PerformanceMetrics);
  });
}