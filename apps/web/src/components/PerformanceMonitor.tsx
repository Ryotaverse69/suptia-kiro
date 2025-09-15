/**
 * パフォーマンス監視コンポーネント
 * Core Web Vitalsの測定と最適化のためのモニタリング機能
 */

'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
}

interface PerformanceMonitorProps {
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
    enableLogging?: boolean;
}

export default function PerformanceMonitor({
    onMetricsUpdate,
    enableLogging = false
}: PerformanceMonitorProps) {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({});

    useEffect(() => {
        // Web Vitals APIが利用可能かチェック
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }

        const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
            setMetrics(prev => {
                const updated = { ...prev, ...newMetrics };
                onMetricsUpdate?.(updated);

                if (enableLogging) {
                    console.log('Performance Metrics Updated:', updated);
                }

                return updated;
            });
        };

        // LCP (Largest Contentful Paint) の測定
        const observeLCP = () => {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1] as any;
                    if (lastEntry) {
                        updateMetrics({ lcp: lastEntry.startTime });
                    }
                });
                observer.observe({ type: 'largest-contentful-paint', buffered: true });
                return observer;
            } catch (error) {
                console.warn('LCP observation failed:', error);
                return null;
            }
        };

        // FID (First Input Delay) の測定
        const observeFID = () => {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (entry.processingStart && entry.startTime) {
                            const fid = entry.processingStart - entry.startTime;
                            updateMetrics({ fid });
                        }
                    });
                });
                observer.observe({ type: 'first-input', buffered: true });
                return observer;
            } catch (error) {
                console.warn('FID observation failed:', error);
                return null;
            }
        };

        // CLS (Cumulative Layout Shift) の測定
        const observeCLS = () => {
            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            updateMetrics({ cls: clsValue });
                        }
                    });
                });
                observer.observe({ type: 'layout-shift', buffered: true });
                return observer;
            } catch (error) {
                console.warn('CLS observation failed:', error);
                return null;
            }
        };

        // FCP (First Contentful Paint) の測定
        const observeFCP = () => {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (entry.name === 'first-contentful-paint') {
                            updateMetrics({ fcp: entry.startTime });
                        }
                    });
                });
                observer.observe({ type: 'paint', buffered: true });
                return observer;
            } catch (error) {
                console.warn('FCP observation failed:', error);
                return null;
            }
        };

        // TTFB (Time to First Byte) の測定
        const measureTTFB = () => {
            try {
                const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
                if (navigationEntry) {
                    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
                    updateMetrics({ ttfb });
                }
            } catch (error) {
                console.warn('TTFB measurement failed:', error);
            }
        };

        // 全ての観測を開始
        const observers = [
            observeLCP(),
            observeFID(),
            observeCLS(),
            observeFCP(),
        ].filter(Boolean);

        // TTFB測定
        measureTTFB();

        // クリーンアップ
        return () => {
            observers.forEach(observer => observer?.disconnect());
        };
    }, [onMetricsUpdate, enableLogging]);

    // パフォーマンス警告の判定
    const getPerformanceStatus = () => {
        const warnings = [];

        if (metrics.lcp && metrics.lcp > 2500) {
            warnings.push('LCP (Largest Contentful Paint) が遅いです');
        }

        if (metrics.fid && metrics.fid > 100) {
            warnings.push('FID (First Input Delay) が遅いです');
        }

        if (metrics.cls && metrics.cls > 0.1) {
            warnings.push('CLS (Cumulative Layout Shift) が高いです');
        }

        if (metrics.fcp && metrics.fcp > 1800) {
            warnings.push('FCP (First Contentful Paint) が遅いです');
        }

        if (metrics.ttfb && metrics.ttfb > 600) {
            warnings.push('TTFB (Time to First Byte) が遅いです');
        }

        return warnings;
    };

    // 開発環境でのみ表示
    if (process.env.NODE_ENV !== 'development' || !enableLogging) {
        return null;
    }

    const warnings = getPerformanceStatus();

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-sm p-4 max-w-sm z-50">
            <h3 className="text-sm font-semibold mb-2">パフォーマンス監視</h3>

            <div className="space-y-1 text-xs">
                {metrics.lcp && (
                    <div className={`flex justify-between ${metrics.lcp > 2500 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>LCP:</span>
                        <span>{Math.round(metrics.lcp)}ms</span>
                    </div>
                )}

                {metrics.fid && (
                    <div className={`flex justify-between ${metrics.fid > 100 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>FID:</span>
                        <span>{Math.round(metrics.fid)}ms</span>
                    </div>
                )}

                {metrics.cls && (
                    <div className={`flex justify-between ${metrics.cls > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>CLS:</span>
                        <span>{metrics.cls.toFixed(3)}</span>
                    </div>
                )}

                {metrics.fcp && (
                    <div className={`flex justify-between ${metrics.fcp > 1800 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>FCP:</span>
                        <span>{Math.round(metrics.fcp)}ms</span>
                    </div>
                )}

                {metrics.ttfb && (
                    <div className={`flex justify-between ${metrics.ttfb > 600 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>TTFB:</span>
                        <span>{Math.round(metrics.ttfb)}ms</span>
                    </div>
                )}
            </div>

            {warnings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-red-600">
                        <div className="font-semibold">警告:</div>
                        {warnings.map((warning, index) => (
                            <div key={index} className="mt-1">• {warning}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// パフォーマンスメトリクスをWeb Vitals APIで送信するヘルパー
export function reportWebVitals(metric: any) {
    // 本番環境では分析サービスに送信
    if (process.env.NODE_ENV === 'production') {
        // Google Analytics 4 への送信例
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('event', metric.name, {
                event_category: 'Web Vitals',
                event_label: metric.id,
                value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                non_interaction: true,
            });
        }

        // カスタム分析エンドポイントへの送信例
        fetch('/api/analytics/web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metric),
        }).catch(console.error);
    }

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === 'development') {
        console.log('Web Vitals:', metric);
    }
}