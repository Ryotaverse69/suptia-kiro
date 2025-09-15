import { sanityServer } from '@/lib/sanityServer';
import { checkCompliance, generateSampleDescription } from '@/lib/compliance';
import { LegacyWarningBanner } from '@/components/LegacyWarningBanner';
import { PersonaWarnings } from '@/components/PersonaWarnings';
import { PriceTable } from '@/components/PriceTable';
import { ProductScoringClient } from '@/components/ProductScoringClient';
import { FavoriteButton } from '@/components/FavoriteButton';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import { PriceComparison } from '@/components/PriceComparison';
import { ResearchAndReviews } from '@/components/ResearchAndReviews';
import AIProductReason from '@/components/AIProductReason';
import { generateProductMetadata } from '@/lib/seo';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isValidSlug } from '@/lib/sanitize';
import Image from 'next/image';
import { headers } from 'next/headers';
import Script from 'next/script';
import { Suspense } from 'react';
import ClientPrice from '@/components/ClientPrice';
import type { ComplianceViolation } from '@/lib/compliance';

// ISR configuration
export const revalidate = 600;
import { Metadata } from 'next';

/**
 * 警告システム用のエラー境界コンポーネント
 */
function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className='p-4 bg-gray-50 rounded-md'>警告をチェック中...</div>
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * 警告システム失敗時のフォールバックコンポーネント
 */
function WarningSystemFallback() {
  return (
    <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-6'>
      <div className='flex items-center'>
        <div className='flex-shrink-0'>
          <svg
            className='h-5 w-5 text-yellow-400'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='ml-3'>
          <p className='text-sm text-yellow-800'>
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
    <div className='p-4 bg-blue-50 border border-blue-200 rounded-md mb-6'>
      <div className='flex items-center'>
        <div className='flex-shrink-0'>
          <svg
            className='h-5 w-5 text-blue-400'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='ml-3'>
          <p className='text-sm text-primary-800'>
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
  form?:
  | 'capsule'
  | 'tablet'
  | 'softgel'
  | 'powder'
  | 'liquid'
  | 'gummy'
  | string;
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
    const product = await sanityServer.fetch(query, { slug });
    if (product) {
      return product;
    }
  } catch (error) {
    console.error('Failed to fetch product:', error);
  }

  // デモデータを返す（Sanity接続エラーまたはデータなしの場合）
  const demoProducts: Record<string, Product> = {
    'multivitamin-premium': {
      _id: 'demo-1',
      name: 'マルチビタミン プレミアム',
      brand: 'ヘルスプラス',
      priceJPY: 2980,
      servingsPerContainer: 60,
      servingsPerDay: 2,
      description:
        '13種類のビタミンと7種類のミネラルをバランス良く配合したプレミアムマルチビタミン。毎日の健康維持をサポートします。',
      slug: { current: 'multivitamin-premium' },
      form: 'capsule',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: {
            _id: 'vitamin-a',
            name: 'ビタミンA',
            category: 'ビタミン',
            evidenceLevel: 'A' as const,
            safetyNotes: ['妊娠中の過剰摂取に注意'],
            tags: ['脂溶性ビタミン'],
          },
          amountMgPerServing: 0.8,
        },
        {
          ingredient: {
            _id: 'vitamin-c',
            name: 'ビタミンC',
            category: 'ビタミン',
            evidenceLevel: 'A' as const,
            tags: ['水溶性ビタミン', '抗酸化'],
          },
          amountMgPerServing: 100,
        },
        {
          ingredient: {
            _id: 'vitamin-d3',
            name: 'ビタミンD3',
            category: 'ビタミン',
            evidenceLevel: 'A' as const,
            tags: ['脂溶性ビタミン', '骨の健康'],
          },
          amountMgPerServing: 0.025,
        },
      ],
      warnings: [
        '妊娠・授乳中の方は医師にご相談ください',
        '他のサプリメントとの併用時は摂取量にご注意ください',
      ],
    },
    'omega3-fish-oil': {
      _id: 'demo-2',
      name: 'オメガ3 フィッシュオイル',
      brand: 'オーシャンヘルス',
      priceJPY: 3480,
      servingsPerContainer: 90,
      servingsPerDay: 3,
      description:
        '高純度のEPAとDHAを豊富に含むフィッシュオイル。心血管の健康と脳機能をサポートします。',
      slug: { current: 'omega3-fish-oil' },
      form: 'softgel',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: {
            _id: 'epa',
            name: 'EPA',
            category: 'オメガ3脂肪酸',
            evidenceLevel: 'A' as const,
            tags: ['必須脂肪酸', '心血管'],
          },
          amountMgPerServing: 500,
        },
        {
          ingredient: {
            _id: 'dha',
            name: 'DHA',
            category: 'オメガ3脂肪酸',
            evidenceLevel: 'A' as const,
            tags: ['必須脂肪酸', '脳機能'],
          },
          amountMgPerServing: 300,
        },
      ],
      warnings: ['血液凝固阻害薬を服用中の方は医師にご相談ください'],
    },
    'vitamin-d3-k2': {
      _id: 'demo-3',
      name: 'ビタミンD3 + K2',
      brand: 'サンライト',
      priceJPY: 1980,
      servingsPerContainer: 120,
      servingsPerDay: 1,
      description:
        'ビタミンD3とK2の相乗効果で骨の健康を最適化。カルシウムの吸収と適切な配置をサポートします。',
      slug: { current: 'vitamin-d3-k2' },
      form: 'tablet',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: {
            _id: 'vitamin-d3-2',
            name: 'ビタミンD3',
            category: 'ビタミン',
            evidenceLevel: 'A' as const,
            tags: ['脂溶性ビタミン', '骨の健康'],
          },
          amountMgPerServing: 0.025,
        },
        {
          ingredient: {
            _id: 'vitamin-k2',
            name: 'ビタミンK2',
            category: 'ビタミン',
            evidenceLevel: 'B' as const,
            tags: ['脂溶性ビタミン', '骨代謝'],
          },
          amountMgPerServing: 0.1,
        },
      ],
      warnings: [
        'ワルファリンなどの抗凝固薬を服用中の方は医師にご相談ください',
      ],
    },
    probiotics: {
      _id: 'demo-4',
      name: 'プロバイオティクス',
      brand: 'ガットヘルス',
      priceJPY: 4280,
      servingsPerContainer: 30,
      servingsPerDay: 1,
      description:
        '10種類の有益な菌株を500億CFU配合。腸内環境の改善と免疫機能をサポートします。',
      slug: { current: 'probiotics' },
      form: 'capsule',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: {
            _id: 'lactobacillus-acidophilus',
            name: 'ラクトバチルス・アシドフィルス',
            category: 'プロバイオティクス',
            evidenceLevel: 'A' as const,
            tags: ['乳酸菌', '腸内環境'],
          },
          amountMgPerServing: 100,
        },
        {
          ingredient: {
            _id: 'bifidobacterium-lactis',
            name: 'ビフィドバクテリウム・ラクティス',
            category: 'プロバイオティクス',
            evidenceLevel: 'A' as const,
            tags: ['ビフィズス菌', '免疫'],
          },
          amountMgPerServing: 50,
        },
      ],
      warnings: ['免疫抑制剤を服用中の方は医師にご相談ください'],
    },
  };

  return demoProducts[slug] || null;
}

interface PageProps {
  params: {
    slug: string;
  };
}

// メタデータ生成関数
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: '商品が見つかりません | サプティア',
      description: 'お探しの商品は見つかりませんでした。',
      alternates: {
        canonical: `https://suptia.com/products/${params.slug}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return generateProductMetadata({
    name: product.name,
    brand: product.brand,
    description: product.description || generateSampleDescription(product.name),
    priceJPY: product.priceJPY,
    slug: product.slug.current,
    images: product.images?.map(img => img.asset?.url).filter(Boolean),
  });
}

/**
 * 商品スコアリングコンポーネント（サーバーサイド）
 * クライアントコンポーネントをラップしてエラーハンドリングを実装
 */
function ProductScoring({ product }: { product: Product }) {
  return (
    <div className='mb-8'>
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

  // Render-only: apply suggested replacements to avoid showing non-compliant phrases
  function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function applyComplianceSuggestions(
    text: string,
    violations: ComplianceViolation[]
  ): string {
    return violations.reduce((acc, v) => {
      if (!v?.originalText || !v?.suggestedText) return acc;
      try {
        const re = new RegExp(escapeRegExp(v.originalText), 'g');
        return acc.replace(re, v.suggestedText);
      } catch {
        return acc;
      }
    }, text);
  }
  const displayDescription = complianceResult?.hasViolations
    ? applyComplianceSuggestions(description, complianceResult.violations || [])
    : description;

  // Detect user persona (mock implementation for MVP)
  const userPersona = detectUserPersona();

  // Generate JSON-LD structured data
  const productJsonLd = generateProductJsonLd({
    name: product.name,
    brand: product.brand,
    priceJPY: product.priceJPY,
    slug: product.slug.current,
    description,
    images: product.images?.map(img => img.asset?.url).filter(Boolean),
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: '/' },
    { name: '商品', url: '/products' },
    { name: product.name, url: `/products/${product.slug.current}` },
  ]);
  const nonce = headers().get('x-nonce') || undefined;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script id='product-jsonld' type='application/ld+json' nonce={nonce}>
        {JSON.stringify(productJsonLd)}
      </Script>
      <Script id='breadcrumb-jsonld' type='application/ld+json' nonce={nonce}>
        {JSON.stringify(breadcrumbJsonLd)}
      </Script>

      <div className='container mx-auto px-4 py-8'>
        {/* Persona-based Warning System with Error Boundary */}
        <ErrorBoundary fallback={<WarningSystemFallback />}>
          <PersonaWarnings
            product={product}
            userPersona={userPersona}
            onWarningDismiss={warningId => {
              // ログ記録（将来的にはユーザー設定に保存）
              console.log(`Warning dismissed: ${warningId}`);
            }}
            className='mb-6'
          />
        </ErrorBoundary>

        {/* Legacy Compliance Warning Banner (fallback) */}
        {complianceResult.hasViolations && (
          <LegacyWarningBanner violations={complianceResult.violations} />
        )}

        {/* Hero Section */}
        <div className='bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-8 mb-8'>
          {/* Breadcrumb Navigation */}
          <nav
            className='text-sm text-gray-600 mb-6'
            aria-label='パンくずリスト'
          >
            <ol className='flex items-center space-x-2'>
              <li>
                <a
                  href='/'
                  className='hover:text-primary-600 transition-colors'
                >
                  🏠 ホーム
                </a>
              </li>
              <li className='text-gray-400'>/</li>
              <li>
                <a
                  href='/products'
                  className='hover:text-primary-600 transition-colors'
                >
                  📦 商品
                </a>
              </li>
              <li className='text-gray-400'>/</li>
              <li className='text-gray-900 font-medium' aria-current='page'>
                {product.name}
              </li>
            </ol>
          </nav>

          <div className='grid lg:grid-cols-2 gap-8 items-center'>
            {/* Product Info */}
            <div>
              <div className='flex flex-wrap items-center gap-3 mb-4'>
                <span className='bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium'>
                  🏢 {product.brand}
                </span>
                {product.form && (
                  <span className='bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium'>
                    💊{' '}
                    {product.form === 'capsule'
                      ? 'カプセル'
                      : product.form === 'tablet'
                        ? '錠剤'
                        : product.form === 'softgel'
                          ? 'ソフトジェル'
                          : product.form === 'powder'
                            ? '粉末'
                            : product.form === 'liquid'
                              ? '液体'
                              : product.form === 'gummy'
                                ? 'グミ'
                                : product.form}
                  </span>
                )}
                {product.thirdPartyTested && (
                  <span className='bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-medium'>
                    ✓ 第三者検査済み
                  </span>
                )}
              </div>

              <h1 className='text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                {product.name}
              </h1>

              <p className='text-xl text-gray-600 mb-6 leading-relaxed'>
                {displayDescription}
              </p>

              <div className='flex flex-wrap gap-4 mb-6'>
                <div className='bg-white rounded-xl p-4 shadow-sm'>
                  <div className='text-2xl font-bold text-primary-600'>
                    <ClientPrice amount={product.priceJPY} />
                  </div>
                  <div className='text-sm text-gray-500'>価格</div>
                </div>
                <div className='bg-white rounded-xl p-4 shadow-sm'>
                  <div className='text-2xl font-bold text-secondary-600'>
                    {product.servingsPerContainer}
                  </div>
                  <div className='text-sm text-gray-500'>回分</div>
                </div>
                <div className='bg-white rounded-xl p-4 shadow-sm'>
                  <div className='text-2xl font-bold text-accent-600'>
                    {product.servingsPerDay}
                  </div>
                  <div className='text-sm text-gray-500'>回/日</div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className='space-y-3'>
                <div className='flex gap-3'>
                  <FavoriteButton
                    productId={product._id}
                    productName={product.name}
                    brand={product.brand}
                    category={(product as any).category || 'サプリメント'}
                    price={product.priceJPY}
                    currency='JPY'
                    className='flex-shrink-0'
                  />
                  <button className='flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'>
                    詳細を比較に追加
                  </button>
                </div>
                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      productId: product._id,
                      productName: product.name,
                      productBrand: product.brand,
                      currentPrice: product.priceJPY.toString(),
                    });
                    window.location.href = `/mypage/alerts?create=true&${params.toString()}`;
                  }}
                  className='w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 17h5l-5 5v-5zM12 17H7l5 5v-5zM12 3v5l5-5H12zM7 3l5 5V3H7z'
                    />
                  </svg>
                  価格アラートを設定
                </button>
              </div>
            </div>

            {/* Product Image */}
            <div className='flex justify-center'>
              {product.images && product.images.length > 0 ? (
                <div className='relative'>
                  <div className='absolute inset-0 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-xl blur-2xl opacity-30 transform rotate-6'></div>
                  <Image
                    src={product.images[0].asset.url}
                    alt={product.images[0].alt || product.name}
                    width={400}
                    height={400}
                    className='relative rounded-xl shadow-sm'
                    priority
                  />
                </div>
              ) : (
                <div className='w-80 h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center'>
                  <span className='text-6xl'>📦</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Basic Information */}
        <div className='card p-8 mb-8'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
              <span className='text-2xl'>📋</span>
            </div>
            <h2 className='text-2xl font-bold text-gray-900'>商品基本情報</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4'>
              <div className='text-sm text-primary-600 font-medium mb-1'>
                ブランド
              </div>
              <div className='text-lg font-bold text-primary-800'>
                {product.brand}
              </div>
            </div>

            <div className='bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-4'>
              <div className='text-sm text-secondary-600 font-medium mb-1'>
                価格
              </div>
              <div className='text-lg font-bold text-secondary-800'>
                <ClientPrice amount={product.priceJPY} />
              </div>
            </div>

            <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4'>
              <div className='text-sm text-primary-600 font-medium mb-1'>
                内容量
              </div>
              <div className='text-lg font-bold text-primary-800'>
                {product.servingsPerContainer}回分
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4'>
              <div className='text-sm text-purple-600 font-medium mb-1'>
                摂取目安
              </div>
              <div className='text-lg font-bold text-purple-800'>
                1日{product.servingsPerDay}回
              </div>
            </div>

            {product.form && (
              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4'>
                <div className='text-sm text-green-600 font-medium mb-1'>
                  形状
                </div>
                <div className='text-lg font-bold text-green-800'>
                  {product.form === 'capsule'
                    ? 'カプセル'
                    : product.form === 'tablet'
                      ? '錠剤'
                      : product.form === 'softgel'
                        ? 'ソフトジェル'
                        : product.form === 'powder'
                          ? '粉末'
                          : product.form === 'liquid'
                            ? '液体'
                            : product.form === 'gummy'
                              ? 'グミ'
                              : product.form}
                </div>
              </div>
            )}

            {product.thirdPartyTested && (
              <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4'>
                <div className='text-sm text-orange-600 font-medium mb-1'>
                  品質保証
                </div>
                <div className='text-lg font-bold text-orange-800'>
                  第三者検査済み
                </div>
              </div>
            )}

            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4'>
              <div className='text-sm text-gray-600 font-medium mb-1'>
                1回あたりコスト
              </div>
              <div className='text-lg font-bold text-gray-800'>
                ¥{Math.round(product.priceJPY / product.servingsPerContainer)}
              </div>
            </div>

            <div className='bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4'>
              <div className='text-sm text-indigo-600 font-medium mb-1'>
                1日あたりコスト
              </div>
              <div className='text-lg font-bold text-indigo-800'>
                ¥
                {Math.round(
                  (product.priceJPY / product.servingsPerContainer) *
                  product.servingsPerDay
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AIの推奨理由（要約） */}
        <AIProductReason
          productName={product.name}
          ingredients={(product.ingredients || []).map(i => ({
            name: i.ingredient?.name,
            evidenceLevel: i.ingredient?.evidenceLevel,
          }))}
        />

        {/* Product Scoring System with Error Boundary */}
        <ErrorBoundary fallback={<ScoringSystemFallback />}>
          <ProductScoring product={product} />
        </ErrorBoundary>

        {/* Ingredients Information */}
        {product.ingredients && product.ingredients.length > 0 && (
          <div className='card p-8 mb-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center'>
                <span className='text-2xl'>🧪</span>
              </div>
              <h2 className='text-2xl font-bold text-gray-900'>成分構成</h2>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {product.ingredients.map((item, index) => (
                <div
                  key={index}
                  className='bg-gradient-to-br from-gray-50 to-primary-50 rounded-xl p-4 border border-gray-100'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900 mb-1'>
                        {item.ingredient.name}
                      </h3>
                      <div className='flex flex-wrap gap-1 mb-2'>
                        {item.ingredient.category && (
                          <span className='inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs font-medium'>
                            {item.ingredient.category}
                          </span>
                        )}
                        {item.ingredient.tags &&
                          item.ingredient.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className='inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs'
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-lg font-bold text-secondary-600'>
                        {item.amountMgPerServing}
                      </div>
                      <div className='text-xs text-gray-500'>mg/回</div>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2 mt-3'>
                    {item.ingredient.evidenceLevel && (
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${item.ingredient.evidenceLevel === 'A'
                          ? 'bg-green-100 text-green-700'
                          : item.ingredient.evidenceLevel === 'B'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        エビデンス: {item.ingredient.evidenceLevel}
                      </span>
                    )}
                    {item.ingredient.safetyNotes &&
                      item.ingredient.safetyNotes.length > 0 && (
                        <span className='inline-block px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700'>
                          ⚠️ 注意事項あり
                        </span>
                      )}
                  </div>

                  {/* 成分の安全性情報 */}
                  {item.ingredient.safetyNotes &&
                    item.ingredient.safetyNotes.length > 0 && (
                      <div className='mt-3 p-2 bg-orange-50 rounded-md border border-orange-200'>
                        <div className='text-xs font-medium text-orange-800 mb-1'>
                          安全性情報:
                        </div>
                        <ul className='text-xs text-orange-700 space-y-1'>
                          {item.ingredient.safetyNotes
                            .slice(0, 2)
                            .map((note, noteIndex) => (
                              <li key={noteIndex} className='flex items-start'>
                                <span className='flex-shrink-0 w-1 h-1 bg-orange-400 rounded-full mt-1.5 mr-2'></span>
                                <span>{note}</span>
                              </li>
                            ))}
                          {item.ingredient.safetyNotes.length > 2 && (
                            <li className='text-orange-600 font-medium'>
                              他 {item.ingredient.safetyNotes.length - 2}{' '}
                              件の注意事項
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                  {/* 成分の同義語表示 */}
                  {item.ingredient.synonyms &&
                    item.ingredient.synonyms.length > 0 && (
                      <div className='mt-2 text-xs text-gray-500'>
                        別名: {item.ingredient.synonyms.slice(0, 2).join(', ')}
                        {item.ingredient.synonyms.length > 2 && ' など'}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings and Safety Information */}
        {product.warnings && product.warnings.length > 0 && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
            <h2 className='text-xl font-semibold mb-4'>注意事項</h2>
            <ul className='space-y-2'>
              {product.warnings.map((warning, index) => (
                <li key={index} className='flex items-start'>
                  <span className='flex-shrink-0 w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3'></span>
                  <span className='text-gray-700'>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price Comparison and History */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <PriceComparison
            productName={product.name}
            basePrice={product.priceJPY}
            servingsPerContainer={product.servingsPerContainer}
            servingsPerDay={product.servingsPerDay}
            ingredients={product.ingredients?.map(ing => ({
              amountMgPerServing: ing.amountMgPerServing,
            }))}
          />
          <PriceHistoryChart
            productName={product.name}
            currentPrice={product.priceJPY}
          />
        </div>

        {/* Price Table Component */}
        <PriceTable
          product={{
            name: product.name,
            priceJPY: product.priceJPY,
            servingsPerContainer: product.servingsPerContainer,
            servingsPerDay: product.servingsPerDay,
            ingredients: product.ingredients?.map(i => ({
              amountMgPerServing: i.amountMgPerServing,
            })),
          }}
          className='mb-8'
        />

        {/* Research and Reviews */}
        <ResearchAndReviews
          ingredients={(product.ingredients || []).map(i => ({
            name: i.ingredient?.name,
            evidenceLevel: i.ingredient?.evidenceLevel,
          }))}
          className='mb-8'
        />

        {/* Back to List */}
        <div className='text-center'>
          <Link
            href='/products'
            className='inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 ease-out'
          >
            商品一覧に戻る
          </Link>
        </div>
      </div>
    </>
  );
}
