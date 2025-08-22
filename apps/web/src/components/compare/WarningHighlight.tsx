"use client";

import React, { memo, useMemo } from "react";
import type { Warning, WarningAnalysis } from "@/lib/compare/warning-analyzer";

export interface WarningHighlightProps {
  warnings: Warning[];
  productId: string;
  productName: string;
  showCount?: boolean;
  showMostImportant?: boolean;
  compact?: boolean;
  className?: string;
}

export interface WarningCountDisplayProps {
  count: number;
  severity: "critical" | "warning" | "info" | "mixed";
  className?: string;
}

export interface WarningIndicatorProps {
  warning: Warning;
  isHighlighted?: boolean;
  className?: string;
}

/**
 * 警告分析から全体的な重要度を計算する
 */
function getOverallSeverity(
  analysis: WarningAnalysis,
): "critical" | "warning" | "info" | "mixed" {
  const { severitySummary } = analysis;

  if (severitySummary.critical > 0) {
    return severitySummary.warning > 0 || severitySummary.info > 0
      ? "mixed"
      : "critical";
  }

  if (severitySummary.warning > 0) {
    return severitySummary.info > 0 ? "mixed" : "warning";
  }

  if (severitySummary.info > 0) {
    return "info";
  }

  return "info"; // デフォルト
}

/**
 * 警告の重要度に基づくスタイル設定
 */
const WARNING_STYLES = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-800 border-red-200",
    indicator: "🚨",
  },
  warning: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    indicator: "⚠️",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    indicator: "ℹ️",
  },
  mixed: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    icon: "text-gray-600",
    badge: "bg-gray-100 text-gray-800 border-gray-200",
    indicator: "📋",
  },
} as const;

/**
 * 警告件数表示コンポーネント
 */
export const WarningCountDisplay = memo<WarningCountDisplayProps>(
  ({ count, severity, className = "" }) => {
    const styles = WARNING_STYLES[severity];

    if (count === 0) {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}
          aria-label="警告なし"
        >
          ✓ 警告なし
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles.badge} ${className}`}
        aria-label={`警告 ${count} 件`}
      >
        <span className="mr-1" aria-hidden="true">
          {styles.indicator}
        </span>
        {count}件
      </span>
    );
  },
);

WarningCountDisplay.displayName = "WarningCountDisplay";

/**
 * 個別警告インジケーターコンポーネント
 */
export const WarningIndicator = memo<WarningIndicatorProps>(
  ({ warning, isHighlighted = false, className = "" }) => {
    const styles = WARNING_STYLES[warning.type];
    const highlightClass = isHighlighted
      ? "ring-2 ring-yellow-400 ring-opacity-75"
      : "";

    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded text-xs border ${styles.badge} ${highlightClass} ${className}`}
        title={warning.message}
        aria-label={`${warning.type === "critical" ? "重要な警告" : warning.type === "warning" ? "警告" : "情報"}: ${warning.message}`}
      >
        <span className="mr-1" aria-hidden="true">
          {styles.indicator}
        </span>
        <span className="truncate max-w-24">{warning.category}</span>
      </div>
    );
  },
);

WarningIndicator.displayName = "WarningIndicator";

/**
 * メイン警告ハイライトコンポーネント
 */
export const WarningHighlight = memo<WarningHighlightProps>(
  ({
    warnings,
    productId,
    productName,
    showCount = true,
    showMostImportant = true,
    compact = false,
    className = "",
  }) => {
    const analysis = useMemo(() => {
      const criticalCount = warnings.filter(
        (w) => w.type === "critical",
      ).length;
      const warningCount = warnings.filter((w) => w.type === "warning").length;
      const infoCount = warnings.filter((w) => w.type === "info").length;

      const mostImportant = warnings.reduce(
        (most, current) => {
          if (!most) return current;
          if (current.severity > most.severity) return current;
          if (current.severity === most.severity) {
            const typeOrder = { critical: 3, warning: 2, info: 1 };
            return typeOrder[current.type] > typeOrder[most.type]
              ? current
              : most;
          }
          return most;
        },
        null as Warning | null,
      );

      const overallSeverity: "critical" | "warning" | "info" | "mixed" =
        criticalCount > 0
          ? "critical"
          : warningCount > 0
            ? "warning"
            : infoCount > 0
              ? "info"
              : "mixed";

      return {
        totalWarnings: warnings.length,
        criticalCount,
        warningCount,
        infoCount,
        mostImportant,
        overallSeverity,
      };
    }, [warnings]);

    if (warnings.length === 0) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <WarningCountDisplay count={0} severity="mixed" />
        </div>
      );
    }

    if (compact) {
      return (
        <div className={`flex items-center space-x-1 ${className}`}>
          <WarningCountDisplay
            count={analysis.totalWarnings}
            severity={analysis.overallSeverity}
          />
          {showMostImportant && analysis.mostImportant && (
            <WarningIndicator
              warning={analysis.mostImportant}
              isHighlighted={true}
            />
          )}
        </div>
      );
    }

    return (
      <div
        className={`space-y-2 ${className}`}
        role="region"
        aria-label={`${productName}の警告情報`}
      >
        {/* 警告件数サマリー */}
        {showCount && (
          <div className="flex items-center space-x-2">
            <WarningCountDisplay
              count={analysis.totalWarnings}
              severity={analysis.overallSeverity}
            />

            {/* 詳細内訳 */}
            {analysis.totalWarnings > 0 && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                {analysis.criticalCount > 0 && (
                  <span className="text-red-600">
                    重要{analysis.criticalCount}
                  </span>
                )}
                {analysis.warningCount > 0 && (
                  <span className="text-orange-600">
                    警告{analysis.warningCount}
                  </span>
                )}
                {analysis.infoCount > 0 && (
                  <span className="text-blue-600">
                    情報{analysis.infoCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 最重要警告のハイライト */}
        {showMostImportant && analysis.mostImportant && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">最重要警告:</div>
            <WarningIndicator
              warning={analysis.mostImportant}
              isHighlighted={true}
              className="w-full"
            />
            <div className="text-xs text-gray-600 leading-relaxed">
              {analysis.mostImportant.message}
            </div>
          </div>
        )}

        {/* 全警告リスト（コンパクトでない場合） */}
        {!compact && warnings.length > 1 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">全ての警告:</div>
            <div className="flex flex-wrap gap-1">
              {warnings.map((warning, index) => (
                <WarningIndicator
                  key={`${warning.id}-${index}`}
                  warning={warning}
                  isHighlighted={warning.id === analysis.mostImportant?.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* スクリーンリーダー用の詳細情報 */}
        <div className="sr-only">
          {productName}には{analysis.totalWarnings}件の警告があります。
          {analysis.criticalCount > 0 &&
            `重要な警告が${analysis.criticalCount}件、`}
          {analysis.warningCount > 0 &&
            `一般的な警告が${analysis.warningCount}件、`}
          {analysis.infoCount > 0 && `参考情報が${analysis.infoCount}件`}
          含まれています。
          {analysis.mostImportant &&
            `最も重要な警告は「${analysis.mostImportant.message}」です。`}
        </div>
      </div>
    );
  },
);

WarningHighlight.displayName = "WarningHighlight";

/**
 * 警告比較サマリーコンポーネント
 * 複数製品間での警告状況を比較表示
 */
export interface WarningComparisonSummaryProps {
  warningAnalysis: WarningAnalysis;
  className?: string;
}

export const WarningComparisonSummary = memo<WarningComparisonSummaryProps>(
  ({ warningAnalysis, className = "" }) => {
    const { severitySummary, totalWarnings, mostImportantWarning } =
      warningAnalysis;

    if (totalWarnings === 0) {
      return (
        <div
          className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-green-600" aria-hidden="true">
              ✅
            </span>
            <span className="text-sm font-medium text-green-800">
              比較対象の製品に警告はありません
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">警告サマリー</h4>
            <span className="text-xs text-gray-600">
              合計 {totalWarnings} 件
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {severitySummary.critical > 0 && (
              <span className="flex items-center space-x-1 text-red-600">
                <span aria-hidden="true">🚨</span>
                <span>重要 {severitySummary.critical}</span>
              </span>
            )}
            {severitySummary.warning > 0 && (
              <span className="flex items-center space-x-1 text-orange-600">
                <span aria-hidden="true">⚠️</span>
                <span>警告 {severitySummary.warning}</span>
              </span>
            )}
            {severitySummary.info > 0 && (
              <span className="flex items-center space-x-1 text-blue-600">
                <span aria-hidden="true">ℹ️</span>
                <span>情報 {severitySummary.info}</span>
              </span>
            )}
          </div>

          {mostImportantWarning && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">
                最重要警告:
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {mostImportantWarning.message}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

WarningComparisonSummary.displayName = "WarningComparisonSummary";
