"use client";

import React, { useCallback, useRef, useEffect } from "react";
import type { SortField, SortDirection, SortConfig } from "./types";

export interface CompareControlsProps {
  currentSort: SortConfig;
  onSort: (field: SortField, direction: SortDirection) => void;
  className?: string;
}

export function CompareControls({
  currentSort,
  onSort,
  className = "",
}: CompareControlsProps) {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Handle sort button clicks
  const handleSortClick = useCallback(
    (field: SortField) => {
      let newDirection: SortDirection;

      // Toggle direction if clicking the same field
      if (currentSort.field === field) {
        newDirection = currentSort.direction === "desc" ? "asc" : "desc";
      } else {
        // Use appropriate default direction for new field
        newDirection = field === "score" ? "desc" : "asc";
      }

      onSort(field, newDirection);

      // Announce sort change to screen readers
      const fieldName = {
        score: "スコア",
        price: "価格",
        name: "名前",
        warnings: "警告",
      }[field];

      const directionName = newDirection === "desc" ? "降順" : "昇順";
      const announcement = `テーブルが${fieldName}の${directionName}で並べ替えられました`;

      // Update live region for screen reader announcement
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = announcement;
      }
    },
    [currentSort, onSort],
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

  // Generate sort button label with current state
  const getSortButtonLabel = useCallback(
    (field: SortField) => {
      const fieldName = {
        score: "スコア",
        price: "価格",
        name: "名前",
        warnings: "警告",
      }[field];

      if (currentSort.field !== field) {
        return `${fieldName}で並べ替え`;
      }

      const currentDirection =
        currentSort.direction === "desc" ? "降順" : "昇順";
      const nextDirection = currentSort.direction === "desc" ? "昇順" : "降順";
      return `${fieldName}（現在${currentDirection}）、クリックで${nextDirection}に変更`;
    },
    [currentSort],
  );

  // Get visual indicator for current sort state
  const getSortIndicator = useCallback(
    (field: SortField) => {
      if (currentSort.field !== field) {
        return null;
      }

      return currentSort.direction === "desc" ? "↓" : "↑";
    },
    [currentSort],
  );

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      <span className="text-sm font-medium text-gray-700">並べ替え:</span>

      {/* Score sort button */}
      <button
        type="button"
        className={`
          px-3 py-2 text-sm font-medium rounded-md border transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${
            currentSort.field === "score"
              ? "bg-blue-100 border-blue-300 text-blue-800"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        `}
        onClick={() => handleSortClick("score")}
        onKeyDown={(e) => handleSortKeyDown(e, "score")}
        aria-label={getSortButtonLabel("score")}
        aria-pressed={currentSort.field === "score"}
      >
        スコア {getSortIndicator("score")}
      </button>

      {/* Price sort button */}
      <button
        type="button"
        className={`
          px-3 py-2 text-sm font-medium rounded-md border transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${
            currentSort.field === "price"
              ? "bg-blue-100 border-blue-300 text-blue-800"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        `}
        onClick={() => handleSortClick("price")}
        onKeyDown={(e) => handleSortKeyDown(e, "price")}
        aria-label={getSortButtonLabel("price")}
        aria-pressed={currentSort.field === "price"}
      >
        価格 {getSortIndicator("price")}
      </button>

      {/* Name sort button */}
      <button
        type="button"
        className={`
          px-3 py-2 text-sm font-medium rounded-md border transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${
            currentSort.field === "name"
              ? "bg-blue-100 border-blue-300 text-blue-800"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        `}
        onClick={() => handleSortClick("name")}
        onKeyDown={(e) => handleSortKeyDown(e, "name")}
        aria-label={getSortButtonLabel("name")}
        aria-pressed={currentSort.field === "name"}
      >
        名前 {getSortIndicator("name")}
      </button>

      {/* Warnings sort button */}
      <button
        type="button"
        className={`
          px-3 py-2 text-sm font-medium rounded-md border transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${
            currentSort.field === "warnings"
              ? "bg-blue-100 border-blue-300 text-blue-800"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        `}
        onClick={() => handleSortClick("warnings")}
        onKeyDown={(e) => handleSortKeyDown(e, "warnings")}
        aria-label={getSortButtonLabel("warnings")}
        aria-pressed={currentSort.field === "warnings"}
      >
        警告 {getSortIndicator("warnings")}
      </button>

      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
    </div>
  );
}
