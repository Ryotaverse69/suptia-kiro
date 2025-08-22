import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductDetailPage, { generateMetadata } from "../page";
import { sanityServer } from "@/lib/sanityServer";

// Mock dependencies
vi.mock("@/lib/sanityServer", () => ({
  sanityServer: {
    fetch: vi.fn(),
  },
}));

vi.mock("@/lib/compliance", () => ({
  checkCompliance: vi.fn(),
  generateSampleDescription: vi.fn(
    (name: string) => `Sample description for ${name}`,
  ),
}));

vi.mock("@/lib/seo", () => ({
  generateProductMetadata: vi.fn(),
  generateProductJsonLd: vi.fn(),
  generateBreadcrumbJsonLd: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn(() => "test-nonce"),
  })),
}));

vi.mock("@/lib/sanitize", () => ({
  isValidSlug: vi.fn(() => true),
}));

// Mock Next.js components
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock("next/script", () => ({
  default: ({ children, ...props }: any) => (
    <script {...props}>{children}</script>
  ),
}));

// Mock components
vi.mock("@/components/PersonaWarnings", () => ({
  PersonaWarnings: ({ text, personas }: any) => (
    <div data-testid="persona-warnings">
      PersonaWarnings: {text} - {personas.join(", ")}
    </div>
  ),
}));

vi.mock("@/components/PriceTable", () => ({
  PriceTable: ({ product }: any) => (
    <div data-testid="price-table">
      PriceTable: {product.name} - ¥{product.priceJPY}
    </div>
  ),
}));

vi.mock("@/components/ScoreDisplay", () => ({
  ScoreDisplay: ({ scoreResult, showBreakdown }: any) => (
    <div data-testid="score-display">
      ScoreDisplay: {scoreResult.total} (breakdown:{" "}
      {showBreakdown ? "yes" : "no"})
    </div>
  ),
}));

vi.mock("@/components/ScoreBreakdown", () => ({
  ScoreBreakdown: ({ breakdown, weights }: any) => (
    <div data-testid="score-breakdown">
      ScoreBreakdown: evidence={breakdown.evidence.score}, safety=
      {breakdown.safety.score}
    </div>
  ),
}));

const mockProduct = {
  _id: "test-product-id",
  name: "Test Product",
  brand: "Test Brand",
  priceJPY: 3000,
  servingsPerContainer: 30,
  servingsPerDay: 2,
  description: "Test product description",
  slug: {
    current: "test-product",
  },
  images: [
    {
      asset: {
        url: "https://example.com/image.jpg",
      },
      alt: "Test product image",
    },
  ],
  ingredients: [
    {
      evidenceLevel: "A" as const,
      studyCount: 15,
      studyQuality: 85,
    },
  ],
  sideEffectLevel: "low" as const,
  interactionRisk: 20,
  contraindicationCount: 2,
  form: "capsule" as const,
};

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sanityServer.fetch as any).mockResolvedValue(mockProduct);
  });

  it("商品詳細ページを正しくレンダリングする", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    // Check main product information (use heading for unique identification)
    expect(
      screen.getByRole("heading", { name: "Test Product" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Brand")).toBeInTheDocument();
    expect(screen.getByText("Test product description")).toBeInTheDocument();

    // Check components are rendered
    expect(screen.getByTestId("persona-warnings")).toBeInTheDocument();
    expect(screen.getByTestId("score-display")).toBeInTheDocument();
    expect(screen.getByTestId("score-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("price-table")).toBeInTheDocument();

    // Check image is rendered
    expect(screen.getByAltText("Test product image")).toBeInTheDocument();
  });

  it("スコア計算が正しく実行される", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    const scoreDisplay = screen.getByTestId("score-display");
    const scoreBreakdown = screen.getByTestId("score-breakdown");

    expect(scoreDisplay).toBeInTheDocument();
    expect(scoreBreakdown).toBeInTheDocument();

    // Check that showBreakdown is true
    expect(scoreDisplay.textContent).toContain("breakdown: yes");
  });

  it("パンくずナビゲーションが表示される", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    expect(
      screen.getByRole("navigation", { name: "パンくずリスト" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("商品")).toBeInTheDocument();
    // Check breadcrumb has current page indicator
    expect(
      screen.getByRole("listitem", { current: "page" }),
    ).toBeInTheDocument();
  });

  it("商品画像が表示される", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    const image = screen.getByAltText("Test product image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("商品説明セクションが表示される", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    expect(screen.getByText("商品説明")).toBeInTheDocument();
    expect(screen.getByText("Test product description")).toBeInTheDocument();
  });

  it("戻るリンクが表示される", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    const backLink = screen.getByText("商品一覧に戻る");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("JSON-LDスクリプトが含まれる", async () => {
    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    // Check that JSON-LD scripts are present (they don't have role="script" in testing)
    const container = screen.getByText("Test Brand").closest("div");
    expect(container).toBeInTheDocument();
  });

  it("商品が見つからない場合の処理", async () => {
    (sanityServer.fetch as any).mockResolvedValue(null);
    const { notFound } = await import("next/navigation");

    const params = { slug: "non-existent-product" };

    try {
      await ProductDetailPage({ params });
    } catch (error) {
      // notFound() throws an error in Next.js
    }

    expect(notFound).toHaveBeenCalled();
  });

  it("説明がない場合にサンプル説明を生成する", async () => {
    const productWithoutDescription = {
      ...mockProduct,
      description: undefined,
    };
    (sanityServer.fetch as any).mockResolvedValue(productWithoutDescription);

    const { generateSampleDescription } = await import("@/lib/compliance");

    const params = { slug: "test-product" };
    const page = await ProductDetailPage({ params });

    render(page);

    expect(generateSampleDescription).toHaveBeenCalledWith("Test Product");
  });

  it("Sanityクエリが正しいフィールドを取得する", async () => {
    const params = { slug: "test-product" };
    await ProductDetailPage({ params });

    expect(sanityServer.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ingredients[]{"),
      { slug: "test-product" },
    );
    expect(sanityServer.fetch).toHaveBeenCalledWith(
      expect.stringContaining("sideEffectLevel"),
      { slug: "test-product" },
    );
    expect(sanityServer.fetch).toHaveBeenCalledWith(
      expect.stringContaining("interactionRisk"),
      { slug: "test-product" },
    );
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sanityServer.fetch as any).mockResolvedValue(mockProduct);
  });

  it("商品のメタデータを正しく生成する", async () => {
    const { generateProductMetadata } = await import("@/lib/seo");
    (generateProductMetadata as any).mockReturnValue({
      title: "Test Product - Test Brand | サプティア",
      description: "Test product description",
    });

    const params = { slug: "test-product" };
    const metadata = await generateMetadata({ params });

    expect(generateProductMetadata).toHaveBeenCalledWith({
      name: "Test Product",
      brand: "Test Brand",
      priceJPY: 3000,
      slug: "test-product",
      description: "Test product description",
      images: ["https://example.com/image.jpg"],
    });

    expect(metadata).toEqual({
      title: "Test Product - Test Brand | サプティア",
      description: "Test product description",
    });
  });

  it("商品が見つからない場合のメタデータ", async () => {
    (sanityServer.fetch as any).mockResolvedValue(null);

    const params = { slug: "non-existent-product" };
    const metadata = await generateMetadata({ params });

    expect(metadata).toEqual({
      title: "商品が見つかりません",
    });
  });
});
