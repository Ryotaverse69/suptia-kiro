import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { CompareControls } from "../CompareControls";
import type { SortConfig } from "../types";

describe("CompareControls", () => {
  const mockOnSort = vi.fn();

  beforeEach(() => {
    mockOnSort.mockClear();
  });

  const defaultProps = {
    currentSort: { field: "score", direction: "desc" } as SortConfig,
    onSort: mockOnSort,
  };

  it("renders all sort buttons", () => {
    render(<CompareControls {...defaultProps} />);

    expect(screen.getByRole("button", { name: /スコア/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /価格/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /名前/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /警告/ })).toBeInTheDocument();
  });

  it("highlights the currently active sort button", () => {
    render(<CompareControls {...defaultProps} />);

    const scoreButton = screen.getByRole("button", { name: /スコア/ });
    expect(scoreButton).toHaveClass(
      "bg-blue-100",
      "border-blue-300",
      "text-blue-800",
    );
    expect(scoreButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows correct sort direction indicator", () => {
    render(<CompareControls {...defaultProps} />);

    const scoreButton = screen.getByRole("button", { name: /スコア/ });
    expect(scoreButton).toHaveTextContent("↓"); // descending indicator
  });

  it("calls onSort when clicking a different field", () => {
    render(<CompareControls {...defaultProps} />);

    const priceButton = screen.getByRole("button", { name: /価格/ });
    fireEvent.click(priceButton);

    expect(mockOnSort).toHaveBeenCalledWith("price", "asc"); // default direction for price
  });

  it("toggles direction when clicking the same field", () => {
    render(<CompareControls {...defaultProps} />);

    const scoreButton = screen.getByRole("button", { name: /スコア/ });
    fireEvent.click(scoreButton);

    expect(mockOnSort).toHaveBeenCalledWith("score", "asc"); // toggle from desc to asc
  });

  it("handles keyboard navigation with Enter key", () => {
    render(<CompareControls {...defaultProps} />);

    const priceButton = screen.getByRole("button", { name: /価格/ });
    fireEvent.keyDown(priceButton, { key: "Enter" });

    expect(mockOnSort).toHaveBeenCalledWith("price", "asc");
  });

  it("handles keyboard navigation with Space key", () => {
    render(<CompareControls {...defaultProps} />);

    const nameButton = screen.getByRole("button", { name: /名前/ });
    fireEvent.keyDown(nameButton, { key: " " });

    expect(mockOnSort).toHaveBeenCalledWith("name", "asc");
  });

  it("prevents default behavior for Space key", () => {
    render(<CompareControls {...defaultProps} />);

    const nameButton = screen.getByRole("button", { name: /名前/ });
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    fireEvent(nameButton, event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("ignores other keyboard keys", () => {
    render(<CompareControls {...defaultProps} />);

    const scoreButton = screen.getByRole("button", { name: /スコア/ });
    fireEvent.keyDown(scoreButton, { key: "Tab" });

    expect(mockOnSort).not.toHaveBeenCalled();
  });

  it("provides appropriate aria-labels for each button", () => {
    render(<CompareControls {...defaultProps} />);

    // Active sort button should indicate current state and toggle option
    const scoreButton = screen.getByRole("button", {
      name: /スコア（現在降順）、クリックで昇順に変更/,
    });
    expect(scoreButton).toBeInTheDocument();

    // Inactive buttons should show simple sort action
    const priceButton = screen.getByRole("button", { name: /価格で並べ替え/ });
    expect(priceButton).toBeInTheDocument();
  });

  it("includes live region for screen reader announcements", () => {
    render(<CompareControls {...defaultProps} />);

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveClass("sr-only");
  });

  it("announces sort changes to screen readers", () => {
    render(<CompareControls {...defaultProps} />);

    const priceButton = screen.getByRole("button", { name: /価格/ });
    fireEvent.click(priceButton);

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion).toHaveTextContent(
      "テーブルが価格の昇順で並べ替えられました",
    );
  });

  it("applies custom className", () => {
    const { container } = render(
      <CompareControls {...defaultProps} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  describe("accessibility compliance", () => {
    it("has proper button roles and attributes", () => {
      render(<CompareControls {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
        expect(button).toHaveAttribute("aria-label");
        expect(button).toHaveAttribute("aria-pressed");
      });
    });

    it("has proper focus management", () => {
      render(<CompareControls {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass(
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500",
        );
      });
    });
  });
});
