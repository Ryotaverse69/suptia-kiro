import { sanityServerWithCache } from "@/lib/sanityServer";
import { checkCompliance, generateSampleDescription } from "@/lib/compliance";
import { LegacyWarningBanner } from "@/components/LegacyWarningBanner";
import { PersonaWarnings } from "@/components/PersonaWarnings";
import { PriceTable } from "@/components/PriceTable";
import { ProductScoringClient } from "@/components/ProductScoringClient";
import { generateProductMetadata } from "@/lib/seo";
import { 
  generateProductJsonLd, 
  generateBreadcrumbJsonLd 
} from "@/lib/seo/json-ld";
import { notFound } from "next/navigation";
import { isValidSlug } from "@/lib/sanitize";
import Image from "next/image";
import { headers } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";

/**
 * 警告システム用のエラー境界コンポーネント
 */
function ErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback: React.ReactNode; 
}) {
  return (
    <Suspense fallback={<div className="p-4 bg-gray-50 rounded-md">警告をチェック中...</div>}>
      {children}
    </Suspense>
  );
}

/**
 * 警告システム失敗時のフォールバックコンポーネント
 */
function WarningSystemFallback() {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-800">
            警告システムを一時的に利用できません。商品をご利用の際は十分にご注意ください。
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * スコアリングシステム失敗時のフォールバックコンポーネント
 */
function ScoringSystemFallback() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-800">
            スコアリングシステムを一時的に利用できません。商品の詳細情報をご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}

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
  ingredients?: Array<{
    ingredient: {
      _id: string;
      name: string;
      category?: string;
      synonyms?: string[];
      safetyNotes?: string[];
      tags?: string[];
      evidenceLevel?: 'A' | 'B' | 'C';
    };
    amountMgPerServing: number;
  }>;
  warnings?: string[];
  form?: 'capsule' | 'tablet' | 'softgel' | 'powder' | 'liquid' | 'gummy' | string;
  thirdPartyTested?: boolean;
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
      ingredient->{
        _id,
        name,
        category,
        synonyms,
        safetyNotes,
        tags,
        evidenceLevel
      },
      amountMgPerServing
    },
    warnings,
    form,
    thirdPartyTested
  }`;

  try {
    const product = await sanityServerWithCache.fetchProduct(query, { slug });
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

/**
 * 商品スコアリングコンポーネント（サーバーサイド）
 * クライアントコンポーネントをラップしてエラーハンドリングを実装
 */
function ProductScoring({ product }: { product: Product }) {
  return (
    <div className="mb-8">
      <ProductScoringClient product={product} />
    </div>
  );
}

/**
 * ユーザーペルソナの検出（MVP用モック実装）
 * 実際の実装では、ユーザーセッション、Cookie、またはローカルストレージから取得
 */
function detectUserPersona(): string[] {
  // MVPでは固定のペルソナを返す（デモ用）
  // 実際の実装では以下のような方法で取得：
  // - ユーザー登録時の健康状態アンケート
  // - Cookieに保存されたペルソナ設定
  // - ローカルストレージの設定
  // - サーバーサイドのユーザープロファイル
  
  // デモ用の固定ペルソナ（開発・テスト用）
  const mockPersonas = ['pregnancy', 'medication'];
  
  // 本番環境では以下のような実装になる予定：
  // const userSession = await getUserSession();
  // return userSession?.persona || [];
  
  return mockPersonas;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  // Generate sample description if not available
  const description =
    product.description || generateSampleDescription(product.name);

  // Check compliance
  const complianceResult = await checkCompliance(description);

  // Detect user persona (mock implementation for MVP)
  const userPersona = detectUserPersona();

  // Generate JSON-LD structured data
  const productJsonLd = generateProductJsonLd({
    name: product.name,
    brand: product.brand,
    priceJPY: product.priceJPY,
    slug: product.slug.current,
    description,
    images: product.images?.map((img) => img.asset?.url).filter(Boolean),
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "ホーム", url: "/" },
    { name: "商品", url: "/products" },
    { name: product.name, url: `/products/${product.slug.current}` },
  ]);
  const nonce = headers().get("x-nonce") || undefined;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script id="product-jsonld" type="application/ld+json" nonce={nonce}>
        {JSON.stringify(productJsonLd)}
      </Script>
      <Script id="breadcrumb-jsonld" type="application/ld+json" nonce={nonce}>
        {JSON.stringify(breadcrumbJsonLd)}
      </Script>

      <div className="container mx-auto px-4 py-8">
        {/* Persona-based Warning System with Error Boundary */}
        <ErrorBoundary fallback={<WarningSystemFallback />}>
          <PersonaWarnings
            product={product}
            userPersona={userPersona}
            onWarningDismiss={(warningId) => {
              // ログ記録（将来的にはユーザー設定に保存）
              console.log(`Warning dismissed: ${warningId}`);
            }}
            className="mb-6"
          />
        </ErrorBoundary>

        {/* Legacy Compliance Warning Banner (fallback) */}
        {complianceResult.hasViolations && (
          <LegacyWarningBanner violations={complianceResult.violations} />
        )}

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

        {/* Product Scoring System with Error Boundary */}
        <ErrorBoundary fallback={<ScoringSystemFallback />}>
          <ProductScoring product={product} />
        </ErrorBoundary>

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

        {/* Ingredients Information */}
        {product.ingredients && product.ingredients.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">成分構成</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.ingredients.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.ingredient.name}
                    </span>
                    {item.ingredient.category && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({item.ingredient.category})
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.amountMgPerServing}mg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings and Safety Information */}
        {product.warnings && product.warnings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">注意事項</h2>
            <ul className="space-y-2">
              {product.warnings.map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3"></span>
                  <span className="text-gray-700">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price Table Component */}
        <PriceTable
          product={{
            name: product.name,
            priceJPY: product.priceJPY,
            servingsPerContainer: product.servingsPerContainer,
            servingsPerDay: product.servingsPerDay,
          }}
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

// ISR Configuration - Revalidate every 10 minutes (600 seconds)
export const revalidate = 600;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "商品が見つかりません",
    };
  }

  return generateProductMetadata({
    name: product.name,
    brand: product.brand,
    priceJPY: product.priceJPY,
    slug: product.slug.current,
    description: product.description || generateSampleDescription(product.name),
    images: product.images?.map((img) => img.asset?.url).filter(Boolean),
  });
}
