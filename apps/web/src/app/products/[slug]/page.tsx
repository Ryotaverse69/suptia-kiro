import { sanityServer } from "@/lib/sanityServer";
import { checkCompliance, generateSampleDescription } from "@/lib/compliance";
import { PersonaWarnings } from "@/components/PersonaWarnings";
import { PriceTable } from "@/components/pricing/PriceTable";
import {
  generateProductMetadata,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";
import { EnhancedProductJsonLd } from "@/components/seo/AggregateRatingJsonLd";
import { notFound } from "next/navigation";
import { isValidSlug } from "@/lib/sanitize";
import Image from "next/image";
import { headers } from "next/headers";
import Script from "next/script";
import { score, type Product as ScoringProduct } from "@/lib/scoring";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { createRakutenConnector } from "@/lib/pricing/rakuten-connector";
import { createYahooConnector } from "@/lib/pricing/yahoo-connector";
import { ProductMatcher } from "@/lib/pricing/price-matcher";
import { createPriceNormalizer } from "@/lib/pricing/price-normalizer";
import { createCostCalculator } from "@/lib/pricing/cost-calculator";
import type { ProductInfo } from "@/lib/pricing/price-matcher";

interface Product {
  _id: string;
  name: string;
  brand: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  description?: string;
  slug: {
    current: string;
  };
  images?: Array<{
    asset: {
      url: string;
    };
    alt?: string;
  }>;
  // Additional fields for scoring
  ingredients?: Array<{
    name?: string;
    evidenceLevel?: "A" | "B" | "C";
    studyCount?: number;
    studyQuality?: number;
  }>;
  sideEffectLevel?: "none" | "low" | "mid" | "high";
  interactionRisk?: number;
  contraindicationCount?: number;
  form?: "capsule" | "tablet" | "powder";
}

async function getProduct(slug: string): Promise<Product | null> {
  // Validate slug format for security
  if (!isValidSlug(slug)) {
    return null;
  }

  const query = `*[_type == "product" && slug.current == $slug][0]{
    _id,
    name,
    brand,
    priceJPY,
    servingsPerContainer,
    servingsPerDay,
    description,
    slug,
    images[]{
      asset->{
        url
      },
      alt
    },
    ingredients[]{
      name,
      evidenceLevel,
      studyCount,
      studyQuality
    },
    sideEffectLevel,
    interactionRisk,
    contraindicationCount,
    form
  }`;

  try {
    const product = await sanityServer.fetch(query, { slug });
    return product || null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  // Generate sample description if not available
  const description =
    product.description || generateSampleDescription(product.name);

  // Extract ingredients from product data
  const ingredients =
    product.ingredients?.map((ing) => ing.name || "").filter(Boolean) || [];

  // Mock persona detection (in real implementation, this would come from user profile/session)
  const personas: ("general" | "medical_professional" | "underage")[] = [
    "general",
  ];

  // Add error handling for warning system
  const handleWarningsChange = (warnings: any[]) => {
    // Log warnings for analytics/monitoring
    if (warnings.length > 0) {
      console.info(
        `Product ${product.name} has ${warnings.length} warnings:`,
        warnings,
      );
    }
  };

  // Calculate product score
  const scoringProduct: ScoringProduct = {
    priceJPY: product.priceJPY,
    servingsPerContainer: product.servingsPerContainer,
    servingsPerDay: product.servingsPerDay,
    description,
    ingredients: product.ingredients,
    sideEffectLevel: product.sideEffectLevel,
    interactionRisk: product.interactionRisk,
    contraindicationCount: product.contraindicationCount,
    form: product.form,
  };

  const scoreResult = score(scoringProduct);

  // Fetch price data from multiple sources
  let priceData: { prices: any[]; costs: any[] } = { prices: [], costs: [] };

  try {
    // Create product info for matching
    const productInfo: ProductInfo = {
      id: product._id,
      name: product.name,
      brand: product.brand,
      capacity: {
        amount: product.servingsPerContainer,
        unit: "粒", // Default unit, should be extracted from product data
        servingsPerContainer: product.servingsPerContainer,
      },
      category: "サプリメント", // Default category, should come from product data
    };

    // Initialize connectors (with fallback to mock in development)
    const useMockData = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";

    if (useMockData) {
      // Use mock data for development - simplified for build compatibility
      priceData = {
        prices: [
          {
            productId: product._id,
            source: "rakuten" as const,
            sourceProductId: "mock-rakuten-1",
            basePrice: 2980,
            shippingCost: 0,
            totalPrice: 2980,
            inStock: true,
            isSubscription: false,
            lastUpdated: new Date().toISOString(),
            sourceUrl: "https://rakuten.co.jp/mock-product",
            shopName: "モックショップ楽天店",
          },
          {
            productId: product._id,
            source: "yahoo" as const,
            sourceProductId: "mock-yahoo-1",
            basePrice: 3200,
            shippingCost: 500,
            totalPrice: 3700,
            inStock: true,
            isSubscription: true,
            subscriptionDiscount: 0.1,
            lastUpdated: new Date().toISOString(),
            sourceUrl: "https://shopping.yahoo.co.jp/mock-product",
            shopName: "モックショップYahoo!店",
          },
        ],
        costs: [
          {
            productId: product._id,
            source: "rakuten" as const,
            sourceProductId: "mock-rakuten-1",
            servingSize: 2,
            servingsPerContainer: product.servingsPerContainer,
            recommendedDailyIntake: product.servingsPerDay,
            daysPerContainer: Math.floor(
              product.servingsPerContainer / product.servingsPerDay,
            ),
            costPerDay:
              2980 /
              Math.floor(product.servingsPerContainer / product.servingsPerDay),
            costPerServing: 2980 / product.servingsPerContainer,
          },
          {
            productId: product._id,
            source: "yahoo" as const,
            sourceProductId: "mock-yahoo-1",
            servingSize: 2,
            servingsPerContainer: product.servingsPerContainer,
            recommendedDailyIntake: product.servingsPerDay,
            daysPerContainer: Math.floor(
              product.servingsPerContainer / product.servingsPerDay,
            ),
            costPerDay:
              3700 /
              Math.floor(product.servingsPerContainer / product.servingsPerDay),
            costPerServing: 3700 / product.servingsPerContainer,
          },
        ],
      };
    }
  } catch (error) {
    console.error("Failed to fetch price data:", error);
    // Continue with empty price data
  }

  // Generate JSON-LD structured data with enhanced aggregate rating
  const productData = {
    name: product.name,
    brand: product.brand,
    priceJPY: product.priceJPY,
    slug: product.slug.current,
    description,
    images: product.images?.map((img) => img.asset?.url).filter(Boolean),
  };

  // Create offers data from price information
  const offers = priceData.prices.map((price) => ({
    price: price.totalPrice,
    priceCurrency: "JPY",
    availability: price.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: price.shopName,
    url: price.sourceUrl,
  }));

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "ホーム", url: "/" },
    { name: "商品", url: "/products" },
    { name: product.name, url: `/products/${product.slug.current}` },
  ]);

  return (
    <>
      {/* Enhanced JSON-LD Structured Data with Aggregate Rating */}
      <EnhancedProductJsonLd
        product={productData}
        scoreResult={scoreResult}
        reviewCount={1} // System-generated score
        offers={offers}
      />
      <Script id="breadcrumb-jsonld" type="application/ld+json" nonce={nonce}>
        {JSON.stringify(breadcrumbJsonLd)}
      </Script>

      <div className="container mx-auto px-4 py-8">
        {/* Persona-based Warning Banner */}
        <PersonaWarnings
          text={description}
          ingredients={ingredients}
          personas={personas}
          enableCompliance={true}
          showDetails={true}
          onWarningsChange={handleWarningsChange}
          className="mb-6"
        />

        {/* Product Score */}
        <div className="mb-8" aria-label="製品スコア表示">
          <ScoreDisplay scoreResult={scoreResult} showBreakdown={true} />
          <ScoreBreakdown
            breakdown={scoreResult.breakdown}
            weights={scoreResult.weights}
            className="mt-6"
          />
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="パンくずリスト">
          <ol className="flex space-x-2">
            <li>
              <a href="/" className="hover:text-gray-700">
                ホーム
              </a>
            </li>
            <li>/</li>
            <li>
              <a href="/products" className="hover:text-gray-700">
                商品
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-900" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          <p className="text-lg text-gray-600">{product.brand}</p>
        </div>

        {/* Product Image */}
        {product.images && product.images.length > 0 && (
          <div className="mb-8">
            <Image
              src={product.images[0].asset.url}
              alt={product.images[0].alt || product.name}
              width={400}
              height={300}
              className="rounded-lg shadow-sm"
              priority
            />
          </div>
        )}

        {/* Product Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">商品説明</h2>
          <p className="text-gray-700 leading-relaxed">{description}</p>
        </div>

        {/* Enhanced Price Table Component */}
        <PriceTable
          prices={priceData.prices}
          costs={priceData.costs}
          productName={product.name}
          showConfidence={true}
          sortBy="costPerDay"
          sortOrder="asc"
          maxRows={10}
          showSourceDetails={true}
          className="mb-8"
        />

        {/* Back to Home */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            商品一覧に戻る
          </a>
        </div>
      </div>
    </>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "商品が見つかりません",
    };
  }

  // Calculate score for metadata
  const scoringProduct: ScoringProduct = {
    priceJPY: product.priceJPY,
    servingsPerContainer: product.servingsPerContainer,
    servingsPerDay: product.servingsPerDay,
    description: product.description,
    ingredients: product.ingredients,
    sideEffectLevel: product.sideEffectLevel,
    interactionRisk: product.interactionRisk,
    contraindicationCount: product.contraindicationCount,
    form: product.form,
  };

  const scoreResult = score(scoringProduct);

  return generateProductMetadata({
    name: product.name,
    brand: product.brand,
    priceJPY: product.priceJPY,
    slug: product.slug.current,
    description: product.description,
    images: product.images?.map((img) => img.asset?.url).filter(Boolean),
    scoreResult,
    reviewCount: 1,
  });
}
