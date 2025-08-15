import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WarningBanner, WarningBannerList } from "../WarningBanner";
import type { Severity } from "@/lib/persona-rules";

describe("WarningBanner", () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本的なレンダリング", () => {
    it("high重要度で正しくレンダリングされる", () => {
      render(
        <WarningBanner
          severity="high"
          message="重要な警告メッセージ"
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("重要な警告メッセージ")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveClass(
        "bg-red-50",
        "border-red-200",
        "text-red-800",
      );
    });

    it("mid重要度で正しくレンダリングされる", () => {
      render(
        <WarningBanner
          severity="mid"
          message="注意メッセージ"
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("注意メッセージ")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveClass(
        "bg-orange-50",
        "border-orange-200",
        "text-orange-800",
      );
    });

    it("low重要度で正しくレンダリングされる", () => {
      render(
        <WarningBanner
          severity="low"
          message="情報メッセージ"
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("情報メッセージ")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveClass(
        "bg-yellow-50",
        "border-yellow-200",
        "text-yellow-800",
      );
    });
  });

  describe("dismiss機能", () => {
    it("dismissibleがtrueの場合、閉じるボタンが表示される", () => {
      render(
        <WarningBanner
          severity="high"
          message="テスト"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(
        screen.getByRole("button", { name: /閉じる/ }),
      ).toBeInTheDocument();
    });

    it("dismissibleがfalseの場合、閉じるボタンが表示されない", () => {
      render(
        <WarningBanner severity="high" message="テスト" dismissible={false} />,
      );

      expect(
        screen.queryByRole("button", { name: /閉じる/ }),
      ).not.toBeInTheDocument();
    });

    it("閉じるボタンをクリックするとonDismissが呼ばれる", async () => {
      render(
        <WarningBanner
          severity="high"
          message="テスト"
          onDismiss={mockOnDismiss}
        />,
      );

      const dismissButton = screen.getByRole("button", { name: /閉じる/ });
      fireEvent.click(dismissButton);

      await waitFor(
        () => {
          expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        },
        { timeout: 200 },
      );
    });
  });

  describe("アクセシビリティ", () => {
    it("適切なARIA属性が設定される", () => {
      render(<WarningBanner severity="high" message="テスト" ariaLevel={3} />);

      const banner = screen.getByRole("status");
      expect(banner).toHaveAttribute("aria-level", "3");
      expect(banner).toHaveAttribute("aria-live", "polite");
    });

    it("スクリーンリーダー用のラベルが含まれる", () => {
      render(<WarningBanner severity="high" message="テストメッセージ" />);

      expect(screen.getByText("重要な警告:")).toHaveClass("sr-only");
    });
  });
});

describe("WarningBannerList", () => {
  const mockOnDismiss = vi.fn();

  const mockWarnings = [
    { id: "1", severity: "high" as Severity, message: "重要な警告1" },
    { id: "2", severity: "mid" as Severity, message: "注意事項2" },
    { id: "3", severity: "low" as Severity, message: "情報3" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("複数の警告が正しく表示される", () => {
    render(
      <WarningBannerList warnings={mockWarnings} onDismiss={mockOnDismiss} />,
    );

    expect(screen.getByText("重要な警告1")).toBeInTheDocument();
    expect(screen.getByText("注意事項2")).toBeInTheDocument();
    expect(screen.getByText("情報3")).toBeInTheDocument();
  });

  it("空の警告配列の場合、何も表示されない", () => {
    const { container } = render(
      <WarningBannerList warnings={[]} onDismiss={mockOnDismiss} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
