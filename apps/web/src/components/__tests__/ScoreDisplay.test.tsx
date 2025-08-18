import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreDisplay } from "../ScoreDisplay";
import type { ScoreResult } from "@/lib/scoring";

// Mock score result data
const mockCompleteScoreResult: ScoreResult = {
  total: 78.5,
  components: {
    evidence: 85,
    safety: 75,
    cost: 70,
    practicality: 80,
  },
  weights: {
    evidence: 0.35,
    safety: 0.3,
    cost: 0.2,
    practicality: 0.15,
  },
  breakdown: {
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
        { name: "禁忌事項", value: 80, weight: 0.25, description: "2件の禁忌" },
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
        { name: "容量", value: 60, weight: 0.3, description: "15日分" },
      ],
      explanation: "実用性スコアは使いやすさを評価します",
    },
  },
  isComplete: true,
  missingData: [],
};

const mockIncompleteScoreResult: ScoreResult = {
  ...mockCompleteScoreResult,
  total: 65.0,
  isComplete: false,
  missingData: ["成分エビデンス情報", "副作用レベル"],
};

describe("ScoreDisplay", () => {
  it("総合スコアと評価ラベルを表示する", () => {
    render(<ScoreDisplay scoreResult={mockCompleteScoreResult} />);

    expect(screen.getByText("78.5")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
    expect(screen.getByText("良好")).toBeInTheDocument();
  });

  it("適切なARIA属性が設定されている", () => {
    render(<ScoreDisplay scoreResult={mockCompleteScoreResult} />);

    // Main section has proper role and label
    expect(
      screen.getByRole("region", { name: "製品総合スコア" }),
    ).toBeInTheDocument();

    // Progress bar has proper attributes
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-valuenow", "78.5");

    // Score has live region
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("スコアに応じた色分けを適用する", () => {
    const { rerender } = render(
      <ScoreDisplay scoreResult={mockCompleteScoreResult} />,
    );

    // Good score (60-79) should have blue color
    expect(screen.getByText("良好")).toHaveClass(
      "text-blue-600",
      "bg-blue-100",
    );

    // Test excellent score (80+)
    const excellentScore = { ...mockCompleteScoreResult, total: 85 };
    rerender(<ScoreDisplay scoreResult={excellentScore} />);
    expect(screen.getByText("優秀")).toHaveClass(
      "text-green-600",
      "bg-green-100",
    );

    // Test fair score (40-59)
    const fairScore = { ...mockCompleteScoreResult, total: 45 };
    rerender(<ScoreDisplay scoreResult={fairScore} />);
    expect(screen.getByText("普通")).toHaveClass(
      "text-yellow-600",
      "bg-yellow-100",
    );

    // Test poor score (0-39)
    const poorScore = { ...mockCompleteScoreResult, total: 25 };
    rerender(<ScoreDisplay scoreResult={poorScore} />);
    expect(screen.getByText("要改善")).toHaveClass(
      "text-red-600",
      "bg-red-100",
    );
  });

  it("データ完全性を適切に表示する", () => {
    const { rerender } = render(
      <ScoreDisplay scoreResult={mockCompleteScoreResult} />,
    );

    expect(screen.getByText("全データに基づく総合評価")).toBeInTheDocument();

    rerender(<ScoreDisplay scoreResult={mockIncompleteScoreResult} />);
    expect(screen.getByText("一部データ不足（2項目）")).toBeInTheDocument();
  });

  it("データ不足時に警告を表示する", () => {
    render(<ScoreDisplay scoreResult={mockIncompleteScoreResult} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("データ不足による制限")).toBeInTheDocument();
    expect(screen.getByText("成分エビデンス情報")).toBeInTheDocument();
    expect(screen.getByText("副作用レベル")).toBeInTheDocument();
  });

  it("showBreakdownがtrueの時にコンポーネントスコアを表示する", () => {
    render(
      <ScoreDisplay
        scoreResult={mockCompleteScoreResult}
        showBreakdown={true}
      />,
    );

    expect(screen.getByText("エビデンス")).toBeInTheDocument();
    expect(screen.getByText("安全性")).toBeInTheDocument();
    expect(screen.getByText("コスト")).toBeInTheDocument();
    expect(screen.getByText("実用性")).toBeInTheDocument();

    // Check weight percentages
    expect(screen.getByText("(35%)")).toBeInTheDocument();
    expect(screen.getByText("(30%)")).toBeInTheDocument();
    expect(screen.getByText("(20%)")).toBeInTheDocument();
    expect(screen.getByText("(15%)")).toBeInTheDocument();
  });

  it("レスポンシブデザインで表示される", () => {
    render(
      <ScoreDisplay
        scoreResult={mockCompleteScoreResult}
        showBreakdown={true}
      />,
    );

    // Check for responsive grid classes
    const componentGrid = screen.getByText("エビデンス").closest(".grid");
    expect(componentGrid).toHaveClass("grid-cols-2", "md:grid-cols-4");
  });

  it("キーボードナビゲーションに対応している", () => {
    render(<ScoreDisplay scoreResult={mockCompleteScoreResult} />);

    // Check that focusable elements have proper focus styles
    const section = screen.getByRole("region", { name: "製品総合スコア" });
    expect(section).toBeInTheDocument();
  });

  it("境界値スコアを正しく処理する", () => {
    const boundaryScores = [
      { score: 0, label: "要改善", color: "text-red-600" },
      { score: 39, label: "要改善", color: "text-red-600" },
      { score: 40, label: "普通", color: "text-yellow-600" },
      { score: 59, label: "普通", color: "text-yellow-600" },
      { score: 60, label: "良好", color: "text-blue-600" },
      { score: 79, label: "良好", color: "text-blue-600" },
      { score: 80, label: "優秀", color: "text-green-600" },
      { score: 100, label: "優秀", color: "text-green-600" },
    ];

    boundaryScores.forEach(({ score, label, color }) => {
      const testScore = { ...mockCompleteScoreResult, total: score };
      const { unmount } = render(<ScoreDisplay scoreResult={testScore} />);

      expect(screen.getByText(label)).toHaveClass(color);
      expect(screen.getByText(score.toString())).toBeInTheDocument();

      unmount();
    });
  });
});
