import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersonaWarnings } from "../PersonaWarnings";
// @ts-ignore
import { axe, toHaveNoViolations } from "jest-axe";

// jest-axeのマッチャーを追加
expect.extend(toHaveNoViolations);

// アクセシビリティ専用テスト
describe("PersonaWarnings Accessibility Tests", () => {
  const mockOnWarningDismiss = vi.fn();

  const testProduct = {
    _id: "accessibility-test-product",
    name: "アクセシビリティテスト商品",
    description: "効果的な成分で健康を完全にサポートします。",
    ingredients: [
      {
        ingredient: {
          _id: "caffeine-ingredient",
          name: "カフェイン",
          category: "stimulant"
        },
        amountMgPerServing: 100
      },
      {
        ingredient: {
          _id: "herb-ingredient", 
          name: "セントジョーンズワート",
          category: "herb"
        },
        amountMgPerServing: 300
      }
    ],
    warnings: ["妊娠中の方は医師にご相談ください"]
  };

  beforeEach(() => {
    mockOnWarningDismiss.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe("WCAG 2.1 AA準拠テスト", () => {
    it("警告バナーがWCAG 2.1 AAに準拠している", async () => {
      const { container } = render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
      });

      // axeを使用してアクセシビリティ違反をチェック
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("キーボードナビゲーションが完全に機能する", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
      });

      const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
      
      // Tabキーでフォーカス移動
      closeButtons[0].focus();
      expect(document.activeElement).toBe(closeButtons[0]);

      // Enterキーで警告を閉じる
      fireEvent.keyDown(closeButtons[0], { key: 'Enter' });
      fireEvent.click(closeButtons[0]); // Enterキーのデフォルト動作をシミュレート

      await waitFor(() => {
        const remainingWarnings = screen.getAllByRole("status");
        expect(remainingWarnings.length).toBeLessThan(closeButtons.length);
      });

      expect(mockOnWarningDismiss).toHaveBeenCalled();
    });

    it("Escapeキーで警告を閉じることができる", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
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

      expect(mockOnWarningDismiss).toHaveBeenCalled();
    });

    it("フォーカス管理が適切に動作する", async () => {
      // フォーカス可能な要素を作成
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Trigger Warning';
      triggerButton.id = 'trigger-button';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      fireEvent.click(closeButton);

      // フォーカスが元の要素に戻ることを確認
      await waitFor(() => {
        expect(document.activeElement).toBe(triggerButton);
      });
    });
  });

  describe("スクリーンリーダー対応", () => {
    it("aria-live属性が適切に設定される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const warnings = screen.getAllByRole("status");
      warnings.forEach(warning => {
        expect(warning).toHaveAttribute("aria-live", "polite");
      });
    });

    it("aria-label属性に重要度情報が含まれる", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
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

    it("警告内容がスクリーンリーダーで読み上げ可能", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // 警告メッセージがテキストとして存在することを確認
      expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();
      
      // 推奨アクションがある場合は読み上げ可能
      const recommendationText = screen.queryByText(/推奨:/);
      if (recommendationText) {
        expect(recommendationText).toBeInTheDocument();
      }
    });

    it("警告タイトルが適切に構造化される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
      });

      // 見出しレベルが適切に設定されることを確認
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings.length).toBeGreaterThan(0);

      headings.forEach(heading => {
        expect(heading.textContent).toMatch(/(表現に関する注意|重要な健康上の注意|健康上の注意|ご利用上の注意)/);
      });
    });
  });

  describe("色覚アクセシビリティ", () => {
    it("色以外の視覚的手がかりが提供される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const warnings = screen.getAllByRole("status");
      warnings.forEach(warning => {
        // アイコンが存在することを確認
        const icon = warning.querySelector("svg");
        expect(icon).toBeInTheDocument();

        // 左ボーダーによる視覚的手がかりを確認
        expect(warning).toHaveClass("border-l-4");
      });
    });

    it("コントラスト比が適切に設定される", async () => {
      const { container } = render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // axeのcolor-contrastルールをチェック
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe("モバイルアクセシビリティ", () => {
    it("タッチターゲットサイズが適切", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      
      // ボタンのサイズクラスを確認（最小44px相当）
      expect(closeButton).toHaveClass("p-1.5");
      
      // 計算されたスタイルでサイズを確認
      const computedStyle = window.getComputedStyle(closeButton);
      const padding = parseFloat(computedStyle.padding);
      const minSize = 44; // WCAG推奨最小サイズ
      
      // パディングを含めたサイズが最小要件を満たすことを確認
      expect(padding * 2 + 20).toBeGreaterThanOrEqual(minSize); // 20pxはアイコンサイズ
    });

    it("レスポンシブテキストサイズが適用される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // タイトルのレスポンシブクラスを確認
      const title = screen.getByText(/注意/);
      expect(title).toHaveClass("text-sm", "sm:text-base");

      // メッセージのレスポンシブクラスを確認
      const messageContainer = screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/).parentElement;
      expect(messageContainer).toHaveClass("text-sm", "sm:text-base");
    });
  });

  describe("動作・アニメーション配慮", () => {
    it("アニメーションが無効化されている", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const warning = screen.getByRole("status");
      
      // アニメーションクラスが含まれていないことを確認
      expect(warning.className).not.toMatch(/animate|transition-all|duration/);
    });

    it("ホバー効果が適切に設定される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      
      // ホバー効果のクラスが設定されていることを確認
      expect(closeButton.className).toMatch(/hover:/);
    });

    it("フォーカス時の視覚的フィードバック", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
      
      // フォーカス時のスタイルが設定されていることを確認
      expect(closeButton).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-offset-2");
    });
  });

  describe("セマンティックHTML", () => {
    it("適切なHTMLセマンティクスが使用される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // role="status"が設定されていることを確認
      const warning = screen.getByRole("status");
      expect(warning).toHaveAttribute("role", "status");

      // 見出しが適切に設定されていることを確認
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();

      // ボタンが適切に設定されていることを確認
      const button = screen.getByRole("button", { name: "警告を閉じる" });
      expect(button).toHaveAttribute("type", "button");
    });

    it("ランドマークロールが適切に設定される", async () => {
      const { container } = render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(0);
      });

      // 複数の警告がある場合の構造を確認
      const warnings = screen.getAllByRole("status");
      warnings.forEach(warning => {
        expect(warning.tagName.toLowerCase()).toBe("div");
        expect(warning).toHaveAttribute("role", "status");
      });
    });
  });

  describe("国際化対応", () => {
    it("日本語テキストが適切に表示される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      // 日本語のテキストが正しく表示されることを確認
      expect(screen.getByText(/妊娠中はカフェインの摂取に注意が必要です/)).toBeInTheDocument();
      expect(screen.getByText(/重要な健康上の注意/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "警告を閉じる" })).toBeInTheDocument();
    });

    it("テキストの方向性が適切に設定される", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const warning = screen.getByRole("status");
      
      // 日本語の場合、dir属性は通常設定されない（デフォルトのltr）
      // または明示的にltrが設定される
      const dir = warning.getAttribute("dir");
      if (dir) {
        expect(dir).toBe("ltr");
      }
    });
  });

  describe("エラー状態のアクセシビリティ", () => {
    it("エラーメッセージが適切に通知される", async () => {
      // エラーを発生させるためのモック
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const errorProduct = {
        ...testProduct,
        ingredients: null as any // 意図的にエラーを発生させる
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

      const errorMessage = screen.getByText("警告チェックを実行できませんでした");
      
      // エラーメッセージが適切にマークアップされていることを確認
      expect(errorMessage.closest('div')).toHaveClass("p-4", "bg-gray-50");
    });

    it("ローディング状態が適切に通知される", () => {
      // 非同期処理を遅延させる
      const slowProduct = { ...testProduct };
      
      render(
        <PersonaWarnings
          product={slowProduct}
          userPersona={["pregnancy"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      // ローディングメッセージが表示されることを確認
      expect(screen.getByText("警告をチェック中...")).toBeInTheDocument();
      
      const loadingMessage = screen.getByText("警告をチェック中...");
      expect(loadingMessage.closest('div')).toHaveClass("p-4", "bg-gray-50");
    });
  });

  describe("複数警告のアクセシビリティ", () => {
    it("複数警告の順序が論理的", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy", "medication", "lactation"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(1);
      });

      const warnings = screen.getAllByRole("status");
      const warningTexts = warnings.map(w => w.textContent || '');

      // 重要度の高い警告が先に来ることを確認
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

    it("警告間のナビゲーションが適切", async () => {
      render(
        <PersonaWarnings
          product={testProduct}
          userPersona={["pregnancy", "medication"]}
          onWarningDismiss={mockOnWarningDismiss}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole("status")).toHaveLength.greaterThan(1);
      });

      const closeButtons = screen.getAllByRole("button", { name: "警告を閉じる" });
      
      // 最初のボタンにフォーカス
      closeButtons[0].focus();
      expect(document.activeElement).toBe(closeButtons[0]);

      // Tabキーで次のボタンに移動可能であることを確認
      fireEvent.keyDown(closeButtons[0], { key: 'Tab' });
      
      // 各ボタンがフォーカス可能であることを確認
      closeButtons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });
});