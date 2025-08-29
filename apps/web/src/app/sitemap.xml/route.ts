import { NextResponse } from "next/server";
import { sanityServer } from "@/lib/sanityServer";
import { getSiteUrl } from "@/lib/runtimeConfig";

// Sitemap entry interface
interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

// Get all products for sitemap (要件4.2準拠)
async function getProducts(): Promise<Array<{ slug: string; _updatedAt: string }>> {
  const query = `*[_type == "product" && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt
  }`;

  try {
    const products = await sanityServer.fetch(query);
    return products || [];
  } catch (error) {
    console.error("Failed to fetch products for sitemap:", error);
    return [];
  }
}

// Generate sitemap XML
function generateSitemapXML(entries: SitemapEntry[]): string {
  const siteUrl = getSiteUrl();
  
  const urlEntries = entries
    .map(
      (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;
}

// Dynamic sitemap generation route
export async function GET() {
  try {
    const siteUrl = getSiteUrl();
    const products = await getProducts();
    const currentDate = new Date().toISOString();

    // Build sitemap entries
    const entries: SitemapEntry[] = [
      // Static pages
      {
        url: siteUrl,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${siteUrl}/products`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${siteUrl}/compare`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.7,
      },
      // Dynamic product pages
      ...products.map((product) => ({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product._updatedAt || currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];

    const sitemapXML = generateSitemapXML(entries);

    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // 1 hour cache
      },
    });
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    
    // Return minimal sitemap on error
    const siteUrl = getSiteUrl();
    const fallbackSitemap = generateSitemapXML([
      {
        url: siteUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ]);

    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minutes cache on error
      },
    });
  }
}