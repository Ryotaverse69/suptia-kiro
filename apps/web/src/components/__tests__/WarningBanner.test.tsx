import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WarningBanner } from "../WarningBanner";
import { ComplianceViolation } from "@/lib/compliance";

describe("WarningBanner", () => {
  const mockViolations: ComplianceViolation[] = [
    {
      pattern: "high",
      originalText: "病気を治す",
      suggestedText: "健康をサポートする",
      context: "product description",
      severity: "high",
    },
    {
      pattern: "medium",
      originalText: "効果抜群",
      suggestedText: "期待できる",
      context: "product title",
      severity: "medium",
    },
    {
      pattern: "low",
      originalText: "絶対に",
      suggestedText: "多くの場合",
      context: "product description",
      severity: "low",
    },
  ];

  it("違反がある場合にバナーを表示する", () => {
    render(<WarningBanner violations={mockViolations} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByText("表現に関する注意 (Dev環境テスト)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("以下の表現について、より適切な表現をご提案します："),
    ).toBeInTheDocument();
  });

  it("違反がない場合にバナーを表示しない", () => {
    render(<WarningBanner violations={[]} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("全ての違反を表示する", () => {
    render(<WarningBanner violations={mockViolations} />);

    mockViolations.forEach((violation) => {
      expect(
        screen.getByText(`「${violation.originalText}」`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`「${violation.suggestedText}」`),
      ).toBeInTheDocument();
    });
  });

  it("違反を重要度順にソートして表示する", () => {
    render(<WarningBanner violations={mockViolations} />);

    const listItems = screen.getAllByRole("listitem");

    // 重要度順: high -> medium -> low
    expect(listItems[0]).toHaveTextContent("「病気を治す」");
    expect(listItems[1]).toHaveTextContent("「効果抜群」");
    expect(listItems[2]).toHaveTextContent("「絶対に」");
  });

  it("閉じるボタンをクリックするとバナーが非表示になる", () => {
    render(<WarningBanner violations={mockViolations} />);

    const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.click(closeButton);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("onDismissコールバックが呼ばれる", () => {
    const onDismiss = vi.fn();
    render(<WarningBanner violations={mockViolations} onDismiss={onDismiss} />);

    const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("onDismissが提供されていなくても動作する", () => {
    render(<WarningBanner violations={mockViolations} />);

    const closeButton = screen.getByRole("button", { name: "警告を閉じる" });

    expect(() => fireEvent.click(closeButton)).not.toThrow();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("カスタムクラス名が適用される", () => {
    const customClass = "custom-warning-banner";
    render(
      <WarningBanner violations={mockViolations} className={customClass} />,
    );

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass(customClass);
  });

  it("適切なアクセシビリティ属性が設定される", () => {
    render(<WarningBanner violations={mockViolations} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("aria-live", "polite");

    const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
    expect(closeButton).toHaveAttribute("aria-label", "警告を閉じる");
  });

  it("警告アイコンが表示される", () => {
    render(<WarningBanner violations={mockViolations} />);

    const icon = screen.getByRole("status").querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("h-5", "w-5", "text-yellow-400");
  });

  it("閉じるアイコンが表示される", () => {
    render(<WarningBanner violations={mockViolations} />);

    const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
    const closeIcon = closeButton.querySelector("svg");
    expect(closeIcon).toBeInTheDocument();
    expect(closeIcon).toHaveClass("h-5", "w-5");
  });

  it("単一の違反でも正しく表示される", () => {
    const singleViolation = [mockViolations[0]];
    render(<WarningBanner violations={singleViolation} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("「病気を治す」")).toBeInTheDocument();
    expect(screen.getByText("「健康をサポートする」")).toBeInTheDocument();
  });

  it("重要度が未定義の違反も適切に処理される", () => {
    const violationsWithUndefinedSeverity: ComplianceViolation[] = [
      {
        pattern: "unknown" as any,
        originalText: "テスト",
        suggestedText: "テスト修正",
        context: "test",
        severity: "unknown" as any,
      },
      ...mockViolations,
    ];

    render(<WarningBanner violations={violationsWithUndefinedSeverity} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("「テスト」")).toBeInTheDocument();
  });

  it("閉じた後に再レンダリングされても非表示のまま", () => {
    const { rerender } = render(<WarningBanner violations={mockViolations} />);

    const closeButton = screen.getByRole("button", { name: "警告を閉じる" });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // 同じpropsで再レンダリング
    rerender(<WarningBanner violations={mockViolations} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
