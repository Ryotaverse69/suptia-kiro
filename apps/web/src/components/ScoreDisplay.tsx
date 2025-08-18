"use client";

import { useMemo, memo } from "react";
import type { ScoreResult } from "@/lib/scoring";

interface Props {
  scoreResult: ScoreResult;
  showBreakdown?: boolean;
  className?: string;
  isLoading?: boolean;
}

// Color scheme for score ranges
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-100"; // excellent
  if (score >= 60) return "text-blue-600 bg-blue-100"; // good
  if (score >= 40) return "text-yellow-600 bg-yellow-100"; // fair
  return "text-red-600 bg-red-100"; // poor
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "優秀";
  if (score >= 60) return "良好";
  if (score >= 40) return "普通";
  return "要改善";
};

const getProgressBarColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

// Loading skeleton component
const ScoreDisplaySkeleton = memo(() => (
  <section aria-label="製品総合スコア読み込み中" className="mb-6" role="region">
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>

      <div className="text-center mb-6">
        <div className="h-16 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded-full w-full max-w-md mx-auto"></div>
      </div>

      <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
    </div>
  </section>
));

ScoreDisplaySkeleton.displayName = "ScoreDisplaySkeleton";

export const ScoreDisplay = memo<Props>(
  ({
    scoreResult,
    showBreakdown = false,
    className = "",
    isLoading = false,
  }) => {
    const scoreLabel = useMemo(
      () => getScoreLabel(scoreResult.total),
      [scoreResult.total],
    );
    const scoreColor = useMemo(
      () => getScoreColor(scoreResult.total),
      [scoreResult.total],
    );
    const progressColor = useMemo(
      () => getProgressBarColor(scoreResult.total),
      [scoreResult.total],
    );

    // Component breakdown data memoized for performance
    const componentData = useMemo(
      () => [
        {
          key: "evidence",
          label: "エビデンス",
          value: scoreResult.components.evidence,
          weight: scoreResult.weights.evidence,
        },
        {
          key: "safety",
          label: "安全性",
          value: scoreResult.components.safety,
          weight: scoreResult.weights.safety,
        },
        {
          key: "cost",
          label: "コスト",
          value: scoreResult.components.cost,
          weight: scoreResult.weights.cost,
        },
        {
          key: "practicality",
          label: "実用性",
          value: scoreResult.components.practicality,
          weight: scoreResult.weights.practicality,
        },
      ],
      [scoreResult.components, scoreResult.weights],
    );

    // Show loading skeleton
    if (isLoading) {
      return <ScoreDisplaySkeleton />;
    }

    return (
      <section
        aria-label="製品総合スコア"
        className={`mb-6 ${className}`}
        role="region"
      >
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="total-score-heading"
              className="text-xl font-semibold text-gray-900"
            >
              総合スコア
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${scoreColor}`}
              aria-label={`評価: ${scoreLabel}`}
            >
              {scoreLabel}
            </span>
          </div>

          {/* Main score display */}
          <div className="text-center mb-6">
            <div
              className="text-5xl font-bold text-gray-900 mb-2"
              aria-live="polite"
              aria-atomic="true"
              role="status"
              aria-label={`総合スコア ${scoreResult.total} 点、100点満点中`}
            >
              {scoreResult.total}
              <span className="text-2xl font-normal text-gray-500 ml-2">
                / 100
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md mx-auto">
              <div
                className="h-4 w-full rounded-full bg-gray-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={scoreResult.total}
                aria-labelledby="total-score-heading"
                aria-describedby="score-description"
              >
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${progressColor}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, scoreResult.total))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Score description */}
          <div
            id="score-description"
            className="text-sm text-gray-600 text-center mb-4"
          >
            {scoreResult.isComplete
              ? "全データに基づく総合評価"
              : `一部データ不足（${scoreResult.missingData.length}項目）`}
          </div>

          {/* Component scores preview */}
          {showBreakdown && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100"
              role="group"
              aria-label="コンポーネント別スコア概要"
            >
              {componentData.map((component) => (
                <div
                  key={component.key}
                  className="text-center"
                  role="group"
                  aria-labelledby={`${component.key}-label`}
                >
                  <div
                    id={`${component.key}-label`}
                    className="text-xs font-medium text-gray-500 mb-1"
                  >
                    {component.label}
                    <span className="text-gray-400 ml-1">
                      ({Math.round(component.weight * 100)}%)
                    </span>
                  </div>
                  <div
                    className="text-lg font-semibold text-gray-900"
                    aria-label={`${component.label}スコア ${component.value}点`}
                  >
                    {component.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missing data warning */}
          {!scoreResult.isComplete && scoreResult.missingData.length > 0 && (
            <div
              className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    データ不足による制限
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      以下のデータが不足しているため、より正確な評価のためには追加情報が必要です：
                    </p>
                    <ul className="list-disc list-inside mt-1">
                      {scoreResult.missingData.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },
);

ScoreDisplay.displayName = "ScoreDisplay";
