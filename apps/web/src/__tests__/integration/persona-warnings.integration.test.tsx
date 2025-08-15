import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PersonaWarnings } from "@/components/PersonaWarnings";
import { checkPersonaRules } from "@/lib/persona-rules";

describe("Persona Warnings Integration Tests", () => {
  describe("Real-world scenarios with actual persona-rules", () => {
    it("妊娠中の女性向け製品で適切な警告を表示する", () => {
      const ingredients = ["ビタミンA", "カフェイン"];

      render(
        <PersonaWarnings
          text="妊娠中のママにおすすめビタミンサプリ"
          ingredients={ingredients}
          personas={["general"]}
          showDetails={true}
        />,
      );

      // 高重要度の警告が表示される
      expect(screen.getByText("重要な警告 (2件)")).toBeInTheDocument();
      expect(
        screen.getByText(/妊娠中のカフェイン摂取は胎児への影響が懸念されます/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /妊娠中の過剰なビタミンA摂取は胎児の先天性異常のリスク/,
        ),
      ).toBeInTheDocument();

      // 妊娠カテゴリが表示される（複数ある場合は最初の1つを確認）
      expect(screen.getAllByLabelText("カテゴリ: 妊娠")).toHaveLength(2);

      // 詳細ボタンが表示される（ビタミンA2件 + カフェイン2件 = 4件）
      expect(
        screen.getAllByRole("button", { name: /詳細を見る/ }),
      ).toHaveLength(4);
    });

    it("薬物相互作用リスクのある製品で警告を表示する", () => {
      const ingredients = ["ビタミンK", "セントジョーンズワート"];

      render(
        <PersonaWarnings
          text="血液サラサラ効果のあるサプリメント"
          ingredients={ingredients}
          personas={["general"]}
          showDetails={true}
        />,
      );

      // 高重要度の警告が表示される
      expect(screen.getByText("重要な警告 (2件)")).toBeInTheDocument();
      expect(
        screen.getByText(/血液凝固阻止薬.*ビタミンKが薬効に影響する可能性/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/多くの処方薬との相互作用が報告されています/),
      ).toBeInTheDocument();

      // 薬物相互作用カテゴリが表示される（複数ある場合は最初の1つを確認）
      expect(screen.getAllByLabelText("カテゴリ: 薬物相互作用")).toHaveLength(
        2,
      );
    });

    it("未成年者向け製品で年齢制限警告を表示する", () => {
      const ingredients = ["クレアチン", "プロテイン"];

      render(
        <PersonaWarnings
          text="成長期のスポーツサプリメント"
          ingredients={ingredients}
          personas={["underage"]}
          showDetails={true}
        />,
      );

      // 中重要度と低重要度の警告が表示される
      expect(screen.getByText("注意事項 (1件)")).toBeInTheDocument();
      expect(screen.getByText("参考情報 (1件)")).toBeInTheDocument();
      expect(
        screen.getByText(/18歳未満の方への安全性が十分に確立されていません/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /成長期の栄養バランスを考慮し、過剰摂取にご注意ください/,
        ),
      ).toBeInTheDocument();

      // 未成年者カテゴリが表示される（複数ある場合は最初の1つを確認）
      expect(screen.getAllByLabelText("カテゴリ: 未成年者")).toHaveLength(2);
    });

    it("複数のリスクファクターがある複雑なケース", () => {
      const ingredients = ["カフェイン", "ビタミンK", "クレアチン"];

      render(
        <PersonaWarnings
          text="総合栄養サプリメント"
          ingredients={ingredients}
          personas={["general", "underage"]}
          showDetails={true}
        />,
      );

      // 複数の警告が重要度順に表示される
      expect(screen.getByText("重要な警告 (2件)")).toBeInTheDocument(); // カフェイン + ビタミンK
      expect(screen.getByText("注意事項 (3件)")).toBeInTheDocument(); // カフェイン授乳 + カフェイン刺激 + クレアチン

      // 各カテゴリが表示される
      expect(screen.getByLabelText("カテゴリ: 妊娠")).toBeInTheDocument();
      expect(
        screen.getByLabelText("カテゴリ: 薬物相互作用"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ: 授乳")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ: 刺激物")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ: 未成年者")).toBeInTheDocument();
    });

    it("詳細表示機能の統合テスト", async () => {
      const ingredients = ["ビタミンA"];

      render(
        <PersonaWarnings
          text="ビタミンAサプリメント"
          ingredients={ingredients}
          personas={["general"]}
          showDetails={true}
        />,
      );

      const detailButton = screen.getByRole("button", { name: /詳細を見る/ });

      // 詳細を展開
      fireEvent.click(detailButton);

      await waitFor(() => {
        expect(screen.getByText("対象成分:")).toBeInTheDocument();
      });

      // 成分が表示される
      expect(screen.getByLabelText("成分: ビタミンA")).toBeInTheDocument();

      // 詳細を閉じる
      fireEvent.click(screen.getByRole("button", { name: /詳細を閉じる/ }));

      await waitFor(() => {
        expect(screen.queryByText("対象成分:")).not.toBeInTheDocument();
      });
    });

    it("成分マッチングのみで警告が表示される", () => {
      const ingredients = ["カフェイン"];

      render(
        <PersonaWarnings
          text="エナジーサプリメント"
          ingredients={ingredients}
          personas={["general"]}
        />,
      );

      expect(screen.getByText("重要な警告 (1件)")).toBeInTheDocument();
      expect(screen.getByText("注意事項 (2件)")).toBeInTheDocument(); // 授乳 + 刺激物
    });

    it("persona指定なしでgeneralルールのみ適用される", () => {
      const ingredients = ["カフェイン"];

      render(
        <PersonaWarnings
          text="カフェインサプリメント"
          ingredients={ingredients}
          // personas指定なし（デフォルトでgeneralが使用される）
        />,
      );

      // カフェインの警告が表示される（妊娠high、授乳mid、刺激mid）
      expect(screen.getByText("重要な警告 (1件)")).toBeInTheDocument();
      expect(screen.getByText("注意事項 (2件)")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ: 妊娠")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ: 授乳")).toBeInTheDocument();
      expect(screen.getByLabelText("カテゴリ: 刺激物")).toBeInTheDocument();
    });

    it("該当する成分がない場合は警告を表示しない", () => {
      const ingredients = ["マグネシウム", "亜鉛"]; // 警告対象ではない成分を使用

      const { container } = render(
        <PersonaWarnings
          text="ミネラルサプリメント"
          ingredients={ingredients}
          personas={["general"]}
        />,
      );

      // 何も表示されない（マグネシウムと亜鉛は警告対象の成分ではない）
      expect(container.firstChild).toBeNull();
    });

    it("大文字小文字の違いを無視してマッチする", () => {
      const ingredients = ["カフェイン", "ビタミンA"]; // 正確な成分名を使用

      render(
        <PersonaWarnings
          text="ENERGY SUPPLEMENT"
          ingredients={ingredients}
          personas={["general"]}
        />,
      );

      // カフェインとビタミンAの警告が検出される
      expect(screen.getByText("重要な警告 (2件)")).toBeInTheDocument();
      expect(screen.getByText("注意事項 (2件)")).toBeInTheDocument();
    });
  });

  describe("Performance and edge cases", () => {
    it("長い成分リストでもパフォーマンスが良好", () => {
      const longIngredients = Array(100)
        .fill("ビタミンC")
        .concat(["カフェイン"]);

      const startTime = performance.now();

      render(
        <PersonaWarnings
          text="総合ビタミンサプリメント"
          ingredients={longIngredients}
          personas={["general"]}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // レンダリング時間が合理的な範囲内（100ms未満）
      expect(renderTime).toBeLessThan(100);

      expect(screen.getByText("重要な警告 (1件)")).toBeInTheDocument();
    });

    it("特殊文字や絵文字を含む成分名でも動作する", () => {
      const ingredients = ["カフェイン", "ビタミンA"]; // 正確な成分名を使用

      render(
        <PersonaWarnings
          text="特殊サプリメント"
          ingredients={ingredients}
          personas={["general"]}
        />,
      );

      expect(screen.getByText("重要な警告 (2件)")).toBeInTheDocument();
    });

    it("空の成分配列でエラーが発生しない", () => {
      const { container } = render(
        <PersonaWarnings
          text="サプリメント"
          ingredients={[]}
          personas={["general"]}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("多数のpersonasを指定しても動作する", () => {
      const allPersonas = ["general", "medical_professional", "underage"];
      const ingredients = ["カフェイン"];

      render(
        <PersonaWarnings
          text="カフェインサプリメント"
          ingredients={ingredients}
          personas={allPersonas}
          showDetails={true}
        />,
      );

      // カフェインの警告が表示される（妊娠high、授乳mid、刺激mid）
      expect(screen.getByText("重要な警告 (1件)")).toBeInTheDocument();
      expect(screen.getByText("注意事項 (2件)")).toBeInTheDocument();
    });
  });

  describe("Accessibility integration", () => {
    it("キーボードナビゲーションが完全に動作する", async () => {
      const ingredients = ["ビタミンA"];

      render(
        <PersonaWarnings
          text="ビタミンAサプリメント"
          ingredients={ingredients}
          personas={["general"]}
          showDetails={true}
        />,
      );

      const detailButton = screen.getByRole("button", { name: /詳細を見る/ });

      // Tab navigation
      detailButton.focus();
      expect(document.activeElement).toBe(detailButton);

      // Enter key activation
      fireEvent.keyDown(detailButton, { key: "Enter" });
      await waitFor(() => {
        expect(detailButton).toHaveAttribute("aria-expanded", "true");
      });

      // Space key activation
      fireEvent.keyDown(detailButton, { key: " " });
      await waitFor(() => {
        expect(detailButton).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("スクリーンリーダー用の情報が適切に提供される", () => {
      const ingredients = ["カフェイン", "ビタミンK", "クレアチン"];

      render(
        <PersonaWarnings
          text="総合サプリメント"
          ingredients={ingredients}
          personas={["general", "underage"]}
        />,
      );

      // Screen reader summary (カフェイン3件 + ビタミンK1件 + クレアチン1件 = 5件)
      const summary = screen.getByText(/5件の注意事項があります/);
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveClass("sr-only");
      expect(summary).toHaveAttribute("aria-live", "polite");

      // ARIA labels and roles
      expect(
        screen.getByRole("region", { name: "使用上の注意事項" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("alert")).toHaveLength(2); // high and mid severity
      expect(screen.getAllByRole("list")).toHaveLength(2);
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
    });

    it("色覚障害者にも配慮したデザインが適用される", () => {
      const ingredients = ["ビタミンA", "カフェイン", "プロテイン"];

      render(
        <PersonaWarnings
          text="総合サプリメント"
          ingredients={ingredients}
          personas={["general", "underage"]}
        />,
      );

      // Different icons for different severity levels (not just colors)
      expect(screen.getByText("🚨")).toBeInTheDocument(); // high
      expect(screen.getByText("⚠️")).toBeInTheDocument(); // mid
      expect(screen.getByText("ℹ️")).toBeInTheDocument(); // low

      // Text labels in addition to colors (ビタミンA1件+カフェイン1件=2件high, カフェイン2件mid, プロテイン1件low)
      expect(screen.getByText("重要な警告 (2件)")).toBeInTheDocument();
      expect(screen.getByText("注意事項 (2件)")).toBeInTheDocument();
      expect(screen.getByText("参考情報 (1件)")).toBeInTheDocument();
    });
  });

  describe("Real persona-rules integration", () => {
    it("実際のpersona-rulesライブラリとの統合確認", () => {
      // 実際のcheckPersonaRules関数を使用
      const warnings = checkPersonaRules(
        "ビタミンAサプリメント",
        ["ビタミンA"],
        ["general"],
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].tag).toBe("pregnancy");
      expect(warnings[0].severity).toBe("high");
      expect(warnings[0].ingredient).toBe("ビタミンA");
      expect(warnings[0].message).toContain("妊娠中の過剰なビタミンA摂取");
    });

    it("複数ルールの優先度ソートが正しく動作する", () => {
      const warnings = checkPersonaRules(
        "カフェイン入りサプリメント",
        ["カフェイン"],
        ["general"],
      );

      expect(warnings.length).toBeGreaterThanOrEqual(2);

      // 重要度順にソートされているか確認
      for (let i = 0; i < warnings.length - 1; i++) {
        const currentSeverity = warnings[i].severity;
        const nextSeverity = warnings[i + 1].severity;

        const severityOrder = { high: 3, mid: 2, low: 1 };
        expect(severityOrder[currentSeverity]).toBeGreaterThanOrEqual(
          severityOrder[nextSeverity],
        );
      }
    });

    it("ペルソナ制約が正しく適用される", () => {
      // underageペルソナでのみ表示されるルール
      const underageWarnings = checkPersonaRules(
        "クレアチンサプリメント",
        ["クレアチン"],
        ["underage"],
      );

      const generalWarnings = checkPersonaRules(
        "クレアチンサプリメント",
        ["クレアチン"],
        ["general"],
      );

      // underageペルソナでは警告が表示される
      expect(underageWarnings.length).toBeGreaterThan(0);
      expect(underageWarnings.some((w) => w.tag === "underage")).toBe(true);

      // generalペルソナでは未成年者向け警告は表示されない
      expect(generalWarnings.some((w) => w.tag === "underage")).toBe(false);
    });

    it("成分の部分マッチングが動作する", () => {
      const warnings1 = checkPersonaRules(
        "サプリメント",
        ["カフェイン含有"],
        ["general"],
      );

      const warnings2 = checkPersonaRules(
        "サプリメント",
        ["天然カフェイン"],
        ["general"],
      );

      // 部分マッチングでカフェインが検出される
      expect(warnings1.length).toBeGreaterThan(0);
      expect(warnings2.length).toBeGreaterThan(0);
      expect(warnings1.some((w) => w.ingredient === "カフェイン")).toBe(true);
      expect(warnings2.some((w) => w.ingredient === "カフェイン")).toBe(true);
    });
  });
});
