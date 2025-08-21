"use client";

import React, { useCallback } from "react";
import type {
  CompareTableHeaderProps,
  SortField,
  SortDirection,
} from "./types";

export function CompareTableHeader({
  sortBy,
  sortDirection,
  onSort,
  showRemoveColumn = false,
}: CompareTableHeaderProps) {
  // Handle sort button clicks
  const handleSortClick = useCallback(
    (field: SortField) => {
      if (!onSort) return;

      let newDirection: SortDirection = "desc";

      // Toggle direction if clicking the same field
      if (sortBy === field) {
        newDirection = sortDirection === "desc" ? "asc" : "desc";
      }

      onSort(field, newDirection);
    },
    [sortBy, sortDirection, onSort],
  );

  // Handle keyboard events for sort buttons
  const handleSortKeyDown = useCallback(
    (event: React.KeyboardEvent, field: SortField) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSortClick(field);
      }
    },
    [handleSortClick],
  );

  // Get aria-sort value for a field
  const getAriaSort = useCallback(
    (field: SortField): "none" | "ascending" | "descending" => {
      if (sortBy !== field) return "none";
      return sortDirection === "desc" ? "descending" : "ascending";
    },
    [sortBy, sortDirection],
  );

  // Generate sort button label
  const getSortButtonLabel = useCallback(
    (field: SortField, displayName: string) => {
      const currentSort = getAriaSort(field);
      if (currentSort === "none") {
        return `${displayName}で並べ替え`;
      }
      const direction = currentSort === "descending" ? "降順" : "昇順";
      const nextDirection = currentSort === "descending" ? "昇順" : "降順";
      return `${displayName}（現在${direction}）、クリックで${nextDirection}に変更`;
    },
    [getAriaSort],
  );

  return (
    <thead>
      <tr>
        {/* Product name column */}
        <th
          scope="col"
          className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 text-left font-semibold min-w-[200px]"
          aria-sort={getAriaSort("name")}
        >
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            onClick={() => handleSortClick("name")}
            onKeyDown={(e) => handleSortKeyDown(e, "name")}
            aria-label={getSortButtonLabel("name", "製品名")}
          >
            製品名
            <SortIcon
              field="name"
              currentSort={sortBy}
              direction={sortDirection}
            />
          </button>
        </th>

        {/* Total score column */}
        <th
          scope="col"
          className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 text-center font-semibold min-w-[100px]"
          aria-sort={getAriaSort("score")}
        >
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            onClick={() => handleSortClick("score")}
            onKeyDown={(e) => handleSortKeyDown(e, "score")}
            aria-label={getSortButtonLabel("score", "総合スコア")}
          >
            総合スコア
            <SortIcon
              field="score"
              currentSort={sortBy}
              direction={sortDirection}
            />
          </button>
        </th>

        {/* Price column */}
        <th
          scope="col"
          className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 text-center font-semibold min-w-[120px]"
          aria-sort={getAriaSort("price")}
        >
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            onClick={() => handleSortClick("price")}
            onKeyDown={(e) => handleSortKeyDown(e, "price")}
            aria-label={getSortButtonLabel("price", "価格")}
          >
            価格
            <SortIcon
              field="price"
              currentSort={sortBy}
              direction={sortDirection}
            />
          </button>
        </th>

        {/* Warnings column */}
        <th
          scope="col"
          className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 text-center font-semibold min-w-[120px]"
          aria-sort={getAriaSort("warnings")}
        >
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            onClick={() => handleSortClick("warnings")}
            onKeyDown={(e) => handleSortKeyDown(e, "warnings")}
            aria-label={getSortButtonLabel("warnings", "警告")}
          >
            警告
            <SortIcon
              field="warnings"
              currentSort={sortBy}
              direction={sortDirection}
            />
          </button>
        </th>

        {/* Remove column */}
        {showRemoveColumn && (
          <th
            scope="col"
            className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 text-center font-semibold w-16"
          >
            <span className="sr-only">削除</span>
          </th>
        )}
      </tr>
    </thead>
  );
}

// Sort icon component
interface SortIconProps {
  field: SortField;
  currentSort?: SortField;
  direction?: SortDirection;
}

function SortIcon({ field, currentSort, direction }: SortIconProps) {
  const isActive = currentSort === field;
  const isDescending = direction === "desc";

  return (
    <span className="inline-flex flex-col" aria-hidden="true">
      <svg
        className={`w-3 h-3 ${
          isActive && !isDescending ? "text-blue-600" : "text-gray-400"
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
      <svg
        className={`w-3 h-3 -mt-1 ${
          isActive && isDescending ? "text-blue-600" : "text-gray-400"
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}
