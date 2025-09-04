"use client";

import { calculateProductCosts, formatCostPerMg, formatCostJPY } from "@/lib/cost";
import { useLocale } from "@/contexts/LocaleContext";

export interface PriceTableProps {
  product: {
    name: string;
    priceJPY: number;
    servingsPerContainer: number;
    servingsPerDay: number;
    ingredients?: Array<{ amountMgPerServing: number }>;
  };
  className?: string;
}

export function PriceTable({ product, className = "" }: PriceTableProps) {
  const { locale } = useLocale();
  const costResult = calculateProductCosts({
    priceJPY: product.priceJPY,
    servingsPerContainer: product.servingsPerContainer,
    servingsPerDay: product.servingsPerDay,
    ingredients: product.ingredients,
  });
  const effectiveCostPerDay = costResult.effectiveCostPerDay;
  const costError = !costResult.isCalculable;
  const errorMessage = costResult.error || (locale === 'ja' ? "計算エラー" : "Calculation Error");

  const continuationDays = Math.floor(
    product.servingsPerContainer / product.servingsPerDay,
  );
  const costPerServing = product.priceJPY / product.servingsPerContainer;
  const totalMgPerDay = costResult.totalMgPerDay ?? null;
  const normalizedCost = costResult.normalizedCostPerMgPerDay ?? null;

  // ラベルの国際化
  const labels = {
    ja: {
      title: "正規化価格テーブル",
      effectiveCost: "実効コスト/日",
      totalMgPerDay: "合計mg/日",
      costPerMgDay: "円/mg・日",
      continuationDays: "継続日数",
      costPerServing: "1回あたりコスト",
      item: "項目",
      value: "値",
      days: "日",
      calculationError: "計算不可",
      dataMissing: "データ不足",
    },
    en: {
      title: "Normalized Price Table",
      effectiveCost: "Effective Cost/Day",
      totalMgPerDay: "Total mg/day",
      costPerMgDay: "JPY/mg·day",
      continuationDays: "Duration Days",
      costPerServing: "Cost per Serving",
      item: "Item",
      value: "Value",
      days: "days",
      calculationError: "Cannot Calculate",
      dataMissing: "Data Missing",
    },
  };

  const t = labels[locale];

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <h2 className="text-xl font-semibold mb-4">{t.title}</h2>
      <div className="overflow-x-auto">
        <table
          className="min-w-full"
          role="table"
          aria-label={locale === 'ja' ? `${product.name}の価格情報テーブル` : `Price information table for ${product.name}`}
        >
          <caption className="sr-only">
            {locale === 'ja'
              ? `${product.name}の詳細価格情報。実効コスト、継続日数、1回あたりコストを表示。`
              : `Detailed price information for ${product.name}. Shows effective cost, duration days, and cost per serving.`
            }
          </caption>
          <thead>
            <tr className="border-b border-gray-200">
              <th
                scope="col"
                className="text-left py-3 px-4 font-medium text-gray-700"
              >
                {t.item}
              </th>
              <th
                scope="col"
                className="text-right py-3 px-4 font-medium text-gray-700"
                aria-sort="none"
              >
                {t.value}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="py-3 px-4 text-gray-600">{t.effectiveCost}</td>
              <td className="py-3 px-4 text-right font-semibold">
                {costError ? (
                  <span
                    className="text-red-500"
                    role="status"
                    aria-label={locale === 'ja' ? `計算エラー: ${errorMessage}` : `Calculation error: ${errorMessage}`}
                  >
                    {t.calculationError}
                  </span>
                ) : (
                  <span className="text-green-600" aria-label={locale === 'ja' ? `1日あたり${formatCostJPY(effectiveCostPerDay)}` : `${formatCostJPY(effectiveCostPerDay)} per day`}>
                    {formatCostJPY(effectiveCostPerDay)}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">{t.totalMgPerDay}</td>
              <td className="py-3 px-4 text-right font-semibold">
                {totalMgPerDay && totalMgPerDay > 0 ? (
                  <span aria-label={locale === 'ja' ? `1日あたり${totalMgPerDay}ミリグラム` : `${totalMgPerDay} milligrams per day`}>
                    {new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US').format(totalMgPerDay)}mg/{t.days}
                  </span>
                ) : (
                  <span className="text-gray-500">{t.dataMissing}</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">{t.costPerMgDay}</td>
              <td className="py-3 px-4 text-right font-semibold">
                {normalizedCost && normalizedCost > 0 ? (
                  <span aria-label={locale === 'ja' ? `1mgあたり${formatPriceWithLocale(normalizedCost)}` : `${formatPriceWithLocale(normalizedCost)} per mg·day`}>
                    {formatCostPerMg(normalizedCost)}
                  </span>
                ) : (
                  <span className="text-red-500" role="status" aria-label={t.calculationError}>
                    {t.calculationError}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">{t.continuationDays}</td>
              <td
                className="py-3 px-4 text-right font-semibold"
                aria-label={locale === 'ja' ? `${continuationDays}日間継続可能` : `${continuationDays} days duration`}
              >
                {continuationDays}{t.days}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600">{t.costPerServing}</td>
              <td className="py-3 px-4 text-right font-semibold" aria-label={locale === 'ja' ? `1回あたり${formatCostJPY(costPerServing)}` : `${formatCostJPY(costPerServing)} per serving`}>
                {formatCostJPY(costPerServing)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
