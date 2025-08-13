"use client";

import { calculateEffectiveCostPerDay, formatCostJPY } from "@/lib/cost";

export interface PriceTableProps {
  product: {
    name: string;
    priceJPY: number;
    servingsPerContainer: number;
    servingsPerDay: number;
  };
  className?: string;
}

export function PriceTable({ product, className = "" }: PriceTableProps) {
  let effectiveCostPerDay = 0;
  let costError = false;
  let errorMessage = "";

  try {
    effectiveCostPerDay = calculateEffectiveCostPerDay({
      priceJPY: product.priceJPY,
      servingsPerContainer: product.servingsPerContainer,
      servingsPerDay: product.servingsPerDay,
    });
  } catch (error) {
    costError = true;
    errorMessage = error instanceof Error ? error.message : "計算エラー";
  }

  const continuationDays = Math.floor(
    product.servingsPerContainer / product.servingsPerDay,
  );
  const costPerServing = product.priceJPY / product.servingsPerContainer;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <h2 className="text-xl font-semibold mb-4">正規化価格テーブル</h2>
      <div className="overflow-x-auto">
        <table
          className="min-w-full"
          role="table"
          aria-label={`${product.name}の価格情報テーブル`}
        >
          <caption className="sr-only">
            {product.name}
            の詳細価格情報。実効コスト、継続日数、1回あたりコストを表示。
          </caption>
          <thead>
            <tr className="border-b border-gray-200">
              <th
                scope="col"
                className="text-left py-3 px-4 font-medium text-gray-700"
              >
                項目
              </th>
              <th
                scope="col"
                className="text-right py-3 px-4 font-medium text-gray-700"
                aria-sort="none"
              >
                値
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="py-3 px-4 text-gray-600">実効コスト/日</td>
              <td className="py-3 px-4 text-right font-semibold">
                {costError ? (
                  <span
                    className="text-red-500"
                    role="status"
                    aria-label={`計算エラー: ${errorMessage}`}
                  >
                    計算不可
                  </span>
                ) : (
                  <span
                    className="text-green-600"
                    aria-label={`1日あたり${effectiveCostPerDay}円`}
                  >
                    {formatCostJPY(effectiveCostPerDay)}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">継続日数</td>
              <td
                className="py-3 px-4 text-right font-semibold"
                aria-label={`${continuationDays}日間継続可能`}
              >
                {continuationDays}日
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">1回あたりコスト</td>
              <td
                className="py-3 px-4 text-right font-semibold"
                aria-label={`1回あたり${costPerServing}円`}
              >
                {formatCostJPY(costPerServing)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
