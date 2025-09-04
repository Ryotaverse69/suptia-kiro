'use client';

import { useState, useEffect } from 'react';

interface PricePoint {
    date: string;
    price: number;
    source: string;
}

interface PriceHistoryChartProps {
    productName: string;
    priceHistory?: PricePoint[];
    currentPrice: number;
    className?: string;
}

/**
 * 価格履歴グラフコンポーネント
 * SVGを使用してシンプルな折れ線グラフを表示
 */
export function PriceHistoryChart({
    productName,
    priceHistory = [],
    currentPrice,
    className = ''
}: PriceHistoryChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
    const [filteredData, setFilteredData] = useState<PricePoint[]>([]);

    // デモ用の価格履歴データを生成
    const generateDemoData = (): PricePoint[] => {
        const now = new Date();
        const data: PricePoint[] = [];
        const sources = ['Amazon', '楽天', 'iHerb', 'Yahoo!ショッピング'];

        // 過去6ヶ月のデータを生成
        for (let i = 180; i >= 0; i -= 7) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // 価格変動を模擬（±20%の範囲）
            const variation = (Math.random() - 0.5) * 0.4; // -0.2 to 0.2
            const price = Math.round(currentPrice * (1 + variation));

            data.push({
                date: date.toISOString().split('T')[0],
                price,
                source: sources[Math.floor(Math.random() * sources.length)]
            });
        }

        return data;
    };

    // データをフィルタリング
    useEffect(() => {
        const demoData = priceHistory.length > 0 ? priceHistory : generateDemoData();
        const now = new Date();
        let startDate = new Date();

        switch (selectedPeriod) {
            case '1M':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1Y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        const filtered = demoData.filter(point => new Date(point.date) >= startDate);
        setFilteredData(filtered);
    }, [selectedPeriod, priceHistory, currentPrice]);

    if (filteredData.length === 0) {
        return (
            <div className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">価格履歴</h3>
                <div className="text-center py-8 text-gray-500">
                    価格履歴データがありません
                </div>
            </div>
        );
    }

    // グラフ描画用の計算
    const prices = filteredData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const chartWidth = 400;
    const chartHeight = 200;
    const padding = 40;

    // SVGパスを生成
    const pathData = filteredData.map((point, index) => {
        const x = padding + (index / (filteredData.length - 1)) * (chartWidth - 2 * padding);
        const y = padding + ((maxPrice - point.price) / priceRange) * (chartHeight - 2 * padding);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // 価格変動の統計
    const avgPrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    const priceChange = currentPrice - filteredData[0]?.price || 0;
    const priceChangePercent = filteredData[0]?.price ?
        ((priceChange / filteredData[0].price) * 100).toFixed(1) : '0.0';

    return (
        <div className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">価格履歴</h3>
                <div className="flex gap-2">
                    {(['1M', '3M', '6M', '1Y'] as const).map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectedPeriod === period
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* 価格統計 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                    <div className="text-sm text-gray-500">現在価格</div>
                    <div className="text-lg font-bold text-gray-900">¥{currentPrice.toLocaleString()}</div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">平均価格</div>
                    <div className="text-lg font-bold text-gray-900">¥{avgPrice.toLocaleString()}</div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">価格変動</div>
                    <div className={`text-lg font-bold ${priceChange > 0 ? 'text-red-600' : priceChange < 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                        {priceChange > 0 ? '+' : ''}¥{priceChange.toLocaleString()}
                        <span className="text-sm ml-1">
                            ({priceChange > 0 ? '+' : ''}{priceChangePercent}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* グラフ */}
            <div className="relative">
                <svg
                    width="100%"
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="border border-gray-100 rounded-lg bg-gray-50"
                >
                    {/* グリッドライン */}
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Y軸ラベル */}
                    <text x="10" y="30" className="text-xs fill-gray-500">¥{maxPrice.toLocaleString()}</text>
                    <text x="10" y={chartHeight - 10} className="text-xs fill-gray-500">¥{minPrice.toLocaleString()}</text>

                    {/* 価格ライン */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        className="drop-shadow-sm"
                    />

                    {/* データポイント */}
                    {filteredData.map((point, index) => {
                        const x = padding + (index / (filteredData.length - 1)) * (chartWidth - 2 * padding);
                        const y = padding + ((maxPrice - point.price) / priceRange) * (chartHeight - 2 * padding);

                        return (
                            <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="3"
                                fill="#3b82f6"
                                className="drop-shadow-sm"
                            >
                                <title>{`${point.date}: ¥${point.price.toLocaleString()} (${point.source})`}</title>
                            </circle>
                        );
                    })}
                </svg>
            </div>

            {/* 最安値・最高値情報 */}
            <div className="mt-4 flex justify-between text-sm text-gray-600">
                <div>
                    <span className="text-green-600 font-medium">最安値: ¥{minPrice.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-red-600 font-medium">最高値: ¥{maxPrice.toLocaleString()}</span>
                </div>
            </div>

            {/* データソース情報 */}
            <div className="mt-3 text-xs text-gray-500">
                データソース: {Array.from(new Set(filteredData.map(d => d.source))).join(', ')}
            </div>
        </div>
    );
}