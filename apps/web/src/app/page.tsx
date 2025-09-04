import { sanity } from '@/lib/sanity.client';
import { calculateEffectiveCostPerDay, formatCostJPY } from '@/lib/cost';
import { generateSEO } from '@/lib/seo-config';
import dynamic from 'next/dynamic';

export const metadata = generateSEO({
  title: 'サプティア - あなたに最も合うサプリを最も安い価格で',
  description:
    'AIが分析する科学的根拠に基づいたサプリメント比較サイト。成分・価格・安全性を総合評価し、あなたに最適なサプリメントを見つけます。',
  url: 'https://suptia.com',
  type: 'website',
});

// AIRecommendationSearchBarを動的インポート（クライアントコンポーネント）
const AIRecommendationSearchBar = dynamic(
  () =>
    import('@/components/AIRecommendationSearchBar').then(mod => ({
      default: mod.AIRecommendationSearchBar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='max-w-2xl mx-auto'>
        <div className='h-16 bg-gray-200 rounded-2xl animate-pulse'></div>
      </div>
    ),
  }
);

interface Product {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: {
    current: string;
  };
}

async function getProducts(): Promise<Product[]> {
  // デモ用のサンプルデータを返す（Sanity接続エラーを回避）
  return [
    {
      name: 'マルチビタミン プレミアム',
      priceJPY: 2980,
      servingsPerContainer: 60,
      servingsPerDay: 2,
      slug: { current: 'multivitamin-premium' },
    },
    {
      name: 'オメガ3 フィッシュオイル',
      priceJPY: 3480,
      servingsPerContainer: 90,
      servingsPerDay: 3,
      slug: { current: 'omega3-fish-oil' },
    },
    {
      name: 'ビタミンD3 + K2',
      priceJPY: 1980,
      servingsPerContainer: 120,
      servingsPerDay: 1,
      slug: { current: 'vitamin-d3-k2' },
    },
    {
      name: 'プロバイオティクス',
      priceJPY: 4280,
      servingsPerContainer: 30,
      servingsPerDay: 1,
      slug: { current: 'probiotics' },
    },
  ];
}

// クライアントコンポーネント用のホームページコンテンツ
const HomeContent = dynamic(() => import('@/components/HomeSearchSection'), {
  ssr: false,
  loading: () => (
    <div className='mb-12 max-w-3xl mx-auto'>
      <div className='h-16 bg-gray-200 rounded-2xl animate-pulse'></div>
    </div>
  ),
});

export default async function Home() {
  const products = await getProducts();

  return (
    <div className='min-h-screen scroll-smooth'>
      {/* Hero Section - ファーストビュー */}
      <section className='relative overflow-hidden min-h-screen flex items-center'>
        {/* minimal hero without decorative blobs */}

        <div className='relative container mx-auto px-4 py-20'>
          <div className='text-center max-w-5xl mx-auto'>
            <div className='animate-fade-in'>
              {/* メインタイトル */}
              <h1 className='text-6xl md:text-8xl font-bold mb-8 tracking-tight'>
                <span className='gradient-text drop-shadow-sm'>サプティア</span>
              </h1>

              {/* キャッチフレーズ - 要件1.2に準拠 */}
              <p className='text-2xl md:text-3xl text-gray-700 mb-4 font-medium text-balance'>
                あなたに最も合うサプリを
              </p>
              <p className='text-2xl md:text-3xl text-gray-700 mb-12 font-medium text-balance'>
                <span className='gradient-text font-bold'>
                  最も安い価格で。
                </span>
              </p>

              <HomeContent />

              {/* アクションボタン */}
              <div
                className='flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up'
                style={{ animationDelay: '0.3s' }}
              >
                <a
                  href='/compare'
                  className='btn-primary text-lg px-8 py-4 shadow-strong'
                >
                  <span className='flex items-center gap-3'>
                    <span className='text-2xl'>🔍</span>
                    商品を比較する
                  </span>
                </a>
                <a
                  href='#products'
                  className='btn-secondary text-lg px-8 py-4 shadow-medium'
                >
                  <span className='flex items-center gap-3'>
                    <span className='text-2xl'>⭐</span>
                    おすすめ商品を見る
                  </span>
                </a>
              </div>

              {/* 信頼性指標 */}
              <div
                className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-up'
                style={{ animationDelay: '0.5s' }}
              >
                <div className='glass-effect rounded-2xl p-6 shadow-soft'>
                  <div className='text-3xl mb-2'>🛡️</div>
                  <div className='text-2xl font-bold text-primary-600 mb-1'>
                    安全性重視
                  </div>
                  <div className='text-gray-600'>科学的エビデンス基準</div>
                </div>
                <div className='glass-effect rounded-2xl p-6 shadow-soft'>
                  <div className='text-3xl mb-2'>💰</div>
                  <div className='text-2xl font-bold text-secondary-600 mb-1'>
                    価格最適化
                  </div>
                  <div className='text-gray-600'>実効コスト分析</div>
                </div>
                <div className='glass-effect rounded-2xl p-6 shadow-soft'>
                  <div className='text-3xl mb-2'>🤖</div>
                  <div className='text-2xl font-bold text-indigo-600 mb-1'>
                    AI推奨
                  </div>
                  <div className='text-gray-600'>説明可能な意思決定</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 人気サプリ比較セクション - 要件2.3に準拠 */}
      <section className='py-20 bg-white relative overflow-hidden'>
        {/* 背景装飾 */}
        <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500'></div>

        <div className='container mx-auto px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              <span className='gradient-text'>人気サプリ比較</span>
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto mb-8'>
              コストパフォーマンスに優れた厳選商品を、科学的根拠に基づいて比較分析
            </p>
            <a
              href='/compare'
              className='inline-flex items-center gap-3 btn-primary text-lg px-8 py-4 shadow-strong'
            >
              <span className='text-2xl'>📊</span>
              詳細比較を見る
            </a>
          </div>

          {/* 人気商品プレビュー */}
          {products.length > 0 ? (
            <div className='max-w-7xl mx-auto'>
              <div className='glass-effect rounded-3xl p-8 shadow-strong'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b-2 border-primary-100'>
                        <th className='text-left py-6 px-6 font-bold text-gray-800 text-lg'>
                          商品名
                        </th>
                        <th className='text-left py-6 px-6 font-bold text-gray-800 text-lg'>
                          価格
                        </th>
                        <th className='text-left py-6 px-6 font-bold text-gray-800 text-lg'>
                          容量
                        </th>
                        <th className='text-left py-6 px-6 font-bold text-gray-800 text-lg'>
                          1日摂取量
                        </th>
                        <th className='text-left py-6 px-6 font-bold text-gray-800 text-lg'>
                          実効コスト/日
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => {
                        let effectiveCostPerDay = 0;
                        let costError = false;

                        try {
                          effectiveCostPerDay = calculateEffectiveCostPerDay({
                            priceJPY: product.priceJPY,
                            servingsPerContainer: product.servingsPerContainer,
                            servingsPerDay: product.servingsPerDay,
                          });
                        } catch (error) {
                          costError = true;
                        }

                        return (
                          <tr
                            key={index}
                            className='border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-secondary-50/50 transition-all duration-300'
                          >
                            <td className='py-6 px-6'>
                              <a
                                href={`/products/${product.slug?.current || 'unknown'}`}
                                className='font-semibold text-primary-600 hover:text-primary-800 hover:underline transition-colors text-lg'
                              >
                                {product.name}
                              </a>
                            </td>
                            <td className='py-6 px-6 text-gray-700 text-lg font-medium'>
                              {formatCostJPY(product.priceJPY)}
                            </td>
                            <td className='py-6 px-6'>
                              <span className='bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full text-sm font-medium'>
                                {product.servingsPerContainer}回分
                              </span>
                            </td>
                            <td className='py-6 px-6'>
                              <span className='bg-gradient-to-r from-blue-100 to-blue-200 px-4 py-2 rounded-full text-sm font-medium'>
                                {product.servingsPerDay}回/日
                              </span>
                            </td>
                            <td className='py-6 px-6'>
                              {costError ? (
                                <span className='text-red-500 font-bold text-lg'>
                                  計算不可
                                </span>
                              ) : (
                                <span className='font-bold text-xl text-secondary-600 bg-gradient-to-r from-secondary-50 to-secondary-100 px-4 py-2 rounded-full shadow-sm'>
                                  {formatCostJPY(effectiveCostPerDay)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-16'>
              <div className='animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-6'></div>
              <p className='text-gray-600 text-lg'>商品データを読み込み中...</p>
            </div>
          )}
        </div>
      </section>

      {/* 成分ガイドへの導線セクション - 要件2.4に準拠 */}
      <section className='py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden'>
        {/* 背景装飾 */}
        <div className='absolute inset-0 bg-grid-pattern opacity-5'></div>
        <div className='absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-primary-300/20 to-secondary-300/20 rounded-full blur-2xl animate-pulse-gentle'></div>
        <div
          className='absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-br from-secondary-300/20 to-indigo-300/20 rounded-full blur-xl animate-pulse-gentle'
          style={{ animationDelay: '1s' }}
        ></div>

        <div className='container mx-auto px-4 relative'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              <span className='gradient-text'>成分ガイド</span>
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto mb-8'>
              科学的根拠に基づいた成分情報で、あなたに最適なサプリメントを見つけましょう
            </p>
          </div>

          {/* カテゴリ別成分ガイド */}
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16'>
            <a href='/ingredients?category=vitamins' className='group'>
              <div className='glass-effect rounded-3xl p-8 text-center shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2'>
                <div className='w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <span className='text-3xl'>🍊</span>
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>
                  ビタミン
                </h3>
                <p className='text-gray-600 text-sm'>
                  ビタミンA、C、D、E、B群など必須ビタミンの効果と選び方
                </p>
              </div>
            </a>

            <a href='/ingredients?category=minerals' className='group'>
              <div className='glass-effect rounded-3xl p-8 text-center shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2'>
                <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <span className='text-3xl'>⚡</span>
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>
                  ミネラル
                </h3>
                <p className='text-gray-600 text-sm'>
                  カルシウム、鉄、亜鉛、マグネシウムなど重要ミネラル
                </p>
              </div>
            </a>

            <a href='/ingredients?category=herbs' className='group'>
              <div className='glass-effect rounded-3xl p-8 text-center shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2'>
                <div className='w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <span className='text-3xl'>🌿</span>
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>ハーブ</h3>
                <p className='text-gray-600 text-sm'>
                  ウコン、イチョウ、高麗人参など天然ハーブ成分
                </p>
              </div>
            </a>

            <a href='/ingredients?category=amino-acids' className='group'>
              <div className='glass-effect rounded-3xl p-8 text-center shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2'>
                <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <span className='text-3xl'>💪</span>
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>
                  アミノ酸
                </h3>
                <p className='text-gray-600 text-sm'>
                  BCAA、グルタミン、アルギニンなど必須アミノ酸
                </p>
              </div>
            </a>
          </div>

          {/* 目的別ガイド */}
          <div className='text-center mb-12'>
            <h3 className='text-3xl font-bold text-gray-900 mb-8'>
              目的別で選ぶ
            </h3>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <a href='/ingredients?purpose=fatigue' className='group'>
              <div className='glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <span className='text-2xl'>⚡</span>
                  </div>
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-1'>
                      疲労回復
                    </h4>
                    <p className='text-gray-600 text-sm'>
                      エネルギー代謝をサポート
                    </p>
                  </div>
                </div>
              </div>
            </a>

            <a href='/ingredients?purpose=beauty' className='group'>
              <div className='glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <span className='text-2xl'>✨</span>
                  </div>
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-1'>
                      美容・アンチエイジング
                    </h4>
                    <p className='text-gray-600 text-sm'>
                      肌と髪の健康をサポート
                    </p>
                  </div>
                </div>
              </div>
            </a>

            <a href='/ingredients?purpose=immunity' className='group'>
              <div className='glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <span className='text-2xl'>🛡️</span>
                  </div>
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-1'>
                      免疫力向上
                    </h4>
                    <p className='text-gray-600 text-sm'>体の防御機能を強化</p>
                  </div>
                </div>
              </div>
            </a>

            <a href='/ingredients?purpose=brain' className='group'>
              <div className='glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <span className='text-2xl'>🧠</span>
                  </div>
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-1'>
                      脳機能・集中力
                    </h4>
                    <p className='text-gray-600 text-sm'>認知機能をサポート</p>
                  </div>
                </div>
              </div>
            </a>

            <a href='/ingredients?purpose=sleep' className='group'>
              <div className='glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <span className='text-2xl'>😴</span>
                  </div>
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-1'>
                      睡眠・リラックス
                    </h4>
                    <p className='text-gray-600 text-sm'>
                      質の良い睡眠をサポート
                    </p>
                  </div>
                </div>
              </div>
            </a>

            <a href='/ingredients?purpose=sports' className='group'>
              <div className='glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <span className='text-2xl'>🏃</span>
                  </div>
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-1'>
                      スポーツ・筋力
                    </h4>
                    <p className='text-gray-600 text-sm'>
                      運動パフォーマンス向上
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* 成分ガイドへのCTA */}
          <div className='text-center mt-16'>
            <a
              href='/ingredients'
              className='inline-flex items-center gap-3 btn-primary text-lg px-8 py-4 shadow-strong'
            >
              <span className='text-2xl'>📚</span>
              成分ガイドを詳しく見る
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-gradient-to-br from-primary-600 via-blue-600 to-secondary-600 relative overflow-hidden'>
        {/* 背景装飾 */}
        <div className='absolute inset-0 bg-grid-pattern opacity-10'></div>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-600/90 to-secondary-600/90'></div>

        <div className='container mx-auto px-4 text-center relative'>
          <h2 className='text-4xl md:text-5xl font-bold text-white mb-8'>
            あなたに最適なサプリを
            <br />
            <span className='text-yellow-300'>見つけませんか？</span>
          </h2>
          <p className='text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed'>
            科学的根拠に基づいた分析で、安全で効果的なサプリメントを選択しましょう。
            <br />
            AIがあなたの目的と体質に合わせて最適な選択肢を提案します。
          </p>

          <div className='flex flex-col sm:flex-row gap-6 justify-center items-center'>
            <a
              href='/compare'
              className='inline-flex items-center gap-3 bg-white text-primary-600 font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-lg'
            >
              <span className='text-2xl'>🚀</span>
              今すぐ比較を始める
            </a>

            <a
              href='/ingredients'
              className='inline-flex items-center gap-3 bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-2xl hover:bg-white hover:text-primary-600 transform hover:-translate-y-2 transition-all duration-300 text-lg'
            >
              <span className='text-2xl'>📚</span>
              成分ガイドを見る
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
