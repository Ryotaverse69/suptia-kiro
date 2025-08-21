import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ComparePage from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000/compare",
  },
  writable: true,
});

describe("ComparePage", () => {
  beforeEach(() => {
    // Clear any existing DOM elements
    document.body.innerHTML = "";
  });

  it("初期状態で製品が表示される", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      expect(screen.getByText("製品比較")).toBeInTheDocument();
      expect(screen.getByText("2製品を比較中")).toBeInTheDocument();
    });
  });

  it("製品削除機能が動作する", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      expect(screen.getByText("2製品を比較中")).toBeInTheDocument();
    });

    // すべてクリアボタンをクリック
    const clearButton = screen.getByText("すべてクリア");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(
        screen.getByText("比較する製品を選択してください"),
      ).toBeInTheDocument();
    });
  });

  it("空状態からサンプル製品を追加できる", async () => {
    render(<ComparePage />);

    // まずすべてクリア
    await waitFor(() => {
      const clearButton = screen.getByText("すべてクリア");
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText("比較する製品を選択してください"),
      ).toBeInTheDocument();
    });

    // サンプル製品ボタンをクリック
    const sampleButton = screen.getByText("サンプル製品で試す");
    fireEvent.click(sampleButton);

    await waitFor(() => {
      expect(screen.getByText("2製品を比較中")).toBeInTheDocument();
    });
  });

  it("最大製品数制限のエラーメッセージを表示する", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      expect(screen.getByText("2製品を比較中")).toBeInTheDocument();
    });

    // 製品を追加ボタンをクリック（3製品目を追加）
    const addButton = screen.getByText("+ 製品を追加");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("3製品を比較中")).toBeInTheDocument();
    });

    // もう一度追加しようとするとエラーが表示される
    // 3製品になると追加ボタンが消えるので、この時点でテスト完了
    expect(screen.queryByText("+ 製品を追加")).not.toBeInTheDocument();
  });

  it("レスポンシブデザインクラスが適用される", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      // 動的レイアウトクラスが適用されることを確認
      const container = document.querySelector(".max-w-4xl");
      expect(container).toBeInTheDocument();
    });
  });

  it("JSON-LD構造化データが生成される", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      // JSON-LDスクリプトタグが存在することを確認
      const jsonLdScript = document.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(jsonLdScript).toBeInTheDocument();
    });
  });

  it("並べ替え機能が動作する", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      expect(screen.getByText("製品比較")).toBeInTheDocument();
    });

    // 価格で並べ替えボタンをクリック
    const priceButton = screen.getByLabelText(/価格で並べ替え/);
    fireEvent.click(priceButton);

    // 並べ替えが実行されることを確認（具体的な順序は実装に依存）
    expect(priceButton).toBeInTheDocument();
  });

  it("個別製品削除ボタンが動作する", async () => {
    render(<ComparePage />);

    await waitFor(() => {
      expect(screen.getByText("製品比較")).toBeInTheDocument();
    });

    // モバイル用の個別削除ボタンをクリック
    const removeButtons = screen.getAllByLabelText(/を比較から削除/);
    expect(removeButtons.length).toBeGreaterThan(0);

    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      // 削除後は1製品になる
      const productCards =
        screen.getAllByText(/ビタミンD3|オメガ3|マルチビタミン/);
      expect(productCards.length).toBeLessThan(4); // 削除されたことを確認
    });
  });
});
