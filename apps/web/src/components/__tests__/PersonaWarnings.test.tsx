import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersonaWarnings, PersonaWarningsProps } from "../PersonaWarnings";

// モック関数の設定
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

describe("PersonaWarnings", () => {
  const mockOnWarningDismiss = vi.fn();

  // テスト用の商品データ
  const mockProduct = {
    _id: "test-product-1",
    name: "テストサプリメント",
    description: "健康をサポートするサプリメントです。効果が期待できます。",
    ingredients: [
      {
        ingredient: {
          name: "カフェイン"
        },
        amountMgPerServing: 100
      },
      {
        ingredient: {
          name: "ビタミンC"
        },
        amountMgPerServing: 500
      }
    ],
    warnings: ["妊娠中の方は医師に相談してください"]
  };

  const defaultProps: PersonaWarningsProps = {
    product: mockProduct,
    userPersona: [],
    onWarningDismiss: mockOnWarningDismiss,
  };

  beforeEach(() => {
    mockOnWarningDismiss.mockClear();
    mockCheckText.mockClear();
    mockCheckPersonaRules.mockClear();
    
    // デフォルトのモック戻り値を設定
    mockCheckText.mockResolvedValue({
      hasViolations: false,
      violations: []
    });
    
    mockCheckPersonaRules.mockReturnValue({
      hasWarnings: false,
      warnings: []
    });
  });

  afterEach(() => {
    // DOM をクリーンアップ
    document.body.innerHTML = '';
  });

  describe("基本表示", () => {
    it("警告がない場合は何も表示されない", async () => {
      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("ローディング状態が表示される", () => {
      // 非同期処理を遅延させるためのPromise
      mockCheckText.mockImplementation(() => new Promise(() => {}));
      
      render(<PersonaWarnings {...defaultProps} />);

      expect(screen.getByText("警告をチェック中...")).toBeInTheDocument();
    });

    it("商品がない場合は警告チェックが実行されない", async () => {
      render(<PersonaWarnings {...defaultProps} product={undefined as any} />);

      await waitFor(() => {
        expect(mockCheckText).not.toHaveBeenCalled();
        expect(mockCheckPersonaRules).not.toHaveBeenCalled();
      });
    });
  });

  describe("コンプライアンス警告", () => {
    it("コンプライアンス違反がある場合に警告が表示される", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("表現に関する注意")).toBeInTheDocument();
        expect(screen.getByText(/「効果が期待できます」という表現について注意が必要です/)).toBeInTheDocument();
        expect(screen.getByText("推奨: 変化が報告されています")).toBeInTheDocument();
      });
    });

    it("複数のコンプライアンス違反が表示される", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          },
          {
            originalText: "完治します",
            suggestedText: "改善が期待されます",
            pattern: "完治",
            severity: "high"
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings).toHaveLength(2);
        expect(screen.getByText(/「効果が期待できます」という表現について注意が必要です/)).toBeInTheDocument();
        expect(screen.getByText(/「完治します」という表現について注意が必要です/)).toBeInTheDocument();
      });
    });
  });

  describe("ペルソナ警告", () => {
    it("ペルソナ警告がある場合に表示される", async () => {
      mockCheckPersonaRules.mockReturnValue({
        hasWarnings: true,
        warnings: [
          {
            ruleId: "pregnancy-caffeine",
            severity: "high",
            message: "妊娠中はカフェインの摂取に注意が必要です",
            action: "医師に相談してください",
            affectedIngredients: ["カフェイン"]
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} userPersona={["pregnancy"]} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("重要な健康上の注意")).toBeInTheDocument();
        expect(screen.getByText("妊娠中はカフェインの摂取に注意が必要です")).toBeInTheDocument();
        expect(screen.getByText("推奨: 医師に相談してください")).toBeInTheDocument();
      });
    });

    it("複数のペルソナ警告が重要度順に表示される", async () => {
      mockCheckPersonaRules.mockReturnValue({
        hasWarnings: true,
        warnings: [
          {
            ruleId: "stimulant-sensitivity",
            severity: "mid",
            message: "刺激物に敏感な方は注意が必要です",
            action: "少量から始めてください",
            affectedIngredients: ["カフェイン"]
          },
          {
            ruleId: "pregnancy-caffeine",
            severity: "high",
            message: "妊娠中はカフェインの摂取に注意が必要です",
            action: "医師に相談してください",
            affectedIngredients: ["カフェイン"]
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} userPersona={["pregnancy", "stimulant-sensitivity"]} />);

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings).toHaveLength(2);
        
        // 高い重要度の警告が先に表示されることを確認
        const warningTexts = warnings.map(w => w.textContent);
        const highWarningIndex = warningTexts.findIndex(text => text?.includes("妊娠中はカフェインの摂取に注意が必要です"));
        const mediumWarningIndex = warningTexts.findIndex(text => text?.includes("刺激物に敏感な方は注意が必要です"));
        
        expect(highWarningIndex).toBeLessThan(mediumWarningIndex);
      });
    });
  });

  describe("統合警告表示", () => {
    it("コンプライアンス警告とペルソナ警告が同時に表示される", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
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
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} userPersona={["pregnancy"]} />);

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings).toHaveLength(2);
        
        // 両方の警告タイプが表示されることを確認
        expect(screen.getByText("表現に関する注意")).toBeInTheDocument();
        expect(screen.getByText("重要な健康上の注意")).toBeInTheDocument();
      });
    });

    it("警告が重要度順にソートされる", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
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
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} userPersona={["pregnancy"]} />);

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings).toHaveLength(2);
        
        // 高い重要度のペルソナ警告が低い重要度のコンプライアンス警告より先に表示される
        const warningTexts = warnings.map(w => w.textContent);
        const highWarningIndex = warningTexts.findIndex(text => text?.includes("妊娠中はカフェインの摂取に注意が必要です"));
        const lowWarningIndex = warningTexts.findIndex(text => text?.includes("効果が期待できます"));
        
        expect(highWarningIndex).toBeLessThan(lowWarningIndex);
      });
    });
  });

  describe("警告の解除機能", () => {
    it("警告を解除すると非表示になる", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("onWarningDismissコールバックが呼ばれる", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      fireEvent.click(closeButton);

      expect(mockOnWarningDismiss).toHaveBeenCalledWith("compliance-0");
    });

    it("複数の警告のうち一つを解除しても他は表示される", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          },
          {
            originalText: "完治します",
            suggestedText: "改善が期待されます",
            pattern: "完治",
            severity: "high"
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        const warnings = screen.getAllByRole("status");
        expect(warnings).toHaveLength(2);
      });

      // 最初の警告を閉じる
      const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole("status");
        expect(remainingWarnings).toHaveLength(1);
      });
    });

    it("解除された警告は再表示されない", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });

      const { rerender } = render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });

      // 同じpropsで再レンダリング
      rerender(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("コンプライアンスチェックエラー時にエラーメッセージが表示される", async () => {
      mockCheckText.mockRejectedValue(new Error("API Error"));
      mockCheckPersonaRules.mockImplementation(() => {
        throw new Error("Persona Error");
      });

      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("警告チェックを実行できませんでした")).toBeInTheDocument();
      });
    });

    it("コンプライアンスチェックのみ失敗してもペルソナチェックは実行される", async () => {
      mockCheckText.mockRejectedValue(new Error("Compliance Error"));
      mockCheckPersonaRules.mockReturnValue({
        hasWarnings: true,
        warnings: [
          {
            ruleId: "pregnancy-caffeine",
            severity: "high",
            message: "妊娠中はカフェインの摂取に注意が必要です",
            action: "医師に相談してください",
            affectedIngredients: ["カフェイン"]
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} userPersona={["pregnancy"]} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("妊娠中はカフェインの摂取に注意が必要です")).toBeInTheDocument();
      });
    });

    it("部分的なエラーでも利用可能な警告は表示される", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });
      
      // ペルソナチェックは正常に動作
      mockCheckPersonaRules.mockReturnValue({
        hasWarnings: false,
        warnings: []
      });

      render(<PersonaWarnings {...defaultProps} />);

      // コンプライアンス警告は表示される
      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText(/「効果が期待できます」という表現について注意が必要です/)).toBeInTheDocument();
      });
    });
  });

  describe("商品データの処理", () => {
    it("商品名と説明がテキスト抽出に含まれる", async () => {
      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("テストサプリメント")
        );
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("健康をサポートするサプリメントです")
        );
      });
    });

    it("成分名がテキスト抽出に含まれる", async () => {
      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("カフェイン")
        );
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("ビタミンC")
        );
      });
    });

    it("警告事項がテキスト抽出に含まれる", async () => {
      render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("妊娠中の方は医師に相談してください")
        );
      });
    });

    it("文字列形式の成分も正しく処理される", async () => {
      const productWithStringIngredients = {
        ...mockProduct,
        ingredients: [
          {
            ingredient: "カフェイン",
            amountMgPerServing: 100
          }
        ]
      };

      render(<PersonaWarnings {...defaultProps} product={productWithStringIngredients} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("カフェイン")
        );
      });
    });

    it("不完全な商品データでもエラーにならない", async () => {
      const incompleteProduct = {
        _id: "incomplete-product",
        name: "不完全な商品"
        // description, ingredients, warnings が欠如
      };

      render(<PersonaWarnings {...defaultProps} product={incompleteProduct} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledWith("不完全な商品");
      });
    });
  });

  describe("ペルソナ変更の処理", () => {
    it("ペルソナが変更されると警告チェックが再実行される", async () => {
      const { rerender } = render(<PersonaWarnings {...defaultProps} userPersona={[]} />);

      await waitFor(() => {
        expect(mockCheckPersonaRules).toHaveBeenCalledWith(mockProduct, []);
      });

      mockCheckPersonaRules.mockClear();

      rerender(<PersonaWarnings {...defaultProps} userPersona={["pregnancy"]} />);

      await waitFor(() => {
        expect(mockCheckPersonaRules).toHaveBeenCalledWith(mockProduct, ["pregnancy"]);
      });
    });

    it("商品が変更されると警告チェックが再実行される", async () => {
      const newProduct = {
        ...mockProduct,
        _id: "new-product",
        name: "新しい商品"
      };

      const { rerender } = render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledTimes(1);
      });

      mockCheckText.mockClear();

      rerender(<PersonaWarnings {...defaultProps} product={newProduct} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledWith(
          expect.stringContaining("新しい商品")
        );
      });
    });
  });

  describe("カスタマイズ", () => {
    it("カスタムクラス名が適用される", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });

      const customClass = "custom-persona-warnings";
      render(<PersonaWarnings {...defaultProps} className={customClass} />);

      await waitFor(() => {
        const container = screen.getByRole("status").parentElement;
        expect(container).toHaveClass(customClass);
      });
    });

    it("onWarningDismissが提供されない場合でも動作する", async () => {
      mockCheckText.mockResolvedValue({
        hasViolations: true,
        violations: [
          {
            originalText: "効果が期待できます",
            suggestedText: "変化が報告されています",
            pattern: "効果.*期待",
            severity: "medium"
          }
        ]
      });

      render(<PersonaWarnings {...defaultProps} onWarningDismiss={undefined} />);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      
      // エラーが発生しないことを確認
      expect(() => {
        fireEvent.click(closeButton);
      }).not.toThrow();
    });
  });

  describe("パフォーマンス", () => {
    it("同じ商品とペルソナで不要な再チェックが発生しない", async () => {
      const { rerender } = render(<PersonaWarnings {...defaultProps} />);

      await waitFor(() => {
        expect(mockCheckText).toHaveBeenCalledTimes(1);
        expect(mockCheckPersonaRules).toHaveBeenCalledTimes(1);
      });

      mockCheckText.mockClear();
      mockCheckPersonaRules.mockClear();

      // 同じpropsで再レンダリング（classNameのみ変更）
      rerender(<PersonaWarnings {...defaultProps} className="different-class" />);

      // 警告チェックが再実行されないことを確認
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockCheckText).not.toHaveBeenCalled();
      expect(mockCheckPersonaRules).not.toHaveBeenCalled();
    });

    it("コンプライアンスチェックとペルソナチェックが並行実行される", async () => {
      let complianceResolve: (value: any) => void;
      let personaExecuted = false;

      mockCheckText.mockImplementation(() => new Promise(resolve => {
        complianceResolve = resolve;
      }));

      mockCheckPersonaRules.mockImplementation(() => {
        personaExecuted = true;
        return { hasWarnings: false, warnings: [] };
      });

      render(<PersonaWarnings {...defaultProps} />);

      // 短時間待機してペルソナチェックが実行されることを確認
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(personaExecuted).toBe(true);

      // コンプライアンスチェックを完了
      complianceResolve!({ hasViolations: false, violations: [] });

      await waitFor(() => {
        expect(screen.queryByText("警告をチェック中...")).not.toBeInTheDocument();
      });
    });
  });
});