import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock dependencies
vi.mock("@/lib/sanityServer", () => ({
  sanityServer: {
    fetch: vi.fn(),
  },
}));

vi.mock("@/lib/runtimeConfig", () => ({
  getSiteUrl: () => "https://suptia.com",
}));

const mockSanityServer = vi.mocked(
  await import("@/lib/sanityServer")
).sanityServer;

describe("Sitemap XML Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("動的サイトマップを正しく生成する (要件4.2)", async () => {
    // Mock product data
    const mockProducts = [
      {
        slug: "vitamin-c-1000mg",
        _updatedAt: "2024-01-15T10:00:00Z",
      },
      {
        slug: "protein-powder",
        _updatedAt: "2024-01-16T12:00:00Z",
      },
    ];

    mockSanityServer.fetch.mockResolvedValue(mockProducts);

    const response = await GET();
    const xmlContent = await response.text();

    // Check response headers
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=3600"
    );

    // Check XML structure
    expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xmlContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    // Check static pages
    expect(xmlContent).toContain("<loc>https://suptia.com</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/products</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/compare</loc>");

    // Check dynamic product pages
    expect(xmlContent).toContain("<loc>https://suptia.com/products/vitamin-c-1000mg</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/products/protein-powder</loc>");

    // Check lastmod dates
    expect(xmlContent).toContain("<lastmod>2024-01-15T10:00:00Z</lastmod>");
    expect(xmlContent).toContain("<lastmod>2024-01-16T12:00:00Z</lastmod>");

    // Check priority and changefreq
    expect(xmlContent).toContain("<priority>1.0</priority>"); // Homepage
    expect(xmlContent).toContain("<priority>0.8</priority>"); // Products page
    expect(xmlContent).toContain("<priority>0.6</priority>"); // Product detail pages
    expect(xmlContent).toContain("<changefreq>daily</changefreq>");
    expect(xmlContent).toContain("<changefreq>weekly</changefreq>");
  });

  it("Sanityエラー時にフォールバックサイトマップを返す", async () => {
    mockSanityServer.fetch.mockRejectedValue(new Error("Sanity connection failed"));

    const response = await GET();
    const xmlContent = await response.text();

    // Check response - getProducts handles errors internally and returns [], so normal cache applies
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=3600"
    );

    // Check that static pages are still included even when products fail to load
    expect(xmlContent).toContain("<loc>https://suptia.com</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/products</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/compare</loc>");
    expect(xmlContent).toContain("<priority>1.0</priority>");
    expect(xmlContent).toContain("<changefreq>daily</changefreq>");
    
    // Should not contain any product pages due to error
    expect(xmlContent).not.toContain("/products/vitamin-c");
    expect(xmlContent).not.toContain("/products/protein");
  });

  it("空の商品リストでも正しく処理する", async () => {
    mockSanityServer.fetch.mockResolvedValue([]);

    const response = await GET();
    const xmlContent = await response.text();

    expect(response.status).toBe(200);

    // Should still contain static pages
    expect(xmlContent).toContain("<loc>https://suptia.com</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/products</loc>");
    expect(xmlContent).toContain("<loc>https://suptia.com/compare</loc>");

    // Should not contain any product pages
    expect(xmlContent).not.toContain("/products/vitamin-c");
    expect(xmlContent).not.toContain("/products/protein");
  });
});