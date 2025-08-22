"use client";

import React, { memo } from "react";
import { WarningHighlight } from "./WarningHighlight";
import { LazyProductImage } from "./LazyProductImage";
import type { CompareTableRowProps } from "./types";

const CompareTableRowComponent = ({
  product,
  index,
  warningAnalysis,
  onProductRemove,
}: CompareTableRowProps) => {
  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format score for display
  const formatScore = (score: number): string => {
    return score.toFixed(1);
  };

  // Count warnings by severity
  const getWarningCounts = () => {
    const critical = product.warnings.filter(
      (w) => w.type === "critical",
    ).length;
    const warning = product.warnings.filter((w) => w.type === "warning").length;
    const info = product.warnings.filter((w) => w.type === "info").length;

    return { critical, warning, info, total: product.warnings.length };
  };

  // Generate warning display text
  const getWarningDisplay = () => {
    const counts = getWarningCounts();

    if (counts.total === 0) {
      return "警告なし";
    }

    const parts: string[] = [];
    if (counts.critical > 0) parts.push(`重要: ${counts.critical}`);
    if (counts.warning > 0) parts.push(`警告: ${counts.warning}`);
    if (counts.info > 0) parts.push(`情報: ${counts.info}`);

    return parts.join(", ");
  };

  // Generate accessible description for the row
  const getRowDescription = () => {
    const warningCounts = getWarningCounts();
    const scoreText = `総合スコア${formatScore(product.totalScore)}点`;
    const priceText = `価格${formatPrice(product.price)}`;
    const warningText =
      warningCounts.total > 0 ? `警告${warningCounts.total}件` : "警告なし";

    return `${product.name}、${scoreText}、${priceText}、${warningText}`;
  };

  const warningCounts = getWarningCounts();

  return (
    <tr
      className="hover:bg-gray-50 focus-within:bg-gray-50"
      aria-describedby={`product-${product.id}-description`}
    >
      {/* Product name cell with scope="row" */}
      <th
        scope="row"
        className="border border-gray-300 px-2 sm:px-4 py-3 text-left font-medium"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {product.imageUrl && (
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <LazyProductImage
                src={product.imageUrl}
                alt={`${product.name}の製品画像`}
                productName={product.name}
                className="w-full h-full rounded"
                priority={index === 0} // First product gets priority loading
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
              {product.name}
            </div>
            {product.url && (
              <a
                href={product.url}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                詳細を見る
              </a>
            )}
          </div>
        </div>

        {/* Hidden description for screen readers */}
        <div id={`product-${product.id}-description`} className="sr-only">
          {getRowDescription()}
        </div>
      </th>

      {/* Total score cell */}
      <td
        className="border border-gray-300 px-2 sm:px-4 py-3 text-center"
        tabIndex={0}
      >
        <div className="text-base sm:text-lg font-semibold text-gray-900">
          {formatScore(product.totalScore)}
        </div>
        <div className="text-sm text-gray-500">/ 100点</div>
      </td>

      {/* Price cell */}
      <td
        className="border border-gray-300 px-2 sm:px-4 py-3 text-center"
        tabIndex={0}
      >
        <div className="text-base sm:text-lg font-semibold text-gray-900">
          {formatPrice(product.price)}
        </div>
      </td>

      {/* Warnings cell */}
      <td className="border border-gray-300 px-2 sm:px-4 py-3" tabIndex={0}>
        <WarningHighlight
          warnings={product.warnings}
          productId={product.id}
          productName={product.name}
          showCount={true}
          showMostImportant={true}
          compact={true}
        />
      </td>

      {/* Remove button cell */}
      {onProductRemove && (
        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
          <button
            onClick={() => onProductRemove(product.id)}
            className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label={`${product.name}を比較から削除`}
            title={`${product.name}を削除`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </td>
      )}
    </tr>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const CompareTableRow = memo(
  CompareTableRowComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.totalScore === nextProps.product.totalScore &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.warnings.length === nextProps.product.warnings.length &&
      prevProps.index === nextProps.index
    );
  },
);
