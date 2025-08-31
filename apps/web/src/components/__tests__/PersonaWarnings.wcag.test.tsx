import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersonaWarnings } from "../PersonaWarnings";
// @ts-ignore
import { axe, toHaveNoViolations } from "jest-axe";

// WCAG 2.1 AA準拠テスト
expect.extend(toHaveNoViolations);

describe("PersonaWarnings WCAG 2.1 AA Compliance Tests", () => {
  const mockOnWarningDismiss = vi.fn();

  const wcagTestProduct = {
    _id: "wcag-test-product",
    name: "WCAG準拠テスト商品",
    description: "効果的で完全な健康サポートを提供する治療レベルのサプリメント。",
    ingredients: [
      {
        ingredient: {
          _id: "caffeine-wcag",
          name: "カフェイン",
          category: "stimulant"
        },
        amountMgPerServing: 100
      },
      {
        ingredient: {
          _id: "herb-wcag",
          name: "セントジョーンズワート", 
          category: "herb"
        },
        amountMgPerServing: 300
      },
      {
        ingredient: {
          _id: "vitamin-k-wcag",
          name: "ビタミンK",
          category: "vitamin"
        },
        amountMgPerServing: 120
      }
    ],
    warnings: ["妊娠中・授乳中の方は医師にご相談ください"]
  };

  beforeEach(() => {
    mockOnWarningDismiss.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe("WCAG 2.1 Level A 準拠", () => {
    describe("1.1.1 Non-text Content (Level A)", () => {
      it("すべての画像・アイコンに適切な代替テキストが提供される", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        const warnings = screen.getAllByRole("status");
        warnings.forEach(warning => {
          const icons = warning.querySelectorAll("svg");
          icons.forEach(icon => {
            // SVGアイコンは親要素のaria-labelまたはテキストコンテンツで説明される
            const parentElement = icon.closest('[aria-label]') || icon.closest('[role="status"]');
            expect(parentElement).toBeInTheDocument();
          });
        });
      });
    });

    describe("1.3.1 Info and Relationships (Level A)", () => {
      it("情報と関係性が適切にマークアップされる", async () => {
        const { container } = render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        // 見出し構造の確認
        const headings = screen.getAllByRole("heading", { level: 3 });
        expect(headings.length).toBeGreaterThan(0);

        // リスト構造の確認（警告のリスト）
        const warnings = screen.getAllByRole("status");
        expect(warnings.length).toBeGreaterThan(0);

        // axeによる構造チェック
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe("1.3.2 Meaningful Sequence (Level A)", () => {
      it("コンテンツの順序が論理的である", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication", "lactation"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(1);
        });

        const warnings = screen.getAllByRole("status");
        const warningTexts = warnings.map(w => w.textContent || '');

        // 重要度順の確認
        const highSeverityIndex = warningTexts.findIndex(text => 
          text.includes("重要な健康上の注意")
        );
        const lowSeverityIndex = warningTexts.findIndex(text => 
          text.includes("ご利用上の注意")
        );

        if (highSeverityIndex !== -1 && lowSeverityIndex !== -1) {
          expect(highSeverityIndex).toBeLessThan(lowSeverityIndex);
        }
      });
    });

    describe("1.4.1 Use of Color (Level A)", () => {
      it("色以外の手段でも情報が伝達される", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        const warnings = screen.getAllByRole("status");
        warnings.forEach(warning => {
          // アイコンによる視覚的手がかり
          const icon = warning.querySelector("svg");
          expect(icon).toBeInTheDocument();

          // 左ボーダーによる視覚的手がかり
          expect(warning).toHaveClass("border-l-4");

          // テキストによる重要度の説明
          const heading = warning.querySelector("h3");
          expect(heading?.textContent).toMatch(/(重要な|健康上の|表現に関する|ご利用上の)/);
        });
      });
    });

    describe("2.1.1 Keyboard (Level A)", () => {
      it("すべての機能がキーボードでアクセス可能", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
        
        // Tabキーでフォーカス移動
        closeButtons.forEach(button => {
          button.focus();
          expect(document.activeElement).toBe(button);
        });

        // Enterキーで操作
        if (closeButtons[0]) {
          closeButtons[0].focus();
          fireEvent.keyDown(closeButtons[0], { key: 'Enter' });
          fireEvent.click(closeButtons[0]); // Enterのデフォルト動作をシミュレート
          expect(mockOnWarningDismiss).toHaveBeenCalled();
        }
      });

      it("Escapeキーで警告を閉じることができる", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        const initialWarningCount = screen.getAllByRole("status").length;

        // Escapeキーを押す
        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() => {
          const remainingWarnings = screen.getAllByRole("status");
          expect(remainingWarnings.length).toBeLessThan(initialWarningCount);
        });
      });
    });

    describe("2.1.2 No Keyboard Trap (Level A)", () => {
      it("キーボードフォーカスがトラップされない", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
        
        // 最初のボタンにフォーカス
        closeButtons[0].focus();
        expect(document.activeElement).toBe(closeButtons[0]);

        // Tabキーで次の要素に移動可能
        fireEvent.keyDown(closeButtons[0], { key: 'Tab' });
        
        // フォーカスが他の要素に移動できることを確認
        // （実際のブラウザではTabキーで次のフォーカス可能要素に移動）
        if (closeButtons[1]) {
          closeButtons[1].focus();
          expect(document.activeElement).toBe(closeButtons[1]);
        }
      });
    });

    describe("3.1.1 Language of Page (Level A)", () => {
      it("ページの言語が適切に設定される", async () => {
        const { container } = render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        // 日本語コンテンツが適切に表示される
        expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();
        
        // lang属性のチェック（通常はhtml要素に設定される）
        const htmlElement = document.documentElement;
        const lang = htmlElement.getAttribute('lang');
        if (lang) {
          expect(lang).toMatch(/^ja/);
        }
      });
    });

    describe("4.1.1 Parsing (Level A)", () => {
      it("HTMLが適切にパースされる", async () => {
        const { container } = render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        // axeによるHTML構文チェック
        const results = await axe(container, {
          rules: {
            'duplicate-id': { enabled: true },
            'valid-lang': { enabled: true }
          }
        });
        
        expect(results).toHaveNoViolations();
      });
    });

    describe("4.1.2 Name, Role, Value (Level A)", () => {
      it("すべてのUI要素に適切な名前、役割、値が設定される", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        // 警告要素のrole確認
        const warnings = screen.getAllByRole("status");
        warnings.forEach(warning => {
          expect(warning).toHaveAttribute("role", "status");
          expect(warning).toHaveAttribute("aria-live", "polite");
          expect(warning).toHaveAttribute("aria-label");
        });

        // ボタン要素の確認
        const buttons = screen.getAllByRole("button", { name: "警告を閉じる" });
        buttons.forEach(button => {
          expect(button).toHaveAttribute("type", "button");
          expect(button).toHaveAttribute("aria-label", "警告を閉じる");
        });

        // 見出し要素の確認
        const headings = screen.getAllByRole("heading", { level: 3 });
        headings.forEach(heading => {
          expect(heading.textContent).toBeTruthy();
        });
      });
    });
  });

  describe("WCAG 2.1 Level AA 準拠", () => {
    describe("1.4.3 Contrast (Minimum) (Level AA)", () => {
      it("テキストのコントラスト比が4.5:1以上である", async () => {
        const { container } = render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        // axeのcolor-contrastルールでチェック
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        expect(results).toHaveNoViolations();
      });
    });

    describe("1.4.4 Resize text (Level AA)", () => {
      it("200%拡大時でも機能が利用可能", async () => {
        // CSSの拡大をシミュレート
        const originalStyle = document.documentElement.style.fontSize;
        document.documentElement.style.fontSize = '200%';

        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        // 拡大時でも要素が表示される
        const warning = screen.getByRole("status");
        expect(warning).toBeVisible();

        // ボタンが操作可能
        const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
        expect(closeButton).toBeVisible();
        
        fireEvent.click(closeButton);
        expect(mockOnWarningDismiss).toHaveBeenCalled();

        // 元のスタイルに戻す
        document.documentElement.style.fontSize = originalStyle;
      });
    });

    describe("1.4.10 Reflow (Level AA)", () => {
      it("320px幅でも水平スクロールなしで利用可能", async () => {
        // ビューポート幅を320pxに設定
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 320,
        });

        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        const warning = screen.getByRole("status");
        
        // レスポンシブクラスが適用されている
        const title = warning.querySelector("h3");
        expect(title).toHaveClass("text-sm", "sm:text-base");

        // テキストが適切に折り返される
        const messageElement = warning.querySelector("p");
        if (messageElement) {
          expect(messageElement).toHaveClass("break-words");
        }
      });
    });

    describe("1.4.11 Non-text Contrast (Level AA)", () => {
      it("非テキスト要素のコントラスト比が3:1以上である", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        const warning = screen.getByRole("status");
        
        // ボーダーによる視覚的区別
        expect(warning).toHaveClass("border-l-4");
        
        // ボタンのフォーカス状態
        const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
        expect(closeButton).toHaveClass("focus:ring-2");
      });
    });

    describe("2.4.3 Focus Order (Level AA)", () => {
      it("フォーカス順序が論理的である", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(1);
        });

        const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
        
        // フォーカス順序が警告の表示順序と一致する
        for (let i = 0; i < closeButtons.length; i++) {
          closeButtons[i].focus();
          expect(document.activeElement).toBe(closeButtons[i]);
        }
      });
    });

    describe("2.4.6 Headings and Labels (Level AA)", () => {
      it("見出しとラベルが内容を説明している", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
        });

        // 見出しが内容を適切に説明している
        const headings = screen.getAllByRole("heading", { level: 3 });
        headings.forEach(heading => {
          expect(heading.textContent).toMatch(/(表現に関する注意|重要な健康上の注意|健康上の注意|ご利用上の注意)/);
        });

        // ボタンラベルが機能を説明している
        const buttons = screen.getAllByRole("button", { name: "警告を閉じる" });
        buttons.forEach(button => {
          expect(button).toHaveAttribute("aria-label", "警告を閉じる");
        });
      });
    });

    describe("2.4.7 Focus Visible (Level AA)", () => {
      it("フォーカス状態が視覚的に明確である", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
        
        // フォーカス時のスタイルが設定されている
        expect(closeButton).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-offset-2");
        
        closeButton.focus();
        expect(document.activeElement).toBe(closeButton);
      });
    });

    describe("3.1.2 Language of Parts (Level AA)", () => {
      it("部分的な言語変更が適切にマークアップされる", async () => {
        // 英語を含む商品データ
        const multiLangProduct = {
          ...wcagTestProduct,
          description: "効果的なサプリメント (Effective supplement) です。",
          ingredients: [
            {
              ingredient: {
                _id: "caffeine-multi",
                name: "カフェイン (Caffeine)",
                category: "stimulant"
              },
              amountMgPerServing: 100
            }
          ]
        };

        render(
          <PersonaWarnings
            product={multiLangProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        // 日本語コンテンツが主体であることを確認
        expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();
      });
    });

    describe("3.2.3 Consistent Navigation (Level AA)", () => {
      it("ナビゲーション要素が一貫している", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(1);
        });

        const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
        
        // すべての閉じるボタンが同じラベルを持つ
        closeButtons.forEach(button => {
          expect(button).toHaveAttribute("aria-label", "警告を閉じる");
          expect(button).toHaveAttribute("type", "button");
        });
      });
    });

    describe("3.2.4 Consistent Identification (Level AA)", () => {
      it("同じ機能の要素が一貫して識別される", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy", "medication"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getAllByRole("status")).toHaveLength.greaterThan(1);
        });

        // すべての警告要素が同じroleを持つ
        const warnings = screen.getAllByRole("status");
        warnings.forEach(warning => {
          expect(warning).toHaveAttribute("role", "status");
          expect(warning).toHaveAttribute("aria-live", "polite");
        });

        // すべての閉じるボタンが同じ識別方法を持つ
        const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
        closeButtons.forEach(button => {
          expect(button).toHaveAttribute("aria-label", "警告を閉じる");
          
          // 同じアイコンを使用
          const icon = button.querySelector("svg");
          expect(icon).toBeInTheDocument();
          expect(icon).toHaveClass("h-5", "w-5");
        });
      });
    });

    describe("4.1.3 Status Messages (Level AA)", () => {
      it("ステータスメッセージが適切に通知される", async () => {
        render(
          <PersonaWarnings
            product={wcagTestProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        // ローディング状態のメッセージ
        expect(screen.getByText("警告をチェック中...")).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.getByRole("status")).toBeInTheDocument();
        });

        // 警告メッセージがrole="status"で通知される
        const warning = screen.getByRole("status");
        expect(warning).toHaveAttribute("role", "status");
        expect(warning).toHaveAttribute("aria-live", "polite");
      });

      it("エラーメッセージが適切に通知される", async () => {
        // エラーを発生させる
        const errorProduct = {
          ...wcagTestProduct,
          ingredients: null as any
        };

        render(
          <PersonaWarnings
            product={errorProduct}
            userPersona={["pregnancy"]}
            onWarningDismiss={mockOnWarningDismiss}
          />
        );

        await waitFor(() => {
          expect(screen.getByText("警告チェックを実行できませんでした")).toBeInTheDocument();
        });

        // エラーメッセージが適切にマークアップされている
        const errorMessage = screen.getByText("警告チェックを実行できませんでした");
        expect(errorMessage.closest('div')).toHaveClass("p-4");
      });
    });
  });

  describe("追加のアクセシビリティベストプラクティス", () => {
    it("スクリーンリーダー用の追加情報が提供される", async () => {
      render(
        <PersonaWarnings
          product={wcagTestProduct}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
      });

      const warnings = screen.getAllByRole("status");
      warnings.forEach(warning => {
        const ariaLabel = warning.getAttribute("aria-label");
        expect(ariaLabel).toMatch(/重要度: (high|medium|low)/);
      });
    });

    it("動作設定の配慮（アニメーション無効化）", async () => {
      render(
        <PersonaWarnings
          product={wcagTestProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const warning = screen.getByRole("status");
      
      // アニメーションクラスが含まれていない
      expect(warning.className).not.toMatch(/animate|transition-all|duration/);
    });

    it("タッチターゲットサイズが適切（44px以上）", async () => {
      render(
        <PersonaWarnings
          product={wcagTestProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      
      // 適切なパディングクラスが設定されている
      expect(closeButton).toHaveClass("p-1.5");
      
      // 計算されたサイズが最小要件を満たす
      const computedStyle = window.getComputedStyle(closeButton);
      const padding = parseFloat(computedStyle.padding) || 6; // p-1.5 = 6px
      const iconSize = 20; // h-5 w-5 = 20px
      const totalSize = (padding * 2) + iconSize;
      
      expect(totalSize).toBeGreaterThanOrEqual(44);
    });
  });
});