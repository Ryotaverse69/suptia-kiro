import { sanity } from '@/lib/sanity.client';
import { calculateEffectiveCostPerDay, formatCostJPY } from '@/lib/cost';
import {
  ComparisonTable,
  Product as ComparisonProduct,
} from '@/components/ComparisonTable';
import { ComparisonFilters } from '@/components/ComparisonFilters';
import { ComparePageClient } from './ComparePageClient';
import { generateSEO } from '@/lib/seo-config';

export const metadata = generateSEO({
  title: 'サプリメント比較 - 価格・成分・安全性を総合評価',
  description:
    '科学的根拠に基づいたサプリメント比較。価格、成分、安全性を総合的に評価し、あなたに最適なサプリメントを見つけます。',
  url: 'https://suptia.com/compare',
  keywords: [
    'サプリメント',
    '比較',
    '価格比較',
    '成分分析',
    '安全性',
    'コスト分析',
  ],
});

interface SanityProduct {
  _id: string;
  name: string;
  brand: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: {
    current: string;
  };
  form?: string;
  thirdPartyTested?: boolean;
  ingredients?: Array<{
    ingredient: {
      name: string;
      category?: string;
    };
    amountMgPerServing: number;
  }>;
}

async function getProducts(): Promise<SanityProduct[]> {
  const query = `*[_type == "product"] | order(priceJPY asc){
    _id,
    name,
    brand,
    priceJPY,
    servingsPerContainer,
    servingsPerDay,
    slug,
    form,
    thirdPartyTested,
    ingredients[]{
      ingredient->{
        name,
        category
      },
      amountMgPerServing
    }
  }`;

  try {
    const products = await sanity.fetch(query);
    if (products && products.length > 0) {
      return products;
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  // デモデータを返す（Sanity接続エラーまたはデータなしの場合）
  return [
    {
      _id: 'demo-1',
      name: 'マルチビタミン プレミアム',
      brand: 'ヘルスプラス',
      priceJPY: 2980,
      servingsPerContainer: 60,
      servingsPerDay: 2,
      slug: { current: 'multivitamin-premium' },
      form: 'カプセル',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: { name: 'ビタミンA', category: 'ビタミン' },
          amountMgPerServing: 0.8,
        },
        {
          ingredient: { name: 'ビタミンC', category: 'ビタミン' },
          amountMgPerServing: 100,
        },
        {
          ingredient: { name: 'ビタミンD3', category: 'ビタミン' },
          amountMgPerServing: 0.025,
        },
      ],
    },
    {
      _id: 'demo-2',
      name: 'オメガ3 フィッシュオイル',
      brand: 'オーシャンヘルス',
      priceJPY: 3480,
      servingsPerContainer: 90,
      servingsPerDay: 3,
      slug: { current: 'omega3-fish-oil' },
      form: 'ソフトカプセル',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: { name: 'EPA', category: 'オメガ3脂肪酸' },
          amountMgPerServing: 500,
        },
        {
          ingredient: { name: 'DHA', category: 'オメガ3脂肪酸' },
          amountMgPerServing: 300,
        },
      ],
    },
    {
      _id: 'demo-3',
      name: 'ビタミンD3 + K2',
      brand: 'サンライト',
      priceJPY: 1980,
      servingsPerContainer: 120,
      servingsPerDay: 1,
      slug: { current: 'vitamin-d3-k2' },
      form: 'タブレット',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: { name: 'ビタミンD3', category: 'ビタミン' },
          amountMgPerServing: 0.025,
        },
        {
          ingredient: { name: 'ビタミンK2', category: 'ビタミン' },
          amountMgPerServing: 0.1,
        },
      ],
    },
    {
      _id: 'demo-4',
      name: 'プロバイオティクス',
      brand: 'ガットヘルス',
      priceJPY: 4280,
      servingsPerContainer: 30,
      servingsPerDay: 1,
      slug: { current: 'probiotics' },
      form: 'カプセル',
      thirdPartyTested: true,
      ingredients: [
        {
          ingredient: {
            name: 'ラクトバチルス・アシドフィルス',
            category: 'プロバイオティクス',
          },
          amountMgPerServing: 100,
        },
        {
          ingredient: {
            name: 'ビフィドバクテリウム・ラクティス',
            category: 'プロバイオティクス',
          },
          amountMgPerServing: 50,
        },
      ],
    },
  ];
}

export default async function ComparePage() {
  const products = await getProducts();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20'>
        <div className='container mx-auto px-4 text-center'>
          <h1 className='text-4xl md:text-6xl font-bold mb-6'>商品比較</h1>
          <p className='text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto'>
            科学的データに基づいて、あなたに最適なサプリメントを見つけましょう
          </p>
          <div className='flex items-center justify-center gap-4 text-primary-100'>
            <span className='flex items-center gap-2'>
              <span>🛡️</span> 安全性
            </span>
            <span className='flex items-center gap-2'>
              <span>💰</span> コスト
            </span>
            <span className='flex items-center gap-2'>
              <span>📊</span> 透明性
            </span>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className='py-20'>
        <div className='container mx-auto px-4'>
          {products.length > 0 ? (
            <div className='space-y-8'>
              <div className='text-center'>
                <h2 className='text-3xl font-bold text-gray-900 mb-4'>
                  インタラクティブ商品比較
                </h2>
                <p className='text-gray-600'>
                  {products.length}商品から選択して詳細比較を行いましょう
                </p>
              </div>

              <ComparePageClient initialProducts={products} />

              <div className='mt-8 text-center'>
                <p className='text-gray-600 mb-4'>
                  より詳細な分析が必要ですか？
                </p>
                <a href='/contact' className='btn-primary'>
                  専門家に相談する
                </a>
              </div>
            </div>
          ) : (
            <div className='text-center py-20'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6'></div>
              <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                商品データを読み込み中...
              </h2>
              <p className='text-gray-600'>最新の商品情報を取得しています</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 bg-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              比較機能の特徴
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              サプティアの比較システムが提供する独自の価値
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>⚡</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                リアルタイム比較
              </h3>
              <p className='text-gray-600 text-sm'>
                最新の価格と在庫情報で正確な比較
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🎯</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                パーソナライズ
              </h3>
              <p className='text-gray-600 text-sm'>
                あなたの健康状態に合わせた推奨
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>📈</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                科学的根拠
              </h3>
              <p className='text-gray-600 text-sm'>
                エビデンスレベルに基づく評価
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🔒</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                透明性
              </h3>
              <p className='text-gray-600 text-sm'>
                すべての判断基準を明確に表示
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
