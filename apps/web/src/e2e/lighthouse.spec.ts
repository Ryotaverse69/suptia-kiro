import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Lighthouse Performance Tests', () => {
  test('Homepage should achieve Lighthouse scores 90+', async ({
    page,
    context,
  }) => {
    // ホームページに移動
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Lighthouse監査を実行
    const audit = await playAudit({
      page,
      thresholds: {
        performance: 90,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
      },
      port: 9222,
      opts: {
        chromeFlags: ['--no-sandbox', '--disable-dev-shm-usage'],
        logLevel: 'info',
      },
    });

    // スコアを検証
    expect(audit.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(
      90
    );
    expect(
      audit.lhr.categories.accessibility.score * 100
    ).toBeGreaterThanOrEqual(90);
    expect(
      audit.lhr.categories['best-practices'].score * 100
    ).toBeGreaterThanOrEqual(90);
    expect(audit.lhr.categories.seo.score * 100).toBeGreaterThanOrEqual(90);
  });

  test('Search page should achieve Lighthouse scores 90+', async ({ page }) => {
    // 検索ページに移動
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Lighthouse監査を実行
    const audit = await playAudit({
      page,
      thresholds: {
        performance: 90,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
      },
      port: 9222,
    });

    // スコアを検証
    expect(audit.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(
      90
    );
    expect(
      audit.lhr.categories.accessibility.score * 100
    ).toBeGreaterThanOrEqual(90);
    expect(
      audit.lhr.categories['best-practices'].score * 100
    ).toBeGreaterThanOrEqual(90);
    expect(audit.lhr.categories.seo.score * 100).toBeGreaterThanOrEqual(90);
  });

  test('Core Web Vitals should meet requirements', async ({ page }) => {
    // ホームページでCore Web Vitalsを測定
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // LCP測定
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    // CLS測定
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });

        // 5秒後に測定終了
        setTimeout(() => resolve(clsValue), 5000);
      });
    });

    // 要件を検証
    expect(lcp).toBeLessThan(1000); // LCP < 1.0s
    expect(cls).toBeLessThan(0.02); // CLS < 0.02

    console.log(`LCP: ${lcp}ms, CLS: ${cls}`);
  });

  test('Mobile performance should be optimized', async ({ page, context }) => {
    // モバイルビューポートを設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // モバイル用Lighthouse監査
    const audit = await playAudit({
      page,
      thresholds: {
        performance: 90,
        accessibility: 90,
      },
      port: 9222,
      opts: {
        chromeFlags: ['--no-sandbox', '--disable-dev-shm-usage'],
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    });

    // モバイルスコアを検証
    expect(audit.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(
      90
    );
    expect(
      audit.lhr.categories.accessibility.score * 100
    ).toBeGreaterThanOrEqual(90);
  });
});
