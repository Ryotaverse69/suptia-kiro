import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import type { Metadata } from 'next';

import {
  MOCK_INGREDIENTS,
  getIngredientById,
  INGREDIENT_CATEGORIES,
  PURPOSE_CATEGORIES,
  PRODUCT_FORMS,
  getRecommendedProductsForIngredient,
  getRelatedIngredients,
  type IngredientProductRecommendation,
} from '@/lib/ingredient-data';
import { generateSEO } from '@/lib/seo-config';
import { getSiteUrl } from '@/lib/runtimeConfig';
import { cn, formatPrice } from '@/lib/utils';
import { buildBreadcrumbJsonLd } from '@/lib/utils/seo';

const categoryMap = new Map(
  INGREDIENT_CATEGORIES.map(category => [category.id, category])
);

const purposeMap = new Map(
  PURPOSE_CATEGORIES.map(purpose => [purpose.id, purpose])
);

const productFormMap = new Map(PRODUCT_FORMS.map(form => [form.id, form]));

function getEvidenceLevelTag(level: 'high' | 'medium' | 'low') {
  switch (level) {
    case 'high':
      return {
        label: 'エビデンスA（高品質な研究で確認）',
        badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      };
    case 'medium':
      return {
        label: 'エビデンスB（限定的な研究で示唆）',
        badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
      };
    case 'low':
    default:
      return {
        label: 'エビデンスC（予備的な研究段階）',
        badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200',
      };
  }
}

function getEvidenceLevelDescription(level: 'high' | 'medium' | 'low') {
  switch (level) {
    case 'high':
      return '主要な臨床研究で安定した効果が確認されています。';
    case 'medium':
      return '複数の研究で有望な結果が報告されていますが、さらなる検証が推奨されます。';
    case 'low':
    default:
      return '初期的な研究段階です。個々の体質によって効果に差が出る可能性があります。';
  }
}

function normalizeSlug(slug: string) {
  return slug.toLowerCase();
}

export function generateStaticParams() {
  return MOCK_INGREDIENTS.map(ingredient => ({ slug: ingredient.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = normalizeSlug(params.slug);
  const ingredient = getIngredientById(slug);

  if (!ingredient) {
    return generateSEO({
      title: '成分情報 - サプティア',
      description:
        'サプリメント成分の詳細情報を提供するサプティアの成分ガイド。',
      url: `${getSiteUrl()}/ingredients/${slug}`,
    });
  }

  const categoryInfo = categoryMap.get(ingredient.category);
  const siteUrl = getSiteUrl();

  return generateSEO({
    title: `${ingredient.name}の効果・安全性・推奨摂取量`,
    description: `${ingredient.name}（${ingredient.nameEn}）の効果、安全性、推奨摂取量、相互作用を科学的根拠に基づいて解説します。`,
    keywords: [
      ingredient.name,
      ingredient.nameEn,
      categoryInfo?.name ?? '成分',
      'サプリメント',
      '効果',
      '安全性',
      '推奨摂取量',
    ],
    url: `${siteUrl}/ingredients/${ingredient.id}`,
    type: 'article',
    section: '成分ガイド',
    tags: ingredient.benefits.slice(0, 5),
  });
}

export default function IngredientDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = normalizeSlug(params.slug);
  const ingredient = getIngredientById(slug);

  if (!ingredient) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const categoryInfo = categoryMap.get(ingredient.category);
  const evidenceTag = getEvidenceLevelTag(ingredient.evidenceLevel);
  const evidenceDescription = getEvidenceLevelDescription(
    ingredient.evidenceLevel
  );
  const purposes = ingredient.purposes
    .map(purpose => purposeMap.get(purpose)?.name)
    .filter((name): name is string => Boolean(name));
  const forms = ingredient.commonForms
    .map(form => productFormMap.get(form)?.name)
    .filter((name): name is string => Boolean(name));
  const productRecommendations: IngredientProductRecommendation[] =
    getRecommendedProductsForIngredient(ingredient.id);
  const relatedIngredients = getRelatedIngredients(ingredient.id, 4);
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'ホーム', url: '/' },
    { name: '成分ガイド', url: '/ingredients' },
    { name: ingredient.name, url: `/ingredients/${ingredient.id}` },
  ]);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DietarySupplement',
    name: ingredient.name,
    alternateName: ingredient.nameEn,
    description: ingredient.description,
    category: categoryInfo?.name,
    benefits: ingredient.benefits,
    isAvailableGenerically: true,
    material: ingredient.sources,
    targetPopulation: purposes,
    maximumIntake: ingredient.recommendedDosage,
    sameAs: `${siteUrl}/ingredients/${ingredient.id}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.max(
        4,
        Math.round((ingredient.popularity / 100) * 5 * 10) / 10
      ),
      reviewCount: Math.max(50, Math.round(ingredient.popularity * 1.2)),
    },
  };

  return (
    <>
      <Script id='ingredient-breadcrumb-jsonld' type='application/ld+json'>
        {JSON.stringify(breadcrumbs)}
      </Script>
      <Script id='ingredient-structured-data' type='application/ld+json'>
        {JSON.stringify(structuredData)}
      </Script>

      <article className='min-h-screen bg-slate-50'>
        <div className='bg-gradient-to-br from-white via-slate-50 to-slate-100'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16'>
            <nav
              className='flex items-center gap-2 text-sm text-slate-500 mb-8'
              aria-label='パンくずリスト'
            >
              <Link
                href='/'
                className='hover:text-primary-600 transition-colors'
              >
                ホーム
              </Link>
              <span>/</span>
              <Link
                href='/ingredients'
                className='hover:text-primary-600 transition-colors'
              >
                成分ガイド
              </Link>
              <span>/</span>
              <span className='text-slate-900'>{ingredient.name}</span>
            </nav>

            <header className='relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur shadow-[0_12px_40px_rgba(15,23,42,0.08)]'>
              <div
                className='absolute inset-0 bg-gradient-to-br from-primary-100/40 via-white to-transparent opacity-80'
                aria-hidden='true'
              />
              <div className='relative px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-16 grid lg:grid-cols-[2fr,1fr] gap-10'>
                <div>
                  <div className='flex flex-wrap items-center gap-3 mb-6'>
                    {categoryInfo && (
                      <span className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium shadow-sm'>
                        <span className='text-lg'>{categoryInfo.icon}</span>
                        {categoryInfo.name}
                      </span>
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm',
                        evidenceTag.badgeClass
                      )}
                    >
                      {evidenceTag.label}
                    </span>
                  </div>
                  <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4'>
                    {ingredient.name}
                  </h1>
                  <p className='text-lg text-slate-500 font-medium mb-6'>
                    {ingredient.nameEn}
                  </p>
                  <p className='text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl'>
                    {ingredient.description}
                  </p>
                </div>

                <aside className='bg-white rounded-2xl p-6 shadow-inner flex flex-col gap-6 border border-slate-100'>
                  <div>
                    <h2 className='text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2'>
                      平均価格
                    </h2>
                    <p className='text-3xl font-bold text-slate-900'>
                      {formatPrice(ingredient.averagePrice)}
                    </p>
                    <p className='text-sm text-slate-500 mt-1'>
                      推定月額コスト（参考値）
                    </p>
                  </div>
                  <div>
                    <h2 className='text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2'>
                      想定目的
                    </h2>
                    {purposes.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {purposes.map(purpose => (
                          <span
                            key={purpose}
                            className='inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-sm font-medium'
                          >
                            {purpose}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-slate-500'>
                        関連する目的情報は準備中です。
                      </p>
                    )}
                  </div>
                  <div>
                    <h2 className='text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2'>
                      推奨形状
                    </h2>
                    {forms.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {forms.map(form => (
                          <span
                            key={form}
                            className='inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-sm font-medium'
                          >
                            {form}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-slate-500'>
                        一般的な摂取形状の情報は準備中です。
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            </header>
          </div>
        </div>

        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-16'>
          <section
            aria-labelledby='evidence-overview'
            className='grid lg:grid-cols-[3fr,2fr] gap-10'
          >
            <div className='bg-white rounded-3xl shadow-[0_12px_40px_rgba(15,23,42,0.06)] border border-slate-100 p-8'>
              <h2
                id='evidence-overview'
                className='text-2xl font-semibold text-slate-900 mb-6'
              >
                エビデンス概要
              </h2>
              <p className='text-slate-600 leading-relaxed'>
                {evidenceDescription}
              </p>
              <div className='mt-6'>
                <h3 className='text-base font-semibold text-slate-800 mb-3'>
                  主な効果
                </h3>
                <ul className='space-y-2'>
                  {ingredient.benefits.map(benefit => (
                    <li
                      key={benefit}
                      className='flex items-start gap-3 text-slate-700'
                    >
                      <span
                        className='mt-1 h-2 w-2 rounded-full bg-primary-500'
                        aria-hidden='true'
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className='bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-3xl p-8 shadow-[0_12px_40px_rgba(37,99,235,0.25)]'>
              <h2 className='text-2xl font-semibold mb-4'>推奨摂取量</h2>
              <p className='text-lg font-medium'>
                {ingredient.recommendedDosage}
              </p>
              <p className='mt-4 text-sm text-primary-100 leading-relaxed'>
                個々の健康状態や医師の指示によって適切な摂取量は変わります。持病や服薬状況がある場合は、必ず医療専門家に相談してください。
              </p>
            </div>
          </section>

          <section
            aria-labelledby='safety-section'
            className='grid lg:grid-cols-2 gap-10'
          >
            <div className='bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-8'>
              <h2
                id='safety-section'
                className='text-2xl font-semibold text-slate-900 mb-4'
              >
                副作用・注意事項
              </h2>
              {ingredient.sideEffects.length > 0 ? (
                <ul className='space-y-3'>
                  {ingredient.sideEffects.map(item => (
                    <li
                      key={item}
                      className='flex items-start gap-3 text-slate-700'
                    >
                      <span
                        className='mt-1 h-2 w-2 rounded-full bg-amber-500'
                        aria-hidden='true'
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-slate-600'>
                  重大な副作用の報告はありません。
                </p>
              )}
            </div>

            <div className='bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-8'>
              <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
                薬物相互作用
              </h2>
              {ingredient.interactions.length > 0 ? (
                <ul className='space-y-3'>
                  {ingredient.interactions.map(item => (
                    <li
                      key={item}
                      className='flex items-start gap-3 text-slate-700'
                    >
                      <span
                        className='mt-1 h-2 w-2 rounded-full bg-rose-500'
                        aria-hidden='true'
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-slate-600'>
                  既知の重篤な相互作用は報告されていません。
                </p>
              )}
            </div>
          </section>

          <section
            aria-labelledby='sources-section'
            className='bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-8'
          >
            <h2
              id='sources-section'
              className='text-2xl font-semibold text-slate-900 mb-4'
            >
              天然の供給源
            </h2>
            {ingredient.sources.length > 0 ? (
              <div className='flex flex-wrap gap-3'>
                {ingredient.sources.map(source => (
                  <span
                    key={source}
                    className='inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-medium'
                  >
                    {source}
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-slate-600'>
                天然の供給源情報は現在調査中です。
              </p>
            )}
          </section>

          {productRecommendations.length > 0 ? (
            <section
              aria-labelledby='related-products'
              className='space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)]'
            >
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div>
                  <h2
                    id='related-products'
                    className='text-2xl font-semibold text-slate-900'
                  >
                    {ingredient.name} を主成分とする人気サプリメント
                  </h2>
                  <p className='text-sm text-slate-500'>
                    人気度・レビュー数・科学的根拠に基づき自動で抽出しています。
                  </p>
                </div>
                <Link
                  href={`/search?ingredient=${encodeURIComponent(ingredient.name)}&sort=popularity_desc`}
                  className='inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition duration-200 ease-apple hover:bg-primary-100'
                >
                  すべての比較結果を見る
                  <span aria-hidden='true'>→</span>
                </Link>
              </div>

              <div className='grid gap-6 lg:grid-cols-3'>
                {productRecommendations.map(product => (
                  <article
                    key={product.id}
                    className='flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition duration-200 ease-apple hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(15,23,42,0.08)]'
                  >
                    <header className='flex items-start justify-between gap-3'>
                      <div className='flex flex-col'>
                        <span className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-500'>
                          {product.brand}
                        </span>
                        <h3 className='text-lg font-semibold tracking-tight text-slate-900'>
                          {product.name}
                        </h3>
                      </div>
                      <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
                        マッチ度 {product.matchScore.toFixed(0)}%
                      </span>
                    </header>
                    <p className='text-sm text-slate-600 leading-relaxed'>
                      {product.headline}
                    </p>
                    <dl className='grid grid-cols-2 gap-3 text-sm text-slate-600'>
                      <div>
                        <dt className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                          推定価格
                        </dt>
                        <dd className='text-base font-semibold text-slate-900'>
                          {formatPrice(product.price)}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                          1日あたり
                        </dt>
                        <dd className='text-base font-semibold text-slate-900'>
                          {formatPrice(product.pricePerDay)}
                          <span className='text-xs text-slate-500'> /日</span>
                        </dd>
                      </div>
                      <div>
                        <dt className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                          レビュー
                        </dt>
                        <dd className='text-base font-semibold text-slate-900'>
                          ★ {product.rating.toFixed(1)}
                          <span className='text-xs text-slate-500'>
                            （{product.reviewCount.toLocaleString()}件）
                          </span>
                        </dd>
                      </div>
                    </dl>
                    <div className='mt-auto flex items-center justify-between gap-3'>
                      <Link
                        href={product.url}
                        className='inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition duration-150 ease-apple hover:text-primary-700'
                      >
                        詳細を見る
                        <span aria-hidden='true'>→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {relatedIngredients.length > 0 ? (
            <section
              aria-labelledby='related-ingredients'
              className='rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)]'
            >
              <h2
                id='related-ingredients'
                className='text-2xl font-semibold text-slate-900'
              >
                関連成分
              </h2>
              <p className='mt-2 text-sm text-slate-500'>
                同じカテゴリまたは目的でよく比較される成分です。
              </p>
              <div className='mt-5 flex flex-wrap gap-3'>
                {relatedIngredients.map(related => {
                  const relatedCategory = categoryMap.get(related.category);
                  return (
                    <Link
                      key={related.id}
                      href={`/ingredients/${related.id}`}
                      className='group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition duration-200 ease-apple hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
                    >
                      {relatedCategory ? (
                        <span className='text-lg' aria-hidden='true'>
                          {relatedCategory.icon}
                        </span>
                      ) : null}
                      <span className='flex flex-col items-start'>
                        <span>{related.name}</span>
                        <span className='text-xs font-normal text-slate-500'>
                          人気度 {related.popularity}%
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className='bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
            <div>
              <h2 className='text-2xl font-semibold mb-2'>
                この成分を含むサプリメントを探す
              </h2>
              <p className='text-slate-200 max-w-xl'>
                成分の効果と安全性を理解したら、サプティアの検索機能で最適なサプリメントを比較しましょう。価格・成分・エビデンスを横断的に確認できます。
              </p>
            </div>
            <Link
              href={`/search?ingredient=${encodeURIComponent(ingredient.name)}`}
              className='inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-6 py-3 font-semibold shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5'
            >
              サプリメントを比較する
            </Link>
          </section>

          <section className='rounded-3xl border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600'>
            <p>
              医療に関する免責事項:
              サプティアで提供する情報は教育と比較検討のためのものであり、医師や薬剤師その他専門家による診断・治療・指導に代わるものではありません。摂取や服用に関する判断は、必ず医療専門家の助言をもとに行ってください。
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
