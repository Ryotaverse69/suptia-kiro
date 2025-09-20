'use client';

import { useEffect, useMemo, useState } from 'react';

interface PricePoint {
  month: string;
  price: number;
}

interface PriceCategory {
  key: string;
  label: string;
  color: string;
  description: string;
  data: PricePoint[];
}

const fallbackCategories: PriceCategory[] = [
  {
    key: 'vitamin-d',
    label: 'ビタミンD',
    color: '#0a78b5',
    description: '冬シーズンに需要が高まり、春以降は安定傾向。',
    data: [
      { month: '1月', price: 2680 },
      { month: '2月', price: 2620 },
      { month: '3月', price: 2550 },
      { month: '4月', price: 2480 },
      { month: '5月', price: 2450 },
      { month: '6月', price: 2380 },
      { month: '7月', price: 2320 },
      { month: '8月', price: 2280 },
      { month: '9月', price: 2350 },
      { month: '10月', price: 2420 },
      { month: '11月', price: 2520 },
      { month: '12月', price: 2680 },
    ],
  },
  {
    key: 'protein',
    label: 'プロテイン',
    color: '#ff6b35',
    description: '大型セール時に大きく価格が下がる傾向です。',
    data: [
      { month: '1月', price: 5280 },
      { month: '2月', price: 4980 },
      { month: '3月', price: 4720 },
      { month: '4月', price: 4680 },
      { month: '5月', price: 4590 },
      { month: '6月', price: 4520 },
      { month: '7月', price: 4680 },
      { month: '8月', price: 4820 },
      { month: '9月', price: 4550 },
      { month: '10月', price: 4380 },
      { month: '11月', price: 4180 },
      { month: '12月', price: 5120 },
    ],
  },
  {
    key: 'multivitamin',
    label: 'マルチビタミン',
    color: '#12b8ad',
    description: '年間を通して安定した価格で推移しています。',
    data: [
      { month: '1月', price: 3120 },
      { month: '2月', price: 3080 },
      { month: '3月', price: 3020 },
      { month: '4月', price: 2980 },
      { month: '5月', price: 2950 },
      { month: '6月', price: 2920 },
      { month: '7月', price: 2960 },
      { month: '8月', price: 2990 },
      { month: '9月', price: 3040 },
      { month: '10月', price: 3080 },
      { month: '11月', price: 3120 },
      { month: '12月', price: 3180 },
    ],
  },
];

interface ChartGeometry {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const geometry: ChartGeometry = {
  width: 880,
  height: 320,
  margin: { top: 24, right: 32, bottom: 48, left: 56 },
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('ja-JP').format(value);
}

interface PriceTrendsProps {
  categories?: Array<{
    key: string;
    label: string;
    description?: string;
    color?: string;
    data: PricePoint[];
  }>;
}

const colorPalette = ['#0a78b5', '#ff6b35', '#12b8ad', '#7c3aed', '#fbbf24'];

export function PriceTrends({ categories }: PriceTrendsProps) {
  const displayCategories = useMemo<PriceCategory[]>(() => {
    if (!categories || categories.length === 0) {
      return fallbackCategories;
    }

    return categories.map((category, index) => ({
      key: category.key,
      label: category.label,
      data: category.data,
      color: category.color || colorPalette[index % colorPalette.length],
      description:
        category.description ||
        `${category.label}カテゴリの平均価格推移です。最新データはサニティから取得しています。`,
    }));
  }, [categories]);

  const [activeKey, setActiveKey] = useState<string>(
    displayCategories[0]?.key ?? ''
  );

  useEffect(() => {
    if (displayCategories.length === 0) return;
    setActiveKey(displayCategories[0].key);
  }, [displayCategories]);

  const activeCategory =
    displayCategories.find(category => category.key === activeKey) ??
    displayCategories[0];

  const chartData = useMemo(() => {
    const values = activeCategory.data.map(point => point.price);
    const max = Math.max(...values) + 300;
    const min = Math.max(0, Math.min(...values) - 300);
    const chartWidth =
      geometry.width - geometry.margin.left - geometry.margin.right;
    const chartHeight =
      geometry.height - geometry.margin.top - geometry.margin.bottom;
    const step = chartWidth / Math.max(1, activeCategory.data.length - 1);
    const range = max - min || 1;

    const points = activeCategory.data.map((point, index) => {
      const x = geometry.margin.left + step * index;
      const y =
        geometry.margin.top + (max - point.price) * (chartHeight / range);
      return { ...point, x, y };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    const areaPath = `${['M', points[0].x, geometry.height - geometry.margin.bottom].join(' ')} ${points
      .map(point => `L ${point.x} ${point.y}`)
      .join(
        ' '
      )} L ${points[points.length - 1].x} ${geometry.height - geometry.margin.bottom} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const value = max - range * ratio;
      const y = geometry.margin.top + (max - value) * (chartHeight / range);
      return { y, value: Math.round(value / 10) * 10 };
    });

    return { points, linePath, areaPath, yTicks, max, min };
  }, [activeCategory]);

  return (
    <section className='bg-surface-subtle py-16'>
      <div className='mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8'>
        <header className='mb-8 text-center md:text-left'>
          <p className='text-sm font-semibold uppercase tracking-[0.4em] text-neutral-500'>
            PRICE INSIGHTS
          </p>
          <h2 className='mt-2 text-3xl font-semibold text-[#1f242f] sm:text-[34px]'>
            サプリメントの購入に最適な時期をチェック
          </h2>
          <p className='mt-3 text-sm text-neutral-600'>
            カテゴリごとの平均価格推移を毎日更新。値動きの大きい時期を把握できます。
          </p>
        </header>

        <div className='flex flex-col gap-6 rounded-[16px] border border-[#e0e0e0] bg-white p-6 shadow-trivago-card md:p-8'>
          <div className='flex flex-wrap items-center gap-3'>
            {displayCategories.map(category => {
              const isActive = category.key === activeCategory.key;
              return (
                <button
                  key={category.key}
                  type='button'
                  onClick={() => setActiveKey(category.key)}
                  className={`rounded-pill border px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-trivago ${
                    isActive
                      ? 'border-transparent bg-trivago-blue text-white'
                      : 'border-[#e0e0e0] bg-white text-neutral-600 hover:border-trivago-blue hover:text-trivago-blue'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <p className='text-sm text-neutral-500'>
            {activeCategory?.description}
          </p>

          <div className='overflow-x-auto'>
            <svg
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              className='h-[260px] min-w-[720px] w-full'
              role='img'
              aria-label={`${activeCategory?.label ?? 'カテゴリ'}の平均価格推移`}
            >
              <defs>
                <linearGradient
                  id='priceAreaGradient'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor={activeCategory?.color ?? '#0a78b5'}
                    stopOpacity='0.38'
                  />
                  <stop
                    offset='100%'
                    stopColor={activeCategory?.color ?? '#0a78b5'}
                    stopOpacity='0'
                  />
                </linearGradient>
              </defs>

              {/* y-axis grid */}
              {chartData.yTicks.map(tick => (
                <g key={tick.y}>
                  <line
                    x1={geometry.margin.left}
                    x2={geometry.width - geometry.margin.right}
                    y1={tick.y}
                    y2={tick.y}
                    stroke='#e5e7eb'
                    strokeDasharray='4 4'
                  />
                  <text
                    x={geometry.margin.left - 16}
                    y={tick.y + 4}
                    textAnchor='end'
                    fontSize='11'
                    fill='#6d7584'
                  >
                    ¥{formatPrice(tick.value)}
                  </text>
                </g>
              ))}

              {/* x-axis labels */}
              {chartData.points.map((point, index) => (
                <text
                  key={point.month}
                  x={point.x}
                  y={geometry.height - geometry.margin.bottom + 24}
                  textAnchor='middle'
                  fontSize='11'
                  fill='#6d7584'
                >
                  {index % 2 === 0 ? point.month : ''}
                </text>
              ))}

              <path d={chartData.areaPath} fill='url(#priceAreaGradient)' />
              <path
                d={chartData.linePath}
                fill='none'
                stroke={activeCategory?.color ?? '#0a78b5'}
                strokeWidth={3}
                strokeLinecap='round'
              />

              {chartData.points.map(point => (
                <g key={point.month}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill='#ffffff'
                    stroke={activeCategory?.color ?? '#0a78b5'}
                    strokeWidth={2}
                  />
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor='middle'
                    fontSize='11'
                    fill='#1f242f'
                  >
                    ¥{formatPrice(point.price)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
