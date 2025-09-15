'use client';

import { useState } from 'react';
import ClientPrice from '@/components/ClientPrice';
import { useLocale } from '@/contexts/LocaleContext';

interface Seller {
  name: string;
  price: number;
  url: string;
  shipping: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

interface PriceComparisonProps {
  productName: string;
  basePrice: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  // Optional: total mg per serving for normalization
  ingredients?: Array<{
    amountMgPerServing: number;
  }>;
  sellers?: Seller[];
  className?: string;
}

/**
 * 価格比較コンポーネント
 * 複数販売者の価格を比較表示
 */
export function PriceComparison({
  productName,
  basePrice,
  servingsPerContainer,
  servingsPerDay,
  ingredients = [],
  sellers = [],
  className = '',
}: PriceComparisonProps) {
  const [sortBy, setSortBy] = useState<'price' | 'total' | 'rating'>('total');
  const { formatPrice } = useLocale();

  // デモ用の販売者データを生成
  const generateDemoSellers = (): Seller[] => {
    const sellerNames = [
      'Amazon',
      '楽天市場',
      'iHerb',
      'Yahoo!ショッピング',
      'ヨドバシ.com',
      'ビックカメラ.com',
    ];

    return sellerNames.map(name => {
      const priceVariation = (Math.random() - 0.5) * 0.3; // ±15%の価格変動
      const price = Math.round(basePrice * (1 + priceVariation));
      const shipping =
        Math.random() > 0.5 ? 0 : Math.round(Math.random() * 500);

      return {
        name,
        price,
        url: `https://example.com/${name.toLowerCase()}`,
        shipping,
        inStock: Math.random() > 0.1, // 90%の確率で在庫あり
        rating: 3.5 + Math.random() * 1.5, // 3.5-5.0の評価
        reviewCount: Math.round(Math.random() * 1000),
      };
    });
  };

  const sellerData = sellers.length > 0 ? sellers : generateDemoSellers();

  // ソート処理
  const sortedSellers = [...sellerData].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'total':
        return a.price + a.shipping - (b.price + b.shipping);
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  // 正規化価格計算（mg/日あたり）
  // Compute cost per day and normalize by total mg per day if ingredients provided
  const calculateNormalizedPrice = (price: number, shipping: number) => {
    const totalCost = price + shipping;
    const costPerServing = totalCost / servingsPerContainer;
    const costPerDay = costPerServing * servingsPerDay;
    const totalMgPerServing = ingredients.reduce(
      (sum, ing) => sum + (ing?.amountMgPerServing || 0),
      0
    );
    const mgPerDay = totalMgPerServing * servingsPerDay;
    // If we cannot determine mg/day, fall back to cost per day
    if (!mgPerDay || mgPerDay <= 0) return costPerDay;
    // 円/mg/日 の単価
    return costPerDay / mgPerDay;
  };

  return (
    <div
      className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
            <span className='text-2xl'>💰</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>価格比較</h3>
        </div>

        <div className='flex gap-2'>
          <select
            value={sortBy}
            onChange={e =>
              setSortBy(e.target.value as 'price' | 'total' | 'rating')
            }
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          >
            <option value='total'>総額順</option>
            <option value='price'>商品価格順</option>
            <option value='rating'>評価順</option>
          </select>
        </div>
      </div>

      {/* 価格比較テーブル */}
      <div className='overflow-x-auto'>
        <table
          className='w-full'
          role='table'
          aria-label={`${productName} の価格比較テーブル`}
        >
          <caption className='sr-only'>
            {productName}{' '}
            の販売者別価格比較。商品価格、送料、総額、1日あたり、mg/日あたりの単価を表示。
          </caption>
          <thead>
            <tr className='border-b-2 border-gray-100'>
              <th
                scope='col'
                className='text-left py-3 px-2 font-semibold text-gray-700'
              >
                販売者
              </th>
              <th
                scope='col'
                className='text-right py-3 px-2 font-semibold text-gray-700'
              >
                商品価格
              </th>
              <th
                scope='col'
                className='text-right py-3 px-2 font-semibold text-gray-700'
              >
                送料
              </th>
              <th
                scope='col'
                className='text-right py-3 px-2 font-semibold text-gray-700'
              >
                総額
              </th>
              <th
                scope='col'
                className='text-right py-3 px-2 font-semibold text-gray-700'
              >
                1日あたり
              </th>
              <th
                scope='col'
                className='text-right py-3 px-2 font-semibold text-gray-700'
              >
                通貨/mg・日
              </th>
              <th
                scope='col'
                className='text-center py-3 px-2 font-semibold text-gray-700'
              >
                評価
              </th>
              <th
                scope='col'
                className='text-center py-3 px-2 font-semibold text-gray-700'
              >
                在庫
              </th>
              <th
                scope='col'
                className='text-center py-3 px-2 font-semibold text-gray-700'
              >
                購入
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSellers.map((seller, index) => {
              const totalPrice = seller.price + seller.shipping;
              const normalizedUnit = calculateNormalizedPrice(
                seller.price,
                seller.shipping
              );
              const totalCost = seller.price + seller.shipping;
              const costPerServing = totalCost / servingsPerContainer;
              const costPerDay = costPerServing * servingsPerDay;
              const isLowestPrice = index === 0 && sortBy === 'total';

              return (
                <tr
                  key={seller.name}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isLowestPrice ? 'bg-green-50 border-green-200' : ''
                    }`}
                >
                  <td className='py-4 px-2'>
                    <div className='flex items-center gap-2'>
                      {isLowestPrice && (
                        <span className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'>
                          最安値
                        </span>
                      )}
                      <span className='font-medium text-gray-900'>
                        {seller.name}
                      </span>
                    </div>
                  </td>
                  <td className='py-4 px-2 text-right font-medium'>
                    <ClientPrice amount={seller.price} />
                  </td>
                  <td className='py-4 px-2 text-right'>
                    {seller.shipping === 0 ? (
                      <span className='text-green-600 font-medium'>無料</span>
                    ) : (
                      <span>
                        <ClientPrice amount={seller.shipping} />
                      </span>
                    )}
                  </td>
                  <td className='py-4 px-2 text-right font-bold text-lg'>
                    <ClientPrice amount={totalPrice} />
                  </td>
                  <td className='py-4 px-2 text-right font-medium text-primary-600'>
                    {formatPrice(costPerDay)}
                  </td>
                  <td className='py-4 px-2 text-right font-medium'>
                    {isFinite(normalizedUnit) && normalizedUnit > 0
                      ? `${formatPrice(normalizedUnit)}`
                      : '—'}
                  </td>
                  <td className='py-4 px-2 text-center'>
                    <div className='flex items-center justify-center gap-1'>
                      <span className='text-yellow-400'>★</span>
                      <span className='font-medium'>
                        {seller.rating.toFixed(1)}
                      </span>
                      <span className='text-xs text-gray-500'>
                        ({seller.reviewCount})
                      </span>
                    </div>
                  </td>
                  <td className='py-4 px-2 text-center'>
                    {seller.inStock ? (
                      <span className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium'>
                        在庫あり
                      </span>
                    ) : (
                      <span className='bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium'>
                        在庫切れ
                      </span>
                    )}
                  </td>
                  <td className='py-4 px-2 text-center'>
                    <a
                      href={seller.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${seller.inStock
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      onClick={
                        seller.inStock ? undefined : e => e.preventDefault()
                      }
                    >
                      {seller.inStock ? '購入' : '在庫切れ'}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 価格比較サマリー */}
      <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center'>
          <div>
            <div className='text-sm text-primary-600 font-medium'>最安値</div>
            <div className='text-lg font-bold text-primary-800'>
              {formatPrice(
                Math.min(...sortedSellers.map(s => s.price + s.shipping))
              )}
            </div>
          </div>
          <div>
            <div className='text-sm text-primary-600 font-medium'>平均価格</div>
            <div className='text-lg font-bold text-primary-800'>
              {formatPrice(
                sortedSellers.reduce(
                  (sum, s) => sum + s.price + s.shipping,
                  0
                ) / sortedSellers.length
              )}
            </div>
          </div>
          <div>
            <div className='text-sm text-primary-600 font-medium'>価格差</div>
            <div className='text-lg font-bold text-primary-800'>
              {formatPrice(
                Math.max(...sortedSellers.map(s => s.price + s.shipping)) -
                Math.min(...sortedSellers.map(s => s.price + s.shipping))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className='mt-4 text-xs text-gray-500'>
        ※
        価格は変動する可能性があります。最新の価格は各販売サイトでご確認ください。
        <br />※ 1日あたりコストは推奨摂取量（{servingsPerDay}
        回/日）に基づいて計算されています。
      </div>
    </div>
  );
}
