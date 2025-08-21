"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  memo,
} from "react";
import { CompareTableHeader } from "./CompareTableHeader";
import { CompareTableRow } from "./CompareTableRow";
import { ScoreSummaryRow } from "./ScoreSummaryRow";
import { WarningComparisonSummary } from "./WarningHighlight";
import { CompareControls } from "./CompareControls";
import { analyzeProductWarnings } from "@/lib/compare/warning-analyzer";
import { sortProducts } from "@/lib/compare/sort-utils";
import { calculateScoreSummariesOptimized } from "@/lib/compare/score-calculator";
import type {
  ProductCompareTableProps,
  SortField,
  SortDirection,
  ScoreSummary,
} from "./types";

const ProductCompareTableComponent = ({
  products,
  sortBy = "score",
  sortDirection = "desc",
  onSort,
  maxProducts = 3,
  onProductRemove,
}: ProductCompareTableProps) => {
  const [currentSort, setCurrentSort] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: sortBy,
    direction: sortDirection,
  });

  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // Generate table caption describing the comparison
  const generateTableCaption = useCallback(() => {
    const productCount = products.length;
    if (productCount === 0) {
      return "製品比較テーブル（比較対象なし）";
    }

    const sortDescription =
      currentSort.field === "score"
        ? `スコア${currentSort.direction === "desc" ? "降順" : "昇順"}`
        : currentSort.field === "price"
          ? `価格${currentSort.direction === "desc" ? "降順" : "昇順"}`
          : "名前順";

    return `${productCount}製品の比較テーブル（${sortDescription}で並べ替え済み）`;
  }, [products.length, currentSort]);

  // Handle sort changes
  const handleSort = useCallback(
    (field: SortField, direction: SortDirection) => {
      setCurrentSort({ field, direction });
      onSort?.(field, direction);
    },
    [onSort],
  );

  // Sort products based on current sort configuration
  const sortedProducts = useMemo(() => {
    return sortProducts(products, currentSort);
  }, [products, currentSort]);

  // Calculate score summaries using optimized algorithm
  const scoreSummaries = useMemo(() => {
    return calculateScoreSummariesOptimized(sortedProducts);
  }, [sortedProducts]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!tableRef.current) return;

      const rows = tableRef.current.querySelectorAll("tr");
      const currentRow = focusedCell?.row ?? 0;
      const currentCol = focusedCell?.col ?? 0;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (currentRow < rows.length - 1) {
            setFocusedCell({ row: currentRow + 1, col: currentCol });
          }
          break;

        case "ArrowUp":
          event.preventDefault();
          if (currentRow > 0) {
            setFocusedCell({ row: currentRow - 1, col: currentCol });
          }
          break;

        case "ArrowRight":
          event.preventDefault();
          const currentRowCells = rows[currentRow]?.querySelectorAll("th, td");
          if (currentRowCells && currentCol < currentRowCells.length - 1) {
            setFocusedCell({ row: currentRow, col: currentCol + 1 });
          }
          break;

        case "ArrowLeft":
          event.preventDefault();
          if (currentCol > 0) {
            setFocusedCell({ row: currentRow, col: currentCol - 1 });
          }
          break;

        case "Home":
          event.preventDefault();
          setFocusedCell({ row: currentRow, col: 0 });
          break;

        case "End":
          event.preventDefault();
          const rowCells = rows[currentRow]?.querySelectorAll("th, td");
          if (rowCells) {
            setFocusedCell({ row: currentRow, col: rowCells.length - 1 });
          }
          break;
      }
    },
    [focusedCell],
  );

  // Focus management effect
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr");
      const targetRow = rows[focusedCell.row];
      const cells = targetRow?.querySelectorAll("th, td");
      const targetCell = cells?.[focusedCell.col] as HTMLElement;

      if (targetCell) {
        targetCell.focus();
      }
    }
  }, [focusedCell]);

  // Analyze warnings across all products
  const warningAnalysis = useMemo(() => {
    return analyzeProductWarnings(sortedProducts);
  }, [sortedProducts]);

  // Show empty state if no products
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">比較する製品を選択してください</p>
        <p className="text-gray-400 text-sm mt-2">
          最大{maxProducts}製品まで比較できます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <CompareControls
        currentSort={currentSort}
        onSort={handleSort}
        className="mb-4"
      />

      {/* Warning Summary */}
      {warningAnalysis.totalWarnings > 0 && (
        <WarningComparisonSummary
          warningAnalysis={warningAnalysis}
          className="mb-4"
        />
      )}

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table
          ref={tableRef}
          className="w-full min-w-[640px] border-collapse border border-gray-300"
          onKeyDown={handleKeyDown}
          role="table"
          aria-label="製品比較テーブル"
        >
          <caption className="text-lg font-semibold mb-4 text-left">
            {generateTableCaption()}
          </caption>

          <CompareTableHeader
            sortBy={currentSort.field}
            sortDirection={currentSort.direction}
            onSort={handleSort}
            showRemoveColumn={!!onProductRemove}
          />

          <tbody>
            {sortedProducts.map((product, index) => (
              <CompareTableRow
                key={product.id}
                product={product}
                index={index}
                warningAnalysis={warningAnalysis}
                onProductRemove={onProductRemove}
              />
            ))}

            {scoreSummaries.map((summary) => (
              <ScoreSummaryRow
                key={summary.category}
                summary={summary}
                products={sortedProducts}
                highlightBest={true}
                highlightWorst={false}
              />
            ))}
          </tbody>
        </table>

        {/* Screen reader only instructions */}
        <div className="sr-only">
          <p>
            テーブルナビゲーション:
            矢印キーでセル間を移動、Tabキーで次の要素へ移動できます。
            並べ替えボタンはEnターキーまたはSpaceキーで操作できます。
          </p>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ProductCompareTable = memo(
  ProductCompareTableComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.products.length === nextProps.products.length &&
      prevProps.products.every(
        (product, index) =>
          product.id === nextProps.products[index]?.id &&
          product.totalScore === nextProps.products[index]?.totalScore &&
          product.price === nextProps.products[index]?.price &&
          product.warnings.length ===
            nextProps.products[index]?.warnings.length,
      ) &&
      prevProps.sortBy === nextProps.sortBy &&
      prevProps.sortDirection === nextProps.sortDirection &&
      prevProps.maxProducts === nextProps.maxProducts
    );
  },
);
