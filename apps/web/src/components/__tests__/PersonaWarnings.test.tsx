import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PersonaWarnings } from "../PersonaWarnings";
import type { Persona } from "@/lib/persona-rules";

// Mock the dependencies
vi.mock("@/lib/persona-rules", () => ({
  checkPersonaRules: vi.fn(),
}));

vi.mock("@/lib/compliance", () => ({
  checkText: vi.fn(),
}));

vi.mock("../WarningBanner", () => ({
  WarningBannerList: ({ warnings, onDismiss }: any) => (
    <div data-testid="warning-banner-list">
      {warnings.map((warning: any) => (
        <div key={warning.id} data-testid={`warning-${warning.id}`}>
          <span>{warning.message}</span>
          <button onClick={() => onDismiss(warning.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  ),
}));

import { checkPersonaRules } from "@/lib/persona-rules";
import { checkText } from "@/lib/compliance";

const mockCheckPersonaRules = vi.mocked(checkPersonaRules);
const mockCheckText = vi.mocked(checkText);

describe("PersonaWarnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPersonaRules.mockReturnValue([]);
    mockCheckText.mockReturnValue([]);
  });

  describe("基本的なレンダリング", () => {
    it("警告がない場合は何も表示されない", () => {
      mockCheckPersonaRules.mockReturnValue([]);
      mockCheckText.mockReturnValue([]);

      const { container } = render(
        <PersonaWarnings
          text="安全な製品です"
          ingredients={["ビタミンC"]}
          personas={["general"]}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("ペルソナ警告が正しく表示される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
        />,
      );

      expect(screen.getByTestId("warning-banner-list")).toBeInTheDocument();
      expect(
        screen.getByText("妊娠中の方は注意が必要です"),
      ).toBeInTheDocument();
    });

    it("コンプライアンス警告が正しく表示される", () => {
      mockCheckText.mockReturnValue([
        {
          pattern: "完治",
          match: "完治",
          suggestion: "改善が期待される",
          position: { start: 0, end: 2 },
        },
      ]);

      render(
        <PersonaWarnings
          text="完治します"
          ingredients={[]}
          personas={["general"]}
          enableCompliance={true}
        />,
      );

      expect(screen.getByTestId("warning-banner-list")).toBeInTheDocument();
      expect(
        screen.getByText(/「完治」は適切ではない表現です/),
      ).toBeInTheDocument();
    });

    it("複数の警告タイプが組み合わされて表示される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      mockCheckText.mockReturnValue([
        {
          pattern: "完治",
          match: "完治",
          suggestion: "改善が期待される",
          position: { start: 0, end: 2 },
        },
      ]);

      render(
        <PersonaWarnings
          text="完治するビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          enableCompliance={true}
        />,
      );

      expect(
        screen.getByText("妊娠中の方は注意が必要です"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/「完治」は適切ではない表現です/),
      ).toBeInTheDocument();
    });
  });

  describe("状態管理", () => {
    it("警告を個別に閉じることができる", async () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
        />,
      );

      const dismissButton = screen.getByText("Dismiss");
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(
          screen.queryByText("妊娠中の方は注意が必要です"),
        ).not.toBeInTheDocument();
      });
    });

    it("onWarningsChangeコールバックが呼ばれる", () => {
      const mockOnWarningsChange = vi.fn();

      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          onWarningsChange={mockOnWarningsChange}
        />,
      );

      expect(mockOnWarningsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "persona",
            severity: "high",
            message: "妊娠中の方は注意が必要です",
          }),
        ]),
      );
    });
  });

  describe("詳細表示", () => {
    it("showDetailsがtrueの場合、詳細ビューが表示される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          showDetails={true}
        />,
      );

      expect(screen.getByText("重要な警告 (1件)")).toBeInTheDocument();
      expect(screen.getByText("詳細を見る")).toBeInTheDocument();
    });

    it("詳細ボタンをクリックすると詳細が展開される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          showDetails={true}
        />,
      );

      const detailButton = screen.getByText("詳細を見る");
      fireEvent.click(detailButton);

      expect(screen.getByText("詳細を閉じる")).toBeInTheDocument();
      expect(screen.getByText("対象成分:")).toBeInTheDocument();
      expect(screen.getByText("ビタミンA")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("適切なARIA属性が設定される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          showDetails={true}
        />,
      );

      expect(
        screen.getByRole("region", { name: "使用上の注意事項" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("スクリーンリーダー用のサマリーが提供される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          showDetails={true}
        />,
      );

      const summary = screen.getByText(/1件の注意事項があります/);
      expect(summary).toHaveClass("sr-only");
      expect(summary).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("エラーハンドリング", () => {
    it("ペルソナルールチェックでエラーが発生してもクラッシュしない", () => {
      mockCheckPersonaRules.mockImplementation(() => {
        throw new Error("Persona rules error");
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <PersonaWarnings
          text="テスト"
          ingredients={["成分"]}
          personas={["general"]}
        />,
      );

      expect(
        screen.getByText(/警告システムでエラーが発生しました/),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("コンプライアンスチェックでエラーが発生しても他の警告は表示される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      mockCheckText.mockImplementation(() => {
        throw new Error("Compliance check error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          enableCompliance={true}
        />,
      );

      expect(
        screen.getByText("妊娠中の方は注意が必要です"),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("設定オプション", () => {
    it("enableComplianceがfalseの場合、コンプライアンスチェックが無効になる", () => {
      mockCheckText.mockReturnValue([
        {
          pattern: "完治",
          match: "完治",
          suggestion: "改善が期待される",
          position: { start: 0, end: 2 },
        },
      ]);

      render(
        <PersonaWarnings
          text="完治します"
          ingredients={[]}
          personas={["general"]}
          enableCompliance={false}
        />,
      );

      expect(mockCheckText).not.toHaveBeenCalled();
    });

    it("カスタムクラス名が適用される", () => {
      mockCheckPersonaRules.mockReturnValue([
        {
          tag: "pregnancy",
          ingredient: "ビタミンA",
          severity: "high",
          message: "妊娠中の方は注意が必要です",
          personas: ["general"],
        },
      ]);

      render(
        <PersonaWarnings
          text="ビタミンA配合"
          ingredients={["ビタミンA"]}
          personas={["general"]}
          className="custom-warnings"
        />,
      );

      expect(screen.getByRole("region")).toHaveClass("custom-warnings");
    });
  });
});
