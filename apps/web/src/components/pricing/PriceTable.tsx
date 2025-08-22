/**
 * Enhanced Price Table Component
 * 複数ソースからの価格情報を統合表示
 */

"use client";

import React, { useMemo, useState, useCallback } from "react";
import type { NormalizedPrice } from "@/lib/pricing/price-normalizer";
import type { CostPerDay } from "@/lib/pricing/cost-calculator";
import { CostPerDayBadge } from "./CostPerDayBadge";
import { LowestPriceBadge } from "./LowestPriceBadge";
import { PriceSourceLink } from "./PriceSourceLink";

export interface PriceTableProps {
  prices: NormalizedPrice[];
  costs: CostPerDay[];
  productName: string;
  className?: string;
  showConfidence?: boolean;
  sortBy?: "totalPrice" | "costPerDay" | "source";
  sortOrder?: "asc" | "desc";
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  maxRows?: number;
  showSourceDetails?: boolean;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  className = "",
}) => {
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  const handleClick = useCallback(() => {
    onSort?.(sortKey, nextOrder);
  }, [onSort, sortKey, nextOrder]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <th
      scope="col"
      className={`text-left py-3 px-4 font-medium text-gray-700 ${onSort ? "cursor-pointer hover:bg-gray-50" : ""} ${className}`}
      onClick={onSort ? handleClick : undefined}
      onKeyDown={onSort ? handleKeyDown : undefined}
      tabIndex={onSort ? 0 : undefined}
      role={onSort ? "button" : undefined}
      aria-sort={
        isActive
          ? currentOrder === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      aria-label={`${label}で並べ替え${isActive ? `（現在：${currentOrder === "asc" ? "昇順" : "降順"}）` : ""}`}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {onSort && (
          <span className="text-gray-400" aria-hidden="true">
            {isActive ? (currentOrder === "asc" ? "↑" : "↓") : "↕"}
          </span>
        )}
      </div>
    </th>
  );
};

const getSourceDisplayName = (source: string): string => {
  switch (source) {
    case "rakuten":
      return "楽天市場";
    case "yahoo":
      return "Yahoo!ショッピング";
    case "amazon":
      return "Amazon";
    case "iherb":
      return "iHerb";
    default:
      return source;
  }
};

const getSourceColor = (source: string): string => {
  switch (source) {
    case "rakuten":
      return "bg-red-100 text-red-800 border-red-200";
    case "yahoo":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "amazon":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "iherb":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "不明";
  }
};

export const PriceTable: React.FC<PriceTableProps> = ({
  prices,
  costs,
  productName,
  className = "",
  showConfidence = true,
  sortBy = "costPerDay",
  sortOrder = "asc",
  onSort,
  maxRows,
  showSourceDetails = true,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Combine price and cost data
  const combinedData = useMemo(() => {
    const data = prices
      .map((price) => {
        const cost = costs.find(
          (c) =>
            c.source === price.source &&
            c.sourceProductId === price.sourceProductId,
        );
        return { price, cost };
      })
      .filter((item) => item.cost); // Only include items with cost data

    // Sort data
    const sortedData = [...data].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "totalPrice":
          aValue = a.price.totalPrice;
          bValue = b.price.totalPrice;
          break;
        case "costPerDay":
          aValue = a.cost?.costPerDay || 0;
          bValue = b.cost?.costPerDay || 0;
          break;
        case "source":
          aValue = getSourceDisplayName(a.price.source);
          bValue = getSourceDisplayName(b.price.source);
          break;
        default:
          aValue = a.cost?.costPerDay || 0;
          bValue = b.cost?.costPerDay || 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numA = Number(aValue);
      const numB = Number(bValue);
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    return maxRows ? sortedData.slice(0, maxRows) : sortedData;
  }, [prices, costs, sortBy, sortOrder, maxRows]);

  // Find lowest cost for highlighting
  const lowestCost = useMemo(() => {
    const validCosts = costs.filter((c) => c.costPerDay > 0);
    return validCosts.length > 0
      ? Math.min(...validCosts.map((c) => c.costPerDay))
      : 0;
  }, [costs]);

  const toggleRowExpansion = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  if (combinedData.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <h2 className="text-xl font-semibold mb-4">価格情報</h2>
        <div className="text-center py-8 text-gray-500">
          <p>価格情報が見つかりませんでした</p>
          <p className="text-sm mt-2">しばらく時間をおいて再度お試しください</p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      role="region"
      aria-label={`${productName}の価格比較表`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">価格比較</h2>
        <div className="text-sm text-gray-500">
          {combinedData.length}件の価格情報
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="min-w-full"
          role="table"
          aria-label={`${productName}の価格比較テーブル`}
        >
          <caption className="sr-only">
            {productName}
            の価格比較情報。ソース、価格、実効コスト/日、取得時刻を表示。
            実効コスト/日で並べ替え可能。
          </caption>

          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <SortableHeader
                label="ソース"
                sortKey="source"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="価格"
                sortKey="totalPrice"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
                className="text-right"
              />
              <SortableHeader
                label="実効コスト/日"
                sortKey="costPerDay"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
                className="text-right"
              />
              <th
                scope="col"
                className="text-right py-3 px-4 font-medium text-gray-700"
              >
                取得時刻
              </th>
              {showSourceDetails && (
                <th
                  scope="col"
                  className="text-center py-3 px-4 font-medium text-gray-700"
                >
                  詳細
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {combinedData.map(({ price, cost }, index) => {
              const rowId = `${price.source}-${price.sourceProductId}`;
              const isExpanded = expandedRows.has(rowId);
              const isLowestCost =
                cost && Math.abs(cost.costPerDay - lowestCost) < 0.01;

              return (
                <React.Fragment key={rowId}>
                  <tr
                    className={`hover:bg-gray-50 ${isLowestCost ? "bg-green-50" : ""}`}
                  >
                    {/* Source */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(price.source)}`}
                          aria-label={`ソース: ${getSourceDisplayName(price.source)}`}
                        >
                          {getSourceDisplayName(price.source)}
                        </span>
                        {!price.inStock && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                            aria-label="在庫切れ"
                          >
                            在庫切れ
                          </span>
                        )}
                        {price.isSubscription && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            aria-label="定期便対応"
                          >
                            定期便
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {formatPrice(price.totalPrice)}
                        </div>
                        {price.shippingCost > 0 && (
                          <div className="text-xs text-gray-500">
                            送料: {formatPrice(price.shippingCost)}
                          </div>
                        )}
                        {price.isSubscription && price.subscriptionDiscount && (
                          <div className="text-xs text-green-600">
                            定期便{" "}
                            {Math.round(price.subscriptionDiscount * 100)}%オフ
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cost per day */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {cost && (
                          <CostPerDayBadge
                            cost={cost.costPerDay}
                            isLowest={isLowestCost}
                            currency="JPY"
                          />
                        )}
                        {isLowestCost && <LowestPriceBadge />}
                      </div>
                    </td>

                    {/* Last updated */}
                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                      {formatDate(price.lastUpdated)}
                    </td>

                    {/* Details toggle */}
                    {showSourceDetails && (
                      <td className="py-3 px-4 text-center">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                          onClick={() => toggleRowExpansion(rowId)}
                          aria-expanded={isExpanded}
                          aria-controls={`details-${rowId}`}
                          aria-label={`${getSourceDisplayName(price.source)}の詳細を${isExpanded ? "閉じる" : "表示"}`}
                        >
                          {isExpanded ? "閉じる" : "詳細"}
                        </button>
                      </td>
                    )}
                  </tr>

                  {/* Expanded details */}
                  {showSourceDetails && isExpanded && (
                    <tr>
                      <td colSpan={5} className="py-4 px-4 bg-gray-50">
                        <div
                          id={`details-${rowId}`}
                          className="space-y-4"
                          role="region"
                          aria-label={`${getSourceDisplayName(price.source)}の詳細情報`}
                        >
                          {/* Cost breakdown */}
                          {cost && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded border">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">
                                  コスト詳細
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>1回分コスト:</span>
                                    <span>
                                      {formatPrice(cost.costPerServing)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>継続日数:</span>
                                    <span>{cost.daysPerContainer}日</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>1日摂取回数:</span>
                                    <span>{cost.recommendedDailyIntake}回</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded border">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">
                                  価格詳細
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>商品価格:</span>
                                    <span>{formatPrice(price.basePrice)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>送料:</span>
                                    <span>
                                      {price.shippingCost > 0
                                        ? formatPrice(price.shippingCost)
                                        : "無料"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-medium">
                                    <span>合計:</span>
                                    <span>{formatPrice(price.totalPrice)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded border">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">
                                  ショップ情報
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      ショップ名:
                                    </span>
                                    <div className="font-medium">
                                      {price.shopName}
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <PriceSourceLink
                                      url={price.sourceUrl}
                                      source={price.source}
                                      productName={productName}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            最安値: {lowestCost > 0 ? formatPrice(lowestCost) : "計算中"}/日
          </div>
          <div>
            最終更新:{" "}
            {combinedData.length > 0
              ? formatDate(combinedData[0].price.lastUpdated)
              : "不明"}
          </div>
        </div>
      </div>

      {/* Accessibility summary */}
      <div className="sr-only" aria-live="polite">
        {combinedData.length}件の価格情報を表示中。 最安値は1日あたり
        {lowestCost > 0 ? formatPrice(lowestCost) : "計算中"}です。
      </div>
    </section>
  );
};
