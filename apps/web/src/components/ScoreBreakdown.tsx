"use client";

import { useState, memo, useCallback, useMemo } from "react";
import type {
  ScoreResult,
  ScoreBreakdown as ScoreBreakdownType,
} from "@/lib/scoring";

interface Props {
  breakdown: ScoreResult["breakdown"];
  weights: ScoreResult["weights"];
  className?: string;
  isLoading?: boolean;
}

interface ComponentBreakdownProps {
  name: string;
  breakdown: ScoreBreakdownType;
  weight: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const ComponentBreakdown = memo<ComponentBreakdownProps>(
  ({ name, breakdown, weight, isExpanded, onToggle }) => {
    const weightPercentage = useMemo(() => Math.round(weight * 100), [weight]);
    const progressPercentage = useMemo(
      () => Math.max(0, Math.min(100, breakdown.score)),
      [breakdown.score],
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      },
      [onToggle],
    );

    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          className="w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={`breakdown-${name}`}
          aria-describedby={`breakdown-${name}-description`}
          type="button"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">
              {name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                (重み: {weightPercentage}%)
              </span>
            </h4>
            <div className="flex items-center space-x-3">
              <span
                className="text-2xl font-bold text-gray-900"
                aria-label={`${name}スコア ${breakdown.score}点`}
              >
                {breakdown.score}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="h-3 w-full rounded-full bg-gray-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={breakdown.score}
            aria-label={`${name}スコア ${breakdown.score}点、100点満点中`}
          >
            <div
              className="h-3 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p
            id={`breakdown-${name}-description`}
            className="mt-2 text-sm text-gray-600"
          >
            {breakdown.explanation}
          </p>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div
            id={`breakdown-${name}`}
            className="px-4 pb-4 border-t border-gray-100"
            role="region"
            aria-labelledby={`breakdown-${name}-heading`}
          >
            <h5
              id={`breakdown-${name}-heading`}
              className="text-sm font-medium text-gray-900 mb-3 mt-3"
            >
              詳細要因
            </h5>

            <div className="space-y-3">
              {breakdown.factors.map((factor, index) => {
                const factorPercentage = Math.max(
                  0,
                  Math.min(100, factor.value),
                );
                const contributionPercentage = Math.round(factor.weight * 100);

                return (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-md p-3"
                    role="group"
                    aria-labelledby={`factor-${name}-${index}-label`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        id={`factor-${name}-${index}-label`}
                        className="text-sm font-medium text-gray-700"
                      >
                        {factor.name}
                        <span className="text-gray-500 ml-1">
                          (寄与度: {contributionPercentage}%)
                        </span>
                      </span>
                      <span
                        className="text-sm font-semibold text-gray-900"
                        aria-label={`${factor.name}の値 ${factor.value}点`}
                      >
                        {factor.value}
                      </span>
                    </div>

                    <div
                      className="h-2 w-full rounded-full bg-gray-200"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={factor.value}
                      aria-labelledby={`factor-${name}-${index}-label`}
                    >
                      <div
                        className="h-2 rounded-full bg-blue-400 transition-all duration-300"
                        style={{ width: `${factorPercentage}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-600">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  },
);

ComponentBreakdown.displayName = "ComponentBreakdown";

// Loading skeleton for ScoreBreakdown
const ScoreBreakdownSkeleton = memo(() => (
  <section aria-label="スコア詳細内訳読み込み中" className="" role="region">
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded-full w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  </section>
));

ScoreBreakdownSkeleton.displayName = "ScoreBreakdownSkeleton";

export const ScoreBreakdown = memo<Props>(
  ({ breakdown, weights, className = "", isLoading = false }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
      new Set(),
    );

    const toggleSection = useCallback((sectionName: string) => {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(sectionName)) {
          newSet.delete(sectionName);
        } else {
          newSet.add(sectionName);
        }
        return newSet;
      });
    }, []);

    const toggleAllSections = useCallback(() => {
      if (expandedSections.size === 4) {
        // All 4 components
        setExpandedSections(new Set());
      } else {
        setExpandedSections(
          new Set(["evidence", "safety", "cost", "practicality"]),
        );
      }
    }, [expandedSections.size]);

    const components = useMemo(
      () => [
        {
          key: "evidence",
          name: "エビデンス",
          breakdown: breakdown.evidence,
          weight: weights.evidence,
        },
        {
          key: "safety",
          name: "安全性",
          breakdown: breakdown.safety,
          weight: weights.safety,
        },
        {
          key: "cost",
          name: "コスト",
          breakdown: breakdown.cost,
          weight: weights.cost,
        },
        {
          key: "practicality",
          name: "実用性",
          breakdown: breakdown.practicality,
          weight: weights.practicality,
        },
      ],
      [breakdown, weights],
    );

    // Show loading skeleton
    if (isLoading) {
      return <ScoreBreakdownSkeleton />;
    }

    return (
      <section aria-label="スコア詳細内訳" className={className} role="region">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              スコア詳細内訳
            </h3>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline transition-colors duration-200"
              onClick={toggleAllSections}
              type="button"
              aria-label={
                expandedSections.size === components.length
                  ? "すべてのセクションを閉じる"
                  : "すべてのセクションを開く"
              }
            >
              {expandedSections.size === components.length
                ? "すべて閉じる"
                : "すべて開く"}
            </button>
          </div>

          <div className="space-y-4">
            {components.map((component) => (
              <ComponentBreakdown
                key={component.key}
                name={component.name}
                breakdown={component.breakdown}
                weight={component.weight}
                isExpanded={expandedSections.has(component.key)}
                onToggle={() => toggleSection(component.key)}
              />
            ))}
          </div>

          {/* Weight summary */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-3">重み配分</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {components.map((component) => (
                <div
                  key={`weight-${component.key}`}
                  className="bg-gray-50 rounded-md p-3"
                  role="group"
                  aria-label={`${component.name}の重み配分`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {component.name}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(component.weight * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  },
);

ScoreBreakdown.displayName = "ScoreBreakdown";
