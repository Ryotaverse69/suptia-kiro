import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { performance } from "perf_hooks";
import { compareProducts } from "../../lib/compare/compare-logic";
import { sortProducts } from "../../lib/compare/sort-utils";
import { analyzeProductWarnings } from "../../lib/compare/warning-analyzer";
import { calculateScoreSummary } from "../../lib/compare/score-summary";
import type { Product } from "../../components/compare/types";

describe("Compare Performance Integration", () => {
  let mockProducts: Product[];
  let performanceEntries: PerformanceEntry[];

  beforeEach(() => {
    // パフォーマンス測定の初期化
    performanceEntries = [];

    // Mock performance.mark and performance.measure
    vi.spyOn(performance, "mark").mockImplementation((name: string) => {
      performanceEntries.push({
        name,
        entryType: "mark",
        startTime: performance.now(),
        duration: 0,
        toJSON: () => ({}),
      });
    });

    vi.spyOn(performance, "measure").mockImplementation(
      (name: string, startMark?: string, endMark?: string) => {
        const startEntry = performanceEntries.find((e) => e.name === startMark);
        const endEntry = performanceEntries.find((e) => e.name === endMark);
        const duration =
          endEntry && startEntry
            ? endEntry.startTime - startEntry.startTime
            : 0;

        const measureEntry = {
          name,
          entryType: "measure",
          startTime: startEntry?.startTime || performance.now(),
          duration,
          toJSON: () => ({}),
        };

        performanceEntries.push(measureEntry);
        return measureEntry;
      },
    );

    // テスト用の製品データを生成
    mockProducts = Array.from({ length: 3 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Product ${i + 1}`,
      price: 1000 + i * 200,
      totalScore: 80 + i * 5,
      scoreBreakdown: {
        effectiveness: 85 + i * 3,
        safety: 80 + i * 4,
        convenience: 75 + i * 5,
        costEffectiveness: 70 + i * 6,
      },
      warnings:
        i === 1
          ? [
              {
                id: `w${i}`,
                type: "critical",
                category: "pregnancy",
                message: "妊娠中の使用は避けてください",
                severity: 9,
                productId: `p${i + 1}`,
              },
            ]
          : [],
      imageUrl: `/images/product-${i + 1}.jpg`,
      url: `/products/product-${i + 1}`,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Lighthouse予算準拠テスト", () => {
    it("LCP≤2.5秒相当の処理時間を維持する", async () => {
      const startTime = performance.now();

      // 比較処理の実行
      const comparisonResult = compareProducts(mockProducts);
      const sortedProducts = sortProducts(comparisonResult.products, {
        field: "score",
        direction: "desc",
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 比較処理が100ms以下であることを確認（LCP予算の一部として）
      expect(processingTime).toBeLessThan(100);
      expect(sortedProducts).toHaveLength(3);
    });

    it("TBT≤200ms相当のJavaScript実行時間を維持する", () => {
      const iterations = 10;
      const executionTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        // 重い処理をシミュレート
        compareProducts(mockProducts);
        analyzeProductWarnings(mockProducts);
        calculateScoreSummary(mockProducts);

        const endTime = performance.now();
        executionTimes.push(endTime - startTime);
      }

      const averageTime =
        executionTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxTime = Math.max(...executionTimes);

      // 平均実行時間が20ms以下、最大実行時間が50ms以下
      expect(averageTime).toBeLessThan(20);
      expect(maxTime).toBeLessThan(50);
    });

    it("CLS≤0.1相当のレイアウト安定性を確保する", () => {
      // レイアウトシフトを引き起こす可能性のある動的データ変更をテスト
      const initialProducts = mockProducts.slice(0, 2);
      const extendedProducts = [...mockProducts];

      const initialResult = compareProducts(initialProducts);
      const extendedResult = compareProducts(extendedProducts);

      // データ構造の一貫性を確認（レイアウトシフトを防ぐ）
      expect(initialResult.scoreSummary).toBeDefined();
      expect(extendedResult.scoreSummary).toBeDefined();

      // 同じカテゴリが存在することを確認
      const initialCategories = Object.keys(initialResult.scoreSummary);
      const extendedCategories = Object.keys(extendedResult.scoreSummary);

      initialCategories.forEach((category) => {
        expect(extendedCategories).toContain(category);
      });
    });

    it("JavaScript≤300KB相当のメモリ使用量を維持する", () => {
      const initialMemory = process.memoryUsage();

      // 大量のデータ処理をシミュレート
      const largeProductSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockProducts[0],
        id: `p${i}`,
        name: `Product ${i}`,
      }));

      compareProducts(largeProductSet);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // メモリ増加量が10MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("レンダリングパフォーマンス", () => {
    it("初期レンダリングが高速に実行される", () => {
      const startTime = performance.now();

      // 初期データ処理
      const result = compareProducts(mockProducts);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 初期レンダリング時間が50ms以下
      expect(renderTime).toBeLessThan(50);
      expect(result.products).toHaveLength(3);
    });

    it("ソート操作が高速に実行される", () => {
      const products = compareProducts(mockProducts).products;
      const sortConfigs = [
        { field: "score", direction: "desc" },
        { field: "price", direction: "asc" },
        { field: "name", direction: "asc" },
      ] as const;

      sortConfigs.forEach((config) => {
        const startTime = performance.now();

        const sorted = sortProducts(products, config);

        const endTime = performance.now();
        const sortTime = endTime - startTime;

        // 各ソート操作が10ms以下
        expect(sortTime).toBeLessThan(10);
        expect(sorted).toHaveLength(products.length);
      });
    });

    it("警告分析が高速に実行される", () => {
      const startTime = performance.now();

      const warningAnalysis = analyzeProductWarnings(mockProducts);

      const endTime = performance.now();
      const analysisTime = endTime - startTime;

      // 警告分析が20ms以下
      expect(analysisTime).toBeLessThan(20);
      expect(warningAnalysis.totalWarnings).toBeGreaterThanOrEqual(0);
    });

    it("スコア要約計算が高速に実行される", () => {
      const startTime = performance.now();

      const scoreSummary = calculateScoreSummary(mockProducts);

      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      // スコア要約計算が15ms以下
      expect(calculationTime).toBeLessThan(15);
      expect(Object.keys(scoreSummary)).toContain("effectiveness");
    });
  });

  describe("メモリ効率性", () => {
    it("メモリリークが発生しない", () => {
      const initialMemory = process.memoryUsage();

      // 繰り返し処理でメモリリークをテスト
      for (let i = 0; i < 100; i++) {
        const result = compareProducts(mockProducts);
        // 結果を即座に破棄
        void result;
      }

      // ガベージコレクションを強制実行
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // メモリ増加量が5MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it("大量データ処理でもメモリ使用量が制御される", () => {
      const initialMemory = process.memoryUsage();

      // 大量の製品データを生成
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProducts[0],
        id: `large-p${i}`,
        name: `Large Product ${i}`,
        scoreBreakdown: {
          effectiveness: Math.random() * 100,
          safety: Math.random() * 100,
          convenience: Math.random() * 100,
          costEffectiveness: Math.random() * 100,
        },
      }));

      const result = compareProducts(largeDataSet);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // 大量データでもメモリ増加量が50MB以下
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(result.products).toHaveLength(1000);
    });
  });

  describe("スケーラビリティ", () => {
    it("製品数の増加に対して線形的にスケールする", () => {
      const productCounts = [10, 50, 100];
      const executionTimes: number[] = [];

      productCounts.forEach((count) => {
        const products = Array.from({ length: count }, (_, i) => ({
          ...mockProducts[0],
          id: `scale-p${i}`,
          name: `Scale Product ${i}`,
        }));

        const startTime = performance.now();
        compareProducts(products);
        const endTime = performance.now();

        executionTimes.push(endTime - startTime);
      });

      // 実行時間の増加率が製品数の増加率と比例することを確認
      const timeRatio1 = executionTimes[1] / executionTimes[0]; // 50/10 = 5倍
      const timeRatio2 = executionTimes[2] / executionTimes[1]; // 100/50 = 2倍

      // 時間の増加率が製品数の増加率の2倍以下であることを確認（O(n log n)以下）
      expect(timeRatio1).toBeLessThan(10); // 5倍の製品数で10倍以下の時間
      expect(timeRatio2).toBeLessThan(4); // 2倍の製品数で4倍以下の時間
    });

    it("複雑なスコアBreakdownでもパフォーマンスを維持する", () => {
      const complexProducts = mockProducts.map((p) => ({
        ...p,
        scoreBreakdown: {
          effectiveness: Math.random() * 100,
          safety: Math.random() * 100,
          convenience: Math.random() * 100,
          costEffectiveness: Math.random() * 100,
          sideEffects: Math.random() * 100,
          drugInteractions: Math.random() * 100,
          contraindications: Math.random() * 100,
          dosageFlexibility: Math.random() * 100,
          availabilityScore: Math.random() * 100,
          brandTrust: Math.random() * 100,
        },
      }));

      const startTime = performance.now();
      const result = compareProducts(complexProducts);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // 複雑なデータでも処理時間が100ms以下
      expect(processingTime).toBeLessThan(100);
      expect(Object.keys(result.scoreSummary)).toContain("effectiveness");
    });
  });

  describe("リアルタイム更新パフォーマンス", () => {
    it("データ更新が高速に反映される", () => {
      let currentProducts = [...mockProducts];

      // 初期処理
      let result = compareProducts(currentProducts);

      // データ更新のシミュレート
      const updateTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        // 製品データを更新
        currentProducts[0] = {
          ...currentProducts[0],
          totalScore: 80 + i,
          price: 1000 + i * 10,
        };

        result = compareProducts(currentProducts);

        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }

      const averageUpdateTime =
        updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

      // 平均更新時間が30ms以下
      expect(averageUpdateTime).toBeLessThan(30);
    });

    it("ソート状態変更が高速に実行される", () => {
      const products = compareProducts(mockProducts).products;
      const sortFields = ["score", "price", "name"] as const;
      const directions = ["asc", "desc"] as const;

      const sortTimes: number[] = [];

      sortFields.forEach((field) => {
        directions.forEach((direction) => {
          const startTime = performance.now();

          sortProducts(products, { field, direction });

          const endTime = performance.now();
          sortTimes.push(endTime - startTime);
        });
      });

      const averageSortTime =
        sortTimes.reduce((a, b) => a + b, 0) / sortTimes.length;

      // 平均ソート時間が10ms以下
      expect(averageSortTime).toBeLessThan(10);
    });
  });
});
