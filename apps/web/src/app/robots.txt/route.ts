import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/runtimeConfig";

// Generate robots.txt content (要件4.2準拠)
function generateRobotsTxt(): string {
  const siteUrl = getSiteUrl();
  
  return `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin and private paths
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /studio/

# Allow specific API endpoints for SEO
Allow: /api/og
Allow: /api/health`;
}

// Robots.txt route handler
export async function GET() {
  try {
    const robotsTxt = generateRobotsTxt();

    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // 24 hours cache
      },
    });
  } catch (error) {
    console.error("Failed to generate robots.txt:", error);
    
    // Return basic robots.txt on error
    const fallbackRobots = `User-agent: *
Allow: /

Sitemap: ${getSiteUrl()}/sitemap.xml`;

    return new NextResponse(fallbackRobots, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // 1 hour cache on error
      },
    });
  }
}