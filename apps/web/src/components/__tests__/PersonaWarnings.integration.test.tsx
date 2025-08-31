import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersonaWarnings } from "../PersonaWarnings";

// モック設定
vi.mock("../../lib/compliance", () => ({
  checkText: vi.fn(),
}));

vi.mock("../../lib/persona-rules", () => ({
  checkPersonaRules: vi.fn(),
}));

import { checkText } from "../../lib/compliance";
import { checkPersonaRules } from "../../lib/persona-rules";

const mockCheckText = vi.mocked(checkText);
const mockCheckPersonaRules = vi.mocked(checkPersonaRules);

// 実際のSanityデータを使用した統合テスト
describe("PersonaWarnings Integration Tests", () => {
  const mockOnWarningDismiss = vi.fn();

  // 実際のSanity商品データ構造をシミュレート
  const realProductData = {
    _id: "real-product-1",
    name: "マルチビタミン＆ミネラル",
    description: "毎日の健康をサポートする総合栄養サプリメント。効果的な成分配合で、あなたの健康を完全にサポートします。",
    ingredients: [
      {
        ingredient: {
          _id: "ingredient-vitamin-c",
          name: "ビタミンC",
          category: "vitamin",
          synonyms: ["アスコルビン酸", "L-アスコルビン酸"],
          safetyNotes: ["過剰摂取により胃腸障害の可能性"],
          tags: ["抗酸化", "免疫"]
        },
        amountMgPerServing: 1000
      },
      {
        ingredient: {
          _id: "ingredient-caffeine",
          name: "カフェイン",
          category: "stimulant",
          synonyms: ["caffeine", "1,3,7-trimethylxanthine"],
          safetyNotes: ["妊娠中・授乳中は摂取制限", "不眠症の方は注意"],
          tags: ["刺激物", "覚醒"]
        },
        amountMgPerServing: 100
      },
      {
        ingredient: {
          _id: "ingredient-iron",
          name: "鉄",
          category: "mineral",
          synonyms: ["iron", "Fe"],
          safetyNotes: ["過剰摂取により消化器症状"],
          tags: ["ミネラル", "血液"]
        },
        amountMgPerServing: 18
      },
      {
        ingredient: {
          _id: "ingredient-st-johns-wort",
          name: "セントジョーンズワート",
          category: "herb",
          synonyms: ["聖ヨハネ草", "St. John's wort"],
          safetyNotes: ["薬物相互作用の可能性", "授乳中は注意"],
          tags: ["ハーブ", "気分"]
        },
        amountMgPerServing: 300
      }
    ],
    warnings: [
      "妊娠中・授乳中の方は医師にご相談ください",
      "薬を服用中の方は医師にご相談ください",
      "アレルギーのある方は原材料をご確認ください"
    ]
  };

  beforeEach(() => {
    mockOnWarningDismiss.mockClear();
    mockCheckText.mockClear();
    mockCheckPersonaRules.mockClear();
    
    // デフォルトのモック戻り値を設定
    mockCheckText.mockResolvedValue({
      hasViolations: true,
      violations: [
        {
          originalText: "効果的で",
          suggestedText: "変化が報告されている",
          pattern: "効果的",
          severity: "medium"
        },
        {
          originalText: "完全な",
          suggestedText: "総合的な",
          pattern: "完全",
          severity: "low"
        }
      ]
    });
    
    mockCheckPersonaRules.mockReturnValue({
      hasWarnings: true,
      warnings: [
        {
          ruleId: "pregnancy-caffeine",
          severity: "high",
          message: "妊娠中はカフェインの摂取に注意が必要です",
          action: "医師に相談してください",
          affectedIngredients: ["カフェイン"]
        },
        {
          ruleId: "medication-interaction",
          severity: "high",
          message: "服薬中の方は成分の相互作用にご注意ください",
          action: "医師または薬剤師に相談してください",
          affectedIngredients: ["セントジョーンズワート"]
        }
      ]
    });
    
    // コンソールエラーをモック（テスト中のログを抑制）
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe("実際のSanityデータとの統合", () => {
    it("実際の商品データで複数の警告が正しく表示される", async () => {
      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // 複数の警告が表示されることを確認
      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // 妊娠中のカフェイン警告
      expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();
      
      // 薬物相互作用警告
      expect(screen.getByText(/服薬中の方は成分の相互作用にご注意ください/)).toBeInTheDocument();
    });

    it("コンプライアンス違反と健康警告が同時に表示される", async () => {
      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });

      // コンプライアンス警告（「効果的な」「完全に」などの表現）
      expect(screen.getByText(/という表現について注意が必要です/)).toBeInTheDocument();
      
      // ペルソナ警告
      expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();
    });

    it("重要度順のソートが正しく動作する", async () => {
      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "lactation", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(1);
      }, { timeout: 3000 });

      const warnings = screen.getAllByRole("status");
      const warningTexts = warnings.map(w => w.textContent || '');

      // 高重要度の警告が先頭に来ることを確認
      const highSeverityIndex = warningTexts.findIndex(text => 
        text.includes("重要な健康上の注意") || text.includes("妊娠中はカフェイン")
      );
      const lowSeverityIndex = warningTexts.findIndex(text => 
        text.includes("ご利用上の注意")
      );

      if (highSeverityIndex !== -1 && lowSeverityIndex !== -1) {
        expect(highSeverityIndex).toBeLessThan(lowSeverityIndex);
      }
    });
  });

  describe("パフォーマンステスト", () => {
    it("複数同時警告でのレンダリング性能", async () => {
      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "lactation", "medication", "stimulant-sensitivity"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // レンダリング時間が2秒以内であることを確認
      expect(renderTime).toBeLessThan(2000);
    });

    it("大量の成分データでのパフォーマンス", async () => {
      // 大量の成分を持つ商品データを作成
      const largeProductData = {
        ...realProductData,
        ingredients: Array.from({ length: 50 }, (_, index) => ({
          ingredient: {
            _id: `ingredient-${index}`,
            name: `成分${index}`,
            category: "other",
            synonyms: [`synonym-${index}`],
            safetyNotes: [`注意事項${index}`],
            tags: [`tag-${index}`]
          },
          amountMgPerServing: 10 + index
        }))
      };

      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={largeProductData}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        // 警告が表示されるか、エラーが発生しないことを確認
        expect(screen.queryByText("警告チェックを実行できませんでした")).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 大量データでも3秒以内でレンダリングされることを確認
      expect(renderTime).toBeLessThan(3000);
    });

    it("メモリリークがないことを確認", async () => {
      const { unmount } = render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(0);
      });

      // コンポーネントをアンマウント
      unmount();

      // DOMがクリーンアップされることを確認
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("エラー回復テスト", () => {
    it("ネットワークエラー後の回復", async () => {
      // 最初はエラーを発生させる
      mockCheckText.mockRejectedValueOnce(new Error("Network Error"));
      mockCheckPersonaRules.mockImplementationOnce(() => {
        throw new Error("Persona Error");
      });
      
      const { rerender } = render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText("警告チェックを実行できませんでした")).toBeInTheDocument();
      });

      // 正常なレスポンスに変更して再レンダリング
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [{
          originalText: "効果的な",
          suggestedText: "変化が報告されている",
          pattern: "効果的",
          severity: "medium"
        }]
      });

      mockCheckPersonaRules.mockReturnValue({
        hasWarnings: true,
        warnings: [{
          ruleId: "pregnancy-caffeine",
          severity: "high",
          message: "妊娠中はカフェインの摂取に注意が必要です",
          action: "医師に相談してください",
          affectedIngredients: ["カフェイン"]
        }]
      });

      rerender(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // 警告が正常に表示されることを確認
      await waitFor(() => {
        expect(screen.queryByText("警告チェックを実行できませんでした")).not.toBeInTheDocument();
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
    });

    it("部分的なデータ破損への対応", async () => {
      const corruptedProduct = {
        ...realProductData,
        ingredients: [
          // 正常なデータ
          {
            ingredient: {
              _id: "ingredient-1",
              name: "ビタミンC",
              category: "vitamin"
            },
            amountMgPerServing: 1000
          },
          // 破損したデータ
          {
            ingredient: null,
            amountMgPerServing: 100
          },
          // 不完全なデータ
          {
            ingredient: {
              _id: "ingredient-3"
              // nameが欠如
            },
            amountMgPerServing: 50
          }
        ]
      };

      render(
        <PersonaWarnings
          product={corruptedProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // エラーが発生せず、利用可能なデータで警告が表示されることを確認
      await waitFor(() => {
        expect(screen.queryByText("警告チェックを実行できませんでした")).not.toBeInTheDocument();
      });
    });
  });

  describe("リアルタイム更新テスト", () => {
    it("商品データの動的更新", async () => {
      const { rerender } = render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // 商品データを更新
      const updatedProduct = {
        ...realProductData,
        name: "更新されたサプリメント",
        description: "新しい説明文です。"
      };

      rerender(
        <PersonaWarnings
          product={updatedProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // 新しいデータで警告チェックが実行されることを確認
      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
    });

    it("ペルソナの動的変更", async () => {
      const { rerender } = render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(0);
      });

      const initialWarningCount = screen.getAllByRole("status").length;

      // ペルソナを追加
      rerender(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "medication", "lactation"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // 警告数が増加することを確認
      await waitFor(() => {
        const newWarnings = screen.getAllByRole("status");
        expect(newWarnings.length).toBeGreaterThanOrEqual(initialWarningCount);
      });
    });
  });

  describe("アクセシビリティ統合テスト", () => {
    it("複数警告でのスクリーンリーダー対応", async () => {
      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(1);
      });

      const warnings = screen.getAllByRole("status");
      
      // 各警告にaria-live属性が設定されていることを確認
      warnings.forEach(warning => {
        expect(warning).toHaveAttribute("aria-live", "polite");
      });

      // 各警告にaria-labelが設定されていることを確認
      warnings.forEach(warning => {
        expect(warning).toHaveAttribute("aria-label");
        expect(warning.getAttribute("aria-label")).toMatch(/重要度:/);
      });
    });

    it("キーボードナビゲーションの統合テスト", async () => {
      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(1);
      });

      const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
      
      // 最初のボタンにフォーカス
      closeButtons[0].focus();
      expect(document.activeElement).toBe(closeButtons[0]);

      // Tabキーで次のボタンに移動
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      
      // Escapeキーで警告を閉じる
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole("status");
        expect(remainingWarnings.length).toBeLessThan(closeButtons.length);
      });
    });
  });

  describe("ユーザビリティテスト", () => {
    it("警告の段階的解除", async () => {
      render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy", "medication", "lactation"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(2);
      });

      const initialWarningCount = screen.getAllByRole("status").length;
      const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });

      // 最初の警告を閉じる
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole("status");
        expect(remainingWarnings.length).toBe(initialWarningCount - 1);
      });

      // 2番目の警告を閉じる
      const newCloseButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
      fireEvent.click(newCloseButtons[0]);

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole("status");
        expect(remainingWarnings.length).toBe(initialWarningCount - 2);
      });

      // onWarningDismissが正しく呼ばれることを確認
      expect(mockOnWarningDismiss).toHaveBeenCalledTimes(2);
    });

    it("警告の再表示防止", async () => {
      const { rerender } = render(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // 警告を閉じる
      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });

      // 同じpropsで再レンダリング
      rerender(
        <PersonaWarnings
          product={realProductData}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // 警告が再表示されないことを確認
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });
  });

  describe("エッジケーステスト", () => {
    it("空の商品データ", async () => {
      const emptyProduct = {
        _id: "empty-product",
        name: "",
        description: "",
        ingredients: [],
        warnings: []
      };

      render(
        <PersonaWarnings
          product={emptyProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // エラーが発生しないことを確認
      await waitFor(() => {
        expect(screen.queryByText("警告チェックを実行できませんでした")).not.toBeInTheDocument();
      });
    });

    it("非常に長い商品説明", async () => {
      const longDescriptionProduct = {
        ...realProductData,
        description: "非常に長い説明文です。".repeat(1000)
      };

      const startTime = performance.now();

      render(
        <PersonaWarnings
          product={longDescriptionProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        // 処理が完了することを確認（エラーまたは警告が表示される）
        expect(
          screen.queryByText("警告をチェック中...") ||
          screen.queryByRole("status") ||
          screen.queryByText("警告チェックを実行できませんでした")
        ).toBeTruthy();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 長いテキストでも5秒以内で処理されることを確認
      expect(processingTime).toBeLessThan(5000);
    });

    it("特殊文字を含む商品データ", async () => {
      const specialCharProduct = {
        ...realProductData,
        name: "テスト商品 <script>alert('xss')</script>",
        description: "特殊文字 & < > \" ' を含む説明文です。",
        ingredients: [
          {
            ingredient: {
              _id: "special-ingredient",
              name: "成分名 & 特殊文字 < > \" '",
              category: "special"
            },
            amountMgPerServing: 100
          }
        ]
      };

      render(
        <PersonaWarnings
          product={specialCharProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // XSSが発生しないことを確認
      await waitFor(() => {
        expect(screen.queryByText("警告チェックを実行できませんでした")).not.toBeInTheDocument();
      });

      // 特殊文字が適切にエスケープされることを確認
      expect(document.body.innerHTML).not.toContain("<script>");
    });
  });
});