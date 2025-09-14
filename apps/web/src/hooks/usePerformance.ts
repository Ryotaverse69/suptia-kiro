'use client';

import { useEffect, useCallback, useRef } from 'react';
import { optimizeMainThread } from '@/lib/performance';

/**
 * パフォーマンス最適化のためのカスタムフック
 */
export function usePerformance() {
  const { yieldToMain, processInChunks } = optimizeMainThread();

  /**
   * 重い処理を分割して実行
   */
  const executeHeavyTask = useCallback(
    async (task: () => void) => {
      await yieldToMain();
      task();
    },
    [yieldToMain]
  );

  /**
   * 配列を分割して処理
   */
  const processArray = useCallback(
    async <T>(
      items: T[],
      processor: (item: T) => void,
      chunkSize: number = 5
    ) => {
      await processInChunks(items, processor, chunkSize);
    },
    [processInChunks]
  );

  return {
    executeHeavyTask,
    processArray,
    yieldToMain,
  };
}

/**
 * 画像の遅延読み込みフック
 */
export function useLazyLoading() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;

            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.remove('image-placeholder');
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const observeImage = useCallback((img: HTMLImageElement) => {
    if (observerRef.current && img) {
      observerRef.current.observe(img);
    }
  }, []);

  return { observeImage };
}

/**
 * レイアウトシフト防止フック
 */
export function useLayoutShiftPrevention() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 画像の読み込み完了を監視
    const images = container.querySelectorAll('img');
    let loadedCount = 0;

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        container.classList.add('images-loaded');
      }
    };

    images.forEach(img => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad);
      }
    });

    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, []);

  return { containerRef };
}

/**
 * フォント読み込み最適化フック
 */
export function useFontOptimization() {
  useEffect(() => {
    if (!document.fonts) return;

    // フォント読み込み状態の監視
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });

    // 重要なフォントの事前読み込み
    const fontFaces = [
      new FontFace('Inter', 'url(/fonts/inter-var.woff2)', {
        display: 'swap',
        weight: '100 900',
      }),
      new FontFace('Noto Sans JP', 'url(/fonts/noto-sans-jp-var.woff2)', {
        display: 'swap',
        weight: '100 900',
      }),
    ];

    fontFaces.forEach(fontFace => {
      fontFace
        .load()
        .then(() => {
          document.fonts.add(fontFace);
        })
        .catch(console.error);
    });
  }, []);
}

/**
 * スクロールパフォーマンス最適化フック
 */
export function useScrollOptimization() {
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        document.body.classList.add('is-scrolling');
      }

      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        document.body.classList.remove('is-scrolling');
      }, 150);
    };

    // パッシブリスナーでスクロールパフォーマンスを向上
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);
}

/**
 * リソースヒントフック
 */
export function useResourceHints() {
  useEffect(() => {
    // DNS プリフェッチ
    const dnsPrefetchDomains = [
      'https://cdn.sanity.io',
      'https://images.unsplash.com',
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // 重要なリソースのプリロード
    const preloadResources = [
      { href: '/placeholders/hero-background.svg', as: 'image' },
      { href: '/placeholders/product-placeholder.svg', as: 'image' },
    ];

    preloadResources.forEach(({ href, as }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      document.head.appendChild(link);
    });
  }, []);
}

/**
 * 統合パフォーマンスフック
 */
export function useOptimizedPerformance() {
  const performance = usePerformance();
  const { observeImage } = useLazyLoading();
  const { containerRef } = useLayoutShiftPrevention();

  useFontOptimization();
  useScrollOptimization();
  useResourceHints();

  return {
    ...performance,
    observeImage,
    containerRef,
  };
}
