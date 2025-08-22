import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompareTableHeader } from "../CompareTableHeader";

// Helper to render header within proper table structure
const renderTableHeader = (props = {}) => {
  return render(
    <table>
      <CompareTableHeader {...props} />
    </table>,
  );
};

describe("CompareTableHeader", () => {
  it("適切なヘッダー構造を表示する", () => {
    renderTableHeader();

    // Should display all column headers
    expect(screen.getByText("製品名")).toBeInTheDocument();
    expect(screen.getByText("総合スコア")).toBeInTheDocument();
    expect(screen.getByText("価格")).toBeInTheDocument();
    expect(screen.getByText("警告")).toBeInTheDocument();
  });

  it("aria-sort属性が正しく設定される", () => {
    renderTableHeader({
      sortBy: "score",
      sortDirection: "desc",
    });

    // Score column should have aria-sort="descending"
    const scoreHeader = screen.getByText("総合スコア").closest("th");
    expect(scoreHeader).toHaveAttribute("aria-sort", "descending");

    // Other columns should have aria-sort="none"
    const nameHeader = screen.getByText("製品名").closest("th");
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
  });

  it("ソートボタンが正常に動作する", () => {
    const mockOnSort = vi.fn();
    renderTableHeader({ onSort: mockOnSort });

    // Click on score sort button
    const scoreButton = screen.getByLabelText(/総合スコアで並べ替え/);
    fireEvent.click(scoreButton);

    expect(mockOnSort).toHaveBeenCalledWith("score", "desc");
  });

  it("キーボード操作でソートが動作する", () => {
    const mockOnSort = vi.fn();
    renderTableHeader({ onSort: mockOnSort });

    const scoreButton = screen.getByLabelText(/総合スコアで並べ替え/);

    // Test Enter key
    fireEvent.keyDown(scoreButton, { key: "Enter" });
    expect(mockOnSort).toHaveBeenCalledWith("score", "desc");

    // Test Space key
    fireEvent.keyDown(scoreButton, { key: " " });
    expect(mockOnSort).toHaveBeenCalledWith("score", "desc");
  });

  it("ソート方向の切り替えが正常に動作する", () => {
    const mockOnSort = vi.fn();
    renderTableHeader({
      sortBy: "score",
      sortDirection: "desc",
      onSort: mockOnSort,
    });

    // Click on already sorted column should toggle direction
    const scoreButton = screen.getByLabelText(/総合スコア.*降順.*昇順に変更/);
    fireEvent.click(scoreButton);

    expect(mockOnSort).toHaveBeenCalledWith("score", "asc");
  });

  it("適切なaria-labelが設定される", () => {
    renderTableHeader({
      sortBy: "price",
      sortDirection: "asc",
    });

    // Current sorted column should have descriptive label
    const priceButton = screen.getByLabelText(/価格.*昇順.*降順に変更/);
    expect(priceButton).toBeInTheDocument();

    // Non-sorted columns should have simple label
    const nameButton = screen.getByLabelText("製品名で並べ替え");
    expect(nameButton).toBeInTheDocument();
  });

  it("ソートアイコンが適切に表示される", () => {
    renderTableHeader({
      sortBy: "score",
      sortDirection: "desc",
    });

    // Should contain sort icons (check for SVG elements by tag name)
    const container = screen.getByRole("rowgroup");
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it("フォーカス管理が適切に動作する", () => {
    renderTableHeader();

    const scoreButton = screen.getByLabelText(/総合スコアで並べ替え/);

    // Button should be focusable
    scoreButton.focus();
    expect(document.activeElement).toBe(scoreButton);
  });
});
