// Validate environment variables at startup
import "@/env";
import { headers } from "next/headers";
import Script from "next/script";
import { 
  generateWebsiteJsonLd, 
  generateOrganizationJsonLd 
} from "@/lib/seo/json-ld";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get("x-nonce") || undefined;
  const websiteJsonLd = generateWebsiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();
  return (
    <html lang="ja">
      <body>
        {/* Global JSON-LD structured data */}
        <Script id="website-jsonld" type="application/ld+json" nonce={nonce}>
          {JSON.stringify(websiteJsonLd)}
        </Script>
        <Script id="organization-jsonld" type="application/ld+json" nonce={nonce}>
          {JSON.stringify(organizationJsonLd)}
        </Script>
        {children}
      </body>
    </html>
  );
}
