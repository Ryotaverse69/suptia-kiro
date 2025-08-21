import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  WarningHighlight,
  WarningCountDisplay,
  WarningIndicator,
  WarningComparisonSummary,
} from "../WarningHighlight";
import type { Warning, WarningAnalysis } from "@/lib/compare/warning-analyzer";

describe("WarningCountDisplay", () => {
  it("警告がない場合は「警告なし」を表示する", () => {
    render(<WarningCountDisplay count={0} severity="mixed" />);

    expect(screen.getByText("✓ 警告なし")).toBeInTheDocument();
    expect(screen.getByLabelText("警告なし")).toBeInTheDocument();
  });

  it("警告件数を正しく表示する", () => {
    render(<WarningCountDisplay count={3} severity="critical" />);

    expect(screen.getByText("3件")).toBeInTheDocument();
    expect(screen.getByLabelText("警告 3 件")).toBeInTheDocument();
  });

  it("重要度に応じたスタイルが適用される", () => {
    const { rerender } = render(
      <WarningCountDisplay count={1} severity="critical" />,
    );

    let element = screen.getByLabelText("警告 1 件");
    expect(element).toHaveClass("bg-red-100", "text-red-800", "border-red-200");

    rerender(<WarningCountDisplay count={1} severity="warning" />);
    element = screen.getByLabelText("警告 1 件");
    expect(element).toHaveClass(
      "bg-orange-100",
      "text-orange-800",
      "border-orange-200",
    );

    rerender(<WarningCountDisplay count={1} severity="info" />);
    element = screen.getByLabelText("警告 1 件");
    expect(element).toHaveClass(
      "bg-blue-100",
      "text-blue-800",
      "border-blue-200",
    );
  });
});

describe("WarningIndicator", () => {
  const mockWarning: Warning = {
    id: "w1",
    type: "critical",
    category: "pregnancy",
    message: "妊娠中の使用は避けてください",
    severity: 9,
    productId: "p1",
  };

  it("警告情報を正しく表示する", () => {
    render(<WarningIndicator warning={mockWarning} />);

    expect(screen.getByText("pregnancy")).toBeInTheDocument();
    expect(
      screen.getByLabelText("重要な警告: 妊娠中の使用は避けてください"),
    ).toBeInTheDocument();
  });

  it("ハイライト表示が正しく動作する", () => {
    render(<WarningIndicator warning={mockWarning} isHighlighted={true} />);

    const element = screen.getByLabelText(
      "重要な警告: 妊娠中の使用は避けてください",
    );
    expect(element).toHaveClass("ring-2", "ring-yellow-400");
  });

  it("警告タイプに応じたアイコンが表示される", () => {
    const { rerender } = render(<WarningIndicator warning={mockWarning} />);

    expect(screen.getByText("🚨")).toBeInTheDocument();

    const warningType: Warning = { ...mockWarning, type: "warning" };
    rerender(<WarningIndicator warning={warningType} />);
    expect(screen.getByText("⚠️")).toBeInTheDocument();

    const infoType: Warning = { ...mockWarning, type: "info" };
    rerender(<WarningIndicator warning={infoType} />);
    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });
});

describe("WarningHighlight", () => {
  const mockWarnings: Warning[] = [
    {
      id: "w1",
      type: "critical",
      category: "pregnancy",
      message: "妊娠中の使用は避けてください",
      severity: 9,
      productId: "p1",
    },
    {
      id: "w2",
      type: "warning",
      category: "medication",
      message: "薬物相互作用の可能性があります",
      severity: 6,
      productId: "p1",
    },
    {
      id: "w3",
      type: "info",
      category: "elderly",
      message: "高齢者は注意が必要です",
      severity: 3,
      productId: "p1",
    },
  ];

  it("警告がない場合は「警告なし」を表示する", () => {
    render(
      <WarningHighlight warnings={[]} productId="p1" productName="Product A" />,
    );

    expect(screen.getByText("✓ 警告なし")).toBeInTheDocument();
  });

  it("警告件数を正しく表示する", () => {
    render(
      <WarningHighlight
        warnings={mockWarnings}
        productId="p1"
        productName="Product A"
        showCount={true}
      />,
    );

    expect(screen.getByText("3件")).toBeInTheDocument();
    expect(screen.getByText("重要1")).toBeInTheDocument();
    expect(screen.getByText("警告1")).toBeInTheDocument();
    expect(screen.getByText("情報1")).toBeInTheDocument();
  });

  it("最重要警告をハイライト表示する", () => {
    render(
      <WarningHighlight
        warnings={mockWarnings}
        productId="p1"
        productName="Product A"
        showMostImportant={true}
      />,
    );

    expect(screen.getByText("最重要警告:")).toBeInTheDocument();
    expect(
      screen.getByText("妊娠中の使用は避けてください"),
    ).toBeInTheDocument();
  });

  it("コンパクトモードで正しく表示する", () => {
    render(
      <WarningHighlight
        warnings={mockWarnings}
        productId="p1"
        productName="Product A"
        compact={true}
      />,
    );

    expect(screen.getByText("3件")).toBeInTheDocument();
    expect(screen.queryByText("最重要警告:")).not.toBeInTheDocument();
  });

  it("全警告リストを表示する（非コンパクトモード）", () => {
    render(
      <WarningHighlight
        warnings={mockWarnings}
        productId="p1"
        productName="Product A"
        compact={false}
      />,
    );

    expect(screen.getByText("全ての警告:")).toBeInTheDocument();
    expect(screen.getAllByText("pregnancy")).toHaveLength(2); // 最重要警告と全警告リストの両方に表示
    expect(screen.getByText("medication")).toBeInTheDocument();
    expect(screen.getByText("elderly")).toBeInTheDocument();
  });

  it("アクセシビリティ属性が正しく設定される", () => {
    render(
      <WarningHighlight
        warnings={mockWarnings}
        productId="p1"
        productName="Product A"
      />,
    );

    expect(screen.getByLabelText("Product Aの警告情報")).toBeInTheDocument();

    // スクリーンリーダー用の詳細情報
    const srText = screen.getByText((content, element) => {
      return (
        element?.classList.contains("sr-only") &&
        content.includes("Product Aには3件の警告があります")
      );
    });
    expect(srText).toBeInTheDocument();
  });

  it("重要度の順序が正しく判定される", () => {
    const mixedWarnings: Warning[] = [
      { ...mockWarnings[1], severity: 8 }, // warning with high severity
      { ...mockWarnings[0], severity: 6 }, // critical with lower severity
    ];

    render(
      <WarningHighlight
        warnings={mixedWarnings}
        productId="p1"
        productName="Product A"
        showMostImportant={true}
      />,
    );

    // severity 8の方が高いので、warningタイプでも最重要になる
    expect(
      screen.getByText("薬物相互作用の可能性があります"),
    ).toBeInTheDocument();
  });
});

describe("WarningComparisonSummary", () => {
  const mockAnalysis: WarningAnalysis = {
    totalWarnings: 5,
    criticalWarnings: [
      {
        id: "w1",
        type: "critical",
        category: "pregnancy",
        message: "妊娠中の使用は避けてください",
        severity: 9,
        productId: "p1",
      },
    ],
    mostImportantWarning: {
      id: "w1",
      type: "critical",
      category: "pregnancy",
      message: "妊娠中の使用は避けてください",
      severity: 9,
      productId: "p1",
    },
    warningsByProduct: {},
    warningsByCategory: {},
    severitySummary: {
      critical: 2,
      warning: 2,
      info: 1,
    },
  };

  it("警告サマリーを正しく表示する", () => {
    render(<WarningComparisonSummary warningAnalysis={mockAnalysis} />);

    expect(screen.getByText("警告サマリー")).toBeInTheDocument();
    expect(screen.getByText("合計 5 件")).toBeInTheDocument();
    expect(screen.getByText("重要 2")).toBeInTheDocument();
    expect(screen.getByText("警告 2")).toBeInTheDocument();
    expect(screen.getByText("情報 1")).toBeInTheDocument();
  });

  it("最重要警告を表示する", () => {
    render(<WarningComparisonSummary warningAnalysis={mockAnalysis} />);

    expect(screen.getByText("最重要警告:")).toBeInTheDocument();
    expect(
      screen.getByText("妊娠中の使用は避けてください"),
    ).toBeInTheDocument();
  });

  it("警告がない場合は適切なメッセージを表示する", () => {
    const noWarningsAnalysis: WarningAnalysis = {
      totalWarnings: 0,
      criticalWarnings: [],
      mostImportantWarning: undefined,
      warningsByProduct: {},
      warningsByCategory: {},
      severitySummary: {
        critical: 0,
        warning: 0,
        info: 0,
      },
    };

    render(<WarningComparisonSummary warningAnalysis={noWarningsAnalysis} />);

    expect(
      screen.getByText("比較対象の製品に警告はありません"),
    ).toBeInTheDocument();
  });

  it("重要度別の件数が0の場合は表示しない", () => {
    const partialAnalysis: WarningAnalysis = {
      ...mockAnalysis,
      severitySummary: {
        critical: 1,
        warning: 0,
        info: 0,
      },
    };

    render(<WarningComparisonSummary warningAnalysis={partialAnalysis} />);

    expect(screen.getByText("重要 1")).toBeInTheDocument();
    expect(screen.queryByText("警告 0")).not.toBeInTheDocument();
    expect(screen.queryByText("情報 0")).not.toBeInTheDocument();
  });
});
