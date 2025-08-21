"use client";

import React, { memo } from "react";
import type { ScoreSummaryRowProps } from "./types";

const ScoreSummaryRowComponent = ({
  summary,
  products,
  highlightBest = true,
  highlightWorst = false,
}: ScoreSummaryRowProps) => {
  // Format score for display
  const formatScore = (score: number): string => {
    return score.toFixed(1);
  };

  // Find best and worst performing products for this category
  const getBestProduct = () => {
    return summary.products.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
  };

  const getWorstProduct = () => {
    return summary.products.reduce((worst, current) =>
      current.score < worst.score ? current : worst,
    );
  };

  // Get product name by ID
  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown";
  };

  // Generate accessible description for the summary row
  const getSummaryDescription = () => {
    const bestProduct = getBestProduct();
    const worstProduct = getWorstProduct();

    return (
      `${summary.category}カテゴリのスコア要約: ` +
      `最高${formatScore(summary.maxScore)}点（${getProductName(bestProduct.productId)}）、` +
      `最低${formatScore(summary.minScore)}点（${getProductName(worstProduct.productId)}）、` +
      `平均${formatScore(summary.averageScore)}点`
    );
  };

  const bestProduct = getBestProduct();
  const worstProduct = getWorstProduct();

  return (
    <tr
      className="bg-blue-50 border-t-2 border-blue-200"
      role="row"
      aria-describedby={`summary-${summary.category}-description`}
    >
      {/* Category name cell */}
      <th
        scope="row"
        className="border border-gray-300 px-4 py-2 text-left font-medium text-blue-900 bg-blue-100"
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span>{summary.category} 要約</span>
        </div>

        {/* Hidden description for screen readers */}
        <div id={`summary-${summary.category}-description`} className="sr-only">
          {getSummaryDescription()}
        </div>
      </th>

      {/* Score statistics cell */}
      <td
        className="border border-gray-300 px-4 py-2 text-center bg-blue-50"
        tabIndex={0}
      >
        <div className="space-y-1">
          <div className="text-sm font-medium text-blue-900">
            平均: {formatScore(summary.averageScore)}
          </div>
          <div className="text-xs text-blue-700 space-y-0.5">
            <div>最高: {formatScore(summary.maxScore)}</div>
            <div>最低: {formatScore(summary.minScore)}</div>
          </div>
        </div>
      </td>

      {/* Best performer cell */}
      <td
        className="border border-gray-300 px-4 py-2 text-center bg-blue-50"
        tabIndex={0}
      >
        {highlightBest && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-green-700">
              🏆 最高スコア
            </div>
            <div className="text-xs text-green-600">
              {getProductName(bestProduct.productId)}
            </div>
            <div className="text-xs font-medium text-green-700">
              {formatScore(bestProduct.score)}点
            </div>
          </div>
        )}
      </td>

      {/* Worst performer cell (if highlighting worst) */}
      <td
        className="border border-gray-300 px-4 py-2 text-center bg-blue-50"
        tabIndex={0}
      >
        {highlightWorst && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-red-700">
              ⚠ 最低スコア
            </div>
            <div className="text-xs text-red-600">
              {getProductName(worstProduct.productId)}
            </div>
            <div className="text-xs font-medium text-red-700">
              {formatScore(worstProduct.score)}点
            </div>
          </div>
        )}

        {!highlightWorst && (
          <div className="text-sm text-blue-700">
            範囲: {formatScore(summary.maxScore - summary.minScore)}点
          </div>
        )}
      </td>
    </tr>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ScoreSummaryRow = memo(
  ScoreSummaryRowComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.summary.category === nextProps.summary.category &&
      prevProps.summary.maxScore === nextProps.summary.maxScore &&
      prevProps.summary.minScore === nextProps.summary.minScore &&
      prevProps.summary.averageScore === nextProps.summary.averageScore &&
      prevProps.highlightBest === nextProps.highlightBest &&
      prevProps.highlightWorst === nextProps.highlightWorst &&
      prevProps.products.length === nextProps.products.length
    );
  },
);
