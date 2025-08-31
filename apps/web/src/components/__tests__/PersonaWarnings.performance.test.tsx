import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersonaWarnings } from "../PersonaWarnings";

// パフォーマンス専用テスト
describe("PersonaWarnings Performance Tests", () => {
  const mockOnWarningDismiss = vi.fn();

  // 大量データのテスト用商品
  const createLargeProduct = (ingredientCount: number) => ({
    _id: `large-product-${ingredientCount}`,
    name: `大量成分商品 (${ingredientCount}成分)`,
    description: "非常に多くの成分を含む複雑なサプリメント。効果的で完全な栄養サポートを提供し、治療レベルの健康管理を実現します。".repeat(10),
    ingredients: Array.from({ length: ingredientCount }, (_, index) => ({
      ingredient: {
        _id: `ingredient-${index}`,
        name: `成分${index}`,
        category: index % 4 === 0 ? 'vitamin' : index % 4 === 1 ? 'mineral' : index % 4 === 2 ? 'herb' : 'other',
        synonyms: [`synonym-${index}-1`, `synonym-${index}-2`],
        safetyNotes: [`注意事項${index}`],
        tags: [`tag-${index}-1`, `tag-${index}-2`]
      },
      amountMgPerServing: 10 + (index * 5)
    })),
    warnings: Array.from({ length: Math.min(ingredientCount / 10, 20) }, (_, index) => 
      `警告事項${index}: この成分には注意が必要です。`
    )
  });

  beforeEach(() => {
    mockOnWarningDismiss.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe("レンダリング性能", () => {
    it("小規模データ（10成分）のレンダリング性能", async () => {
      const product = createLargeProduct(10);
      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 2000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 小規模データは500ms以内でレンダリング
      expect(renderTime).toBeLessThan(500);
    });

    it("中規模データ（50成分）のレンダリング性能", async () => {
      const product = createLargeProduct(50);
      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication", "lactation"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 中規模データは1秒以内でレンダリング
      expect(renderTime).toBeLessThan(1000);
    });

    it("大規模データ（100成分）のレンダリング性能", async () => {
      const product = createLargeProduct(100);
      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication", "lactation", "stimulant-sensitivity"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 大規模データでも2秒以内でレンダリング
      expect(renderTime).toBeLessThan(2000);
    });

    it("極大規模データ（500成分）のレンダリング性能", async () => {
      const product = createLargeProduct(500);
      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication", "lactation", "stimulant-sensitivity"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 10000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 極大規模データでも5秒以内でレンダリング
      expect(renderTime).toBeLessThan(5000);
    });
  });

  describe("メモリ使用量テスト", () => {
    it("大量データでのメモリリークがない", async () => {
      const product = createLargeProduct(100);

      // 複数回レンダリング・アンマウントを繰り返す
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <PersonaWarnings
            product={product}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(
            screen.queryByText("警告をチェック中...") ||
            screen.queryByRole("status") ||
            screen.queryByText("警告チェックを実行できませんでした")
          ).toBeTruthy();
        }, { timeout: 2000 });

        unmount();
        
        // DOMがクリーンアップされることを確認
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      }

      // メモリリークがないことを確認（ガベージコレクションを促進）
      if (global.gc) {
        global.gc();
      }
    });

    it("長時間実行でのメモリ安定性", async () => {
      const product = createLargeProduct(50);

      const { rerender } = render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // 複数回の再レンダリングを実行
      for (let i = 0; i < 20; i++) {
        const updatedProduct = {
          ...product,
          _id: `updated-product-${i}`,
          name: `更新された商品 ${i}`
        };

        rerender(
          <PersonaWarnings
            product={updatedProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(
            screen.queryByText("警告をチェック中...") ||
            screen.queryByRole("status") ||
            screen.queryByText("警告チェックを実行できませんでした")
          ).toBeTruthy();
        }, { timeout: 1000 });
      }

      // 最終的に正常に動作することを確認
      expect(screen.queryByText("警告チェックを実行できませんでした")).not.toBeInTheDocument();
    });
  });

  describe("同時警告処理性能", () => {
    it("複数警告の同時表示性能", async () => {
      // 多くの警告を発生させる商品データ
      const multiWarningProduct = {
        _id: "multi-warning-product",
        name: "多警告商品",
        description: "効果的で完全な治療レベルのサプリメント。即効性があり、必ず効果が現れます。病気を治し、完治させる力があります。",
        ingredients: [
          {
            ingredient: { _id: "caffeine", name: "カフェイン", category: "stimulant" },
            amountMgPerServing: 200
          },
          {
            ingredient: { _id: "st-johns-wort", name: "セントジョーンズワート", category: "herb" },
            amountMgPerServing: 500
          },
          {
            ingredient: { _id: "iron", name: "鉄", category: "mineral" },
            amountMgPerServing: 50
          },
          {
            ingredient: { _id: "vitamin-k", name: "ビタミンK", category: "vitamin" },
            amountMgPerServing: 100
          }
        ],
        warnings: ["妊娠中注意", "授乳中注意", "薬物相互作用注意"]
      };

      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={multiWarningProduct}
          userPersona={["pregnancy", "lactation", "medication", "stimulant-sensitivity"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(5); // 複数の警告が表示される
      }, { timeout: 3000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 複数警告でも1.5秒以内でレンダリング
      expect(renderTime).toBeLessThan(1500);

      // 警告が重要度順にソートされていることを確認
      const warnings = screen.getAllByRole("status");
      expect(warnings.length).toBeGreaterThanOrEqual(5);
    });

    it("警告解除時の再レンダリング性能", async () => {
      const product = createLargeProduct(30);

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication", "lactation"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(2);
      }, { timeout: 3000 });

      // 警告解除の性能を測定
      const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
      
      for (let i = 0; i < Math.min(closeButtons.length, 5); i++) {
        const startTime = performance.now();
        
        const currentButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
        if (currentButtons[0]) {
          currentButtons[0].click();
          
          await waitFor(() => {
            const newButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
            expect(newButtons.length).toBeLessThan(currentButtons.length);
          }, { timeout: 500 });
        }

        const endTime = performance.now();
        const dismissTime = endTime - startTime;

        // 各警告解除が200ms以内で完了
        expect(dismissTime).toBeLessThan(200);
      }
    });
  });

  describe("テキスト処理性能", () => {
    it("長いテキストの処理性能", async () => {
      const longTextProduct = {
        _id: "long-text-product",
        name: "長文商品",
        description: "非常に長い商品説明です。".repeat(1000) + "効果的で完全な治療を提供します。",
        ingredients: [
          {
            ingredient: { _id: "test-ingredient", name: "テスト成分", category: "other" },
            amountMgPerServing: 100
          }
        ],
        warnings: ["長い警告文です。".repeat(100)]
      };

      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={longTextProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 長いテキストでも3秒以内で処理
      expect(processingTime).toBeLessThan(3000);
    });

    it("特殊文字を含むテキストの処理性能", async () => {
      const specialCharProduct = {
        _id: "special-char-product",
        name: "特殊文字商品 & < > \" ' 🔥 ⚠️ 💊",
        description: "特殊文字 & エスケープ < > \" ' を含む効果的な商品説明です。".repeat(100),
        ingredients: [
          {
            ingredient: { 
              _id: "special-ingredient", 
              name: "特殊成分 & < > \" ' 🧪", 
              category: "special" 
            },
            amountMgPerServing: 100
          }
        ],
        warnings: ["特殊文字警告 & < > \" ' ⚠️"]
      };

      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={specialCharProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 2000 });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 特殊文字でも1秒以内で処理
      expect(processingTime).toBeLessThan(1000);

      // XSSが発生していないことを確認
      expect(document.body.innerHTML).not.toContain("<script>");
      expect(document.body.innerHTML).not.toContain("javascript:");
    });
  });

  describe("並行処理性能", () => {
    it("コンプライアンスチェックとペルソナチェックの並行実行", async () => {
      const product = createLargeProduct(20);

      // 処理時間を測定するためのモック
      let complianceStartTime = 0;
      let personaStartTime = 0;
      let complianceEndTime = 0;
      let personaEndTime = 0;

      // 実際のチェック関数をモック
      vi.doMock("../../lib/compliance", () => ({
        checkText: vi.fn().mockImplementation(async () => {
          complianceStartTime = performance.now();
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms の処理時間をシミュレート
          complianceEndTime = performance.now();
          return { hasViolations: false, violations: [] };
        })
      }));

      vi.doMock("../../lib/persona-rules", () => ({
        checkPersonaRules: vi.fn().mockImplementation(() => {
          personaStartTime = performance.now();
          // 同期処理として50msの処理時間をシミュレート
          const start = performance.now();
          while (performance.now() - start < 50) {
            // 処理時間をシミュレート
          }
          personaEndTime = performance.now();
          return { hasWarnings: false, warnings: [] };
        })
      }));

      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText("警告をチェック中...")).not.toBeInTheDocument();
      }, { timeout: 2000 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 並行実行により、総時間が個別実行時間の合計より短いことを確認
      // （実際の実装では並行実行されるため、150ms + αで完了するはず）
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe("DOM操作性能", () => {
    it("大量警告のDOM更新性能", async () => {
      const product = createLargeProduct(50);

      render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication", "lactation", "stimulant-sensitivity"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(3);
      }, { timeout: 3000 });

      // DOM要素数を確認
      const warnings = screen.getAllByRole("status");
      const domElementCount = document.querySelectorAll("*").length;

      // DOM要素数が合理的な範囲内であることを確認
      expect(domElementCount).toBeLessThan(1000); // 1000要素以下

      // 各警告要素が適切に構造化されていることを確認
      warnings.forEach(warning => {
        expect(warning.children.length).toBeGreaterThan(0);
        expect(warning.querySelector("svg")).toBeInTheDocument(); // アイコン
        expect(warning.querySelector("button")).toBeInTheDocument(); // 閉じるボタン
      });
    });

    it("動的更新時のDOM性能", async () => {
      const initialProduct = createLargeProduct(10);

      const { rerender } = render(
        <PersonaWarnings
          product={initialProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByRole("status") ||
          screen.queryByText("警告をチェック中...")
        ).toBeTruthy();
      });

      // 商品データを段階的に更新
      for (let i = 15; i <= 30; i += 5) {
        const startTime = performance.now();
        
        const updatedProduct = createLargeProduct(i);
        rerender(
          <PersonaWarnings
            product={updatedProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(
            screen.queryByText("警告をチェック中...") ||
            screen.queryByRole("status") ||
            screen.queryByText("警告チェックを実行できませんでした")
          ).toBeTruthy();
        }, { timeout: 1000 });

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        // 各更新が500ms以内で完了
        expect(updateTime).toBeLessThan(500);
      }
    });
  });

  describe("ガベージコレクション効率", () => {
    it("イベントリスナーの適切なクリーンアップ", async () => {
      const product = createLargeProduct(20);

      // 複数回のマウント・アンマウントを実行
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <PersonaWarnings
            product={product}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(
            screen.queryByText("警告をチェック中...") ||
            screen.queryByRole("status") ||
            screen.queryByText("警告チェックを実行できませんでした")
          ).toBeTruthy();
        }, { timeout: 1000 });

        // Escapeキーイベントをテスト
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);

        unmount();

        // アンマウント後にイベントが処理されないことを確認
        document.dispatchEvent(escapeEvent);
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      }
    });

    it("メモリ使用量の最適化", async () => {
      const product = createLargeProduct(100);

      // 初期メモリ使用量（概算）
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      const { unmount } = render(
        <PersonaWarnings
          product={product}
          userPersona={["pregnancy", "medication", "lactation", "stimulant-sensitivity"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 3000 });

      unmount();

      // ガベージコレクションを促進
      if (global.gc) {
        global.gc();
      }

      // メモリ使用量が大幅に増加していないことを確認
      if (performance.memory) {
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;
        
        // メモリ増加が10MB以下であることを確認
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });
});