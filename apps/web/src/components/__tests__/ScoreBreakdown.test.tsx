import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreBreakdown } from "../ScoreBreakdown";
import type { ScoreResult } from "@/lib/scoring";

// Mock breakdown data
const mockBreakdown: ScoreResult["breakdown"] = {
  evidence: {
    score: 85,
    factors: [
      {
        name: "エビデンスレベル",
        value: 90,
        weight: 0.4,
        description: "A級エビデンス",
      },
      { name: "研究数", value: 80, weight: 0.3, description: "15件の研究" },
      { name: "研究品質", value: 85, weight: 0.3, description: "RCT中心" },
    ],
    explanation: "エビデンススコアは科学的根拠の質と量を評価します",
  },
  safety: {
    score: 75,
    factors: [
      {
        name: "副作用リスク",
        value: 85,
        weight: 0.4,
        description: "軽微な副作用",
      },
      {
        name: "相互作用リスク",
        value: 70,
        weight: 0.35,
        description: "中程度のリスク",
      },
    ],
    explanation: "安全性スコアは副作用や相互作用のリスクを評価します",
  },
  cost: {
    score: 70,
    factors: [
      {
        name: "1日あたりコスト",
        value: 70,
        weight: 1.0,
        description: "200円/日",
      },
    ],
    explanation: "コストスコアは価格対効果を評価します",
  },
  practicality: {
    score: 80,
    factors: [
      { name: "摂取頻度", value: 85, weight: 0.4, description: "1日2回" },
      { name: "剤形", value: 100, weight: 0.3, description: "カプセル" },
    ],
    explanation: "実用性スコアは使いやすさを評価します",
  },
};

const mockWeights: ScoreResult["weights"] = {
  evidence: 0.35,
  safety: 0.3,
  cost: 0.2,
  practicality: 0.15,
};

describe("ScoreBreakdown", () => {
  it("各要素の詳細スコアを表示する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    // Check component names in headings
    expect(
      screen.getByRole("heading", { name: /エビデンス/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /安全性/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /コスト/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /実用性/ })).toBeInTheDocument();

    // Check scores
    expect(screen.getByLabelText("エビデンススコア 85点")).toBeInTheDocument();
    expect(screen.getByLabelText("安全性スコア 75点")).toBeInTheDocument();
    expect(screen.getByLabelText("コストスコア 70点")).toBeInTheDocument();
    expect(screen.getByLabelText("実用性スコア 80点")).toBeInTheDocument();
  });

  it("重み付けを視覚的に表現する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    expect(screen.getByText("(重み: 35%)")).toBeInTheDocument();
    expect(screen.getByText("(重み: 30%)")).toBeInTheDocument();
    expect(screen.getByText("(重み: 20%)")).toBeInTheDocument();
    expect(screen.getByText("(重み: 15%)")).toBeInTheDocument();
  });

  it("適切なARIA属性が設定されている", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    // Main section has proper role and label
    expect(
      screen.getByRole("region", { name: "スコア詳細内訳" }),
    ).toBeInTheDocument();

    // Progress bars have proper attributes
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);

    progressBars.forEach((progressBar) => {
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
      expect(progressBar).toHaveAttribute("aria-valuenow");
    });

    // Expandable buttons have proper attributes
    const expandButtons = screen.getAllByRole("button");
    expandButtons.forEach((button) => {
      if (button.getAttribute("aria-expanded") !== null) {
        expect(button).toHaveAttribute("aria-expanded");
        expect(button).toHaveAttribute("aria-controls");
      }
    });
  });

  it("展開/折りたたみ機能が動作する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    const evidenceButton = screen.getByRole("button", { name: /エビデンス/ });

    // Initially collapsed
    expect(evidenceButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("詳細要因")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(evidenceButton);
    expect(evidenceButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("詳細要因")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(evidenceButton);
    expect(evidenceButton).toHaveAttribute("aria-expanded", "false");
  });

  it("詳細要因を正しく表示する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    // Expand evidence section
    const evidenceButton = screen.getByRole("button", { name: /エビデンス/ });
    fireEvent.click(evidenceButton);

    // Check factors are displayed
    expect(screen.getByText("エビデンスレベル")).toBeInTheDocument();
    expect(screen.getByText("研究数")).toBeInTheDocument();
    expect(screen.getByText("研究品質")).toBeInTheDocument();

    // Check factor descriptions
    expect(screen.getByText("A級エビデンス")).toBeInTheDocument();
    expect(screen.getByText("15件の研究")).toBeInTheDocument();
    expect(screen.getByText("RCT中心")).toBeInTheDocument();

    // Check contribution percentages (there are multiple 30% factors)
    expect(screen.getByText("(寄与度: 40%)")).toBeInTheDocument();
    expect(screen.getAllByText("(寄与度: 30%)").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("すべて開く/閉じる機能が動作する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    const toggleAllButton = screen.getByRole("button", {
      name: "すべてのセクションを開く",
    });

    // Initially all collapsed
    expect(toggleAllButton).toHaveTextContent("すべて開く");

    // Click to expand all
    fireEvent.click(toggleAllButton);
    expect(toggleAllButton).toHaveTextContent("すべて閉じる");
    expect(toggleAllButton).toHaveAttribute(
      "aria-label",
      "すべてのセクションを閉じる",
    );

    // All sections should be expanded
    const expandButtons = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-expanded") === "true");
    expect(expandButtons.length).toBe(4); // 4 component sections

    // Click to collapse all
    fireEvent.click(toggleAllButton);
    expect(toggleAllButton).toHaveTextContent("すべて開く");
  });

  it("計算根拠と説明を表示する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    // Check explanations are visible
    expect(
      screen.getByText("エビデンススコアは科学的根拠の質と量を評価します"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("安全性スコアは副作用や相互作用のリスクを評価します"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("コストスコアは価格対効果を評価します"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("実用性スコアは使いやすさを評価します"),
    ).toBeInTheDocument();
  });

  it("重み配分サマリーを表示する", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    expect(screen.getByText("重み配分")).toBeInTheDocument();

    // Check weight percentages in summary
    const weightSummary = screen.getByText("重み配分").closest("div");
    expect(weightSummary).toBeInTheDocument();

    // Should show all component weights
    const weightElements = screen.getAllByText(/35%|30%|20%|15%/);
    expect(weightElements.length).toBeGreaterThanOrEqual(8); // 4 in headers + 4 in summary
  });

  it("キーボードナビゲーション対応", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    const buttons = screen.getAllByRole("button");

    buttons.forEach((button) => {
      // All buttons should be focusable
      expect(button).not.toHaveAttribute("tabindex", "-1");

      // Buttons should have proper focus styles (check for focus:outline-none at minimum)
      expect(button).toHaveClass("focus:outline-none");
    });
  });

  it("スクリーンリーダー対応", () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} weights={mockWeights} />);

    // Expand evidence section to check detailed accessibility
    const evidenceButton = screen.getByRole("button", { name: /エビデンス/ });
    fireEvent.click(evidenceButton);

    // Check that expanded content has proper region role (it's labeled by heading, not name)
    const expandedRegion = screen.getByRole("region", { name: "詳細要因" });
    expect(expandedRegion).toBeInTheDocument();

    // Check that factors have proper group roles
    const factorGroups = screen.getAllByRole("group");
    expect(factorGroups.length).toBeGreaterThan(0);
  });

  it("境界値スコアを正しく処理する", () => {
    const boundaryBreakdown = {
      ...mockBreakdown,
      evidence: {
        ...mockBreakdown.evidence,
        score: 0,
        factors: [
          {
            name: "テスト要因",
            value: 0,
            weight: 1.0,
            description: "最小値テスト",
          },
        ],
      },
    };

    render(
      <ScoreBreakdown breakdown={boundaryBreakdown} weights={mockWeights} />,
    );

    expect(screen.getByLabelText("エビデンススコア 0点")).toBeInTheDocument();

    // Expand to check factor display
    const evidenceButton = screen.getByRole("button", { name: /エビデンス/ });
    fireEvent.click(evidenceButton);

    expect(screen.getByLabelText("テスト要因の値 0点")).toBeInTheDocument();
  });
});
