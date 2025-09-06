'use client';

import { useEffect } from 'react';

type Metric = {
  name: string;
  value: number;
  id?: string;
};

function send(metric: Metric) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.value * 1000) / 1000,
      id: metric.id,
      ts: Date.now(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    } else {
      fetch('/api/vitals', {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {}
}

export default function WebVitalsClient() {
  useEffect(() => {
    // LCP
    try {
      const po = new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1] as any;
        if (last) send({ name: 'LCP', value: last.startTime, id: last.id });
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true } as any);
    } catch {}

    // CLS
    try {
      let cls = 0;
      const po = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries() as any) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
            send({ name: 'CLS', value: cls });
          }
        }
      });
      po.observe({ type: 'layout-shift', buffered: true } as any);
    } catch {}

    // TTFB & FCP（参考値）
    try {
      const nav = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (nav) send({ name: 'TTFB', value: nav.responseStart });
      const po = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            send({ name: 'FCP', value: entry.startTime });
          }
        }
      });
      po.observe({ type: 'paint', buffered: true } as any);
    } catch {}
  }, []);
  return null;
}
