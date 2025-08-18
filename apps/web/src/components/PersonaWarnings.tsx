"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  checkPersonaRules,
  type PersonaWarning,
  type Persona,
} from "@/lib/persona-rules";
import { checkText, type ComplianceViolation } from "@/lib/compliance";
import { WarningBannerList } from "./WarningBanner";

interface Props {
  text: string;
  ingredients: string[];
  personas?: Persona[];
  className?: string;
  showDetails?: boolean;
  enableCompliance?: boolean;
  onWarningsChange?: (warnings: CombinedWarning[]) => void;
}

interface CombinedWarning {
  id: string;
  type: "persona" | "compliance";
  severity: "high" | "mid" | "low";
  message: string;
  tag?: string;
  ingredient?: string;
  violation?: ComplianceViolation;
}

// Error Boundary Component
class WarningErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("PersonaWarnings Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              警告システムでエラーが発生しました。ページを再読み込みしてください。
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const getSeverityConfig = (severity: PersonaWarning["severity"]) => {
  switch (severity) {
    case "high":
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        iconColor: "text-red-600",
        icon: "🚨",
        label: "重要な警告",
      };
    case "mid":
      return {
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-800",
        iconColor: "text-yellow-600",
        icon: "⚠️",
        label: "注意事項",
      };
    case "low":
      return {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        iconColor: "text-blue-600",
        icon: "ℹ️",
        label: "参考情報",
      };
  }
};

const getCategoryLabel = (tag: string) => {
  switch (tag) {
    case "pregnancy":
      return "妊娠";
    case "lactation":
      return "授乳";
    case "medication":
      return "薬物相互作用";
    case "underage":
      return "未成年者";
    case "elderly":
      return "高齢者";
    case "stimulant":
      return "刺激物";
    default:
      return "注意事項";
  }
};

function PersonaWarningsContent({
  text,
  ingredients,
  personas = ["general"],
  className = "",
  showDetails = false,
  enableCompliance = true,
  onWarningsChange,
}: Props) {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(
    new Set(),
  );
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(
    new Set(),
  );

  // Persona warnings
  const personaWarnings = useMemo(
    () => checkPersonaRules(text, ingredients, personas),
    [text, ingredients, personas],
  );

  // Compliance warnings
  const complianceViolations = useMemo(() => {
    if (!enableCompliance || !text) return [];
    try {
      return checkText(text);
    } catch (error) {
      console.warn("Compliance check failed:", error);
      return [];
    }
  }, [text, enableCompliance]);

  // Combined warnings
  const combinedWarnings = useMemo(() => {
    const warnings: CombinedWarning[] = [];

    // Add persona warnings
    personaWarnings.forEach((warning, index) => {
      const id = `persona-${warning.tag}-${index}`;
      if (!dismissedWarnings.has(id)) {
        warnings.push({
          id,
          type: "persona",
          severity: warning.severity,
          message: warning.message,
          tag: warning.tag,
          ingredient: warning.ingredient,
        });
      }
    });

    // Add compliance warnings
    complianceViolations.forEach((violation, index) => {
      const id = `compliance-${index}`;
      if (!dismissedWarnings.has(id)) {
        warnings.push({
          id,
          type: "compliance",
          severity: "mid", // Compliance violations are typically mid-level
          message: `「${violation.match}」は適切ではない表現です。「${violation.suggestion}」をご検討ください。`,
          violation,
        });
      }
    });

    // Sort by severity (high > mid > low)
    const severityOrder = { high: 3, mid: 2, low: 1 };
    return warnings.sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
    );
  }, [personaWarnings, complianceViolations, dismissedWarnings]);

  // Notify parent of warnings changes
  useEffect(() => {
    onWarningsChange?.(combinedWarnings);
  }, [combinedWarnings, onWarningsChange]);

  const handleDismissWarning = useCallback((warningId: string) => {
    setDismissedWarnings((prev) => new Set([...prev, warningId]));
  }, []);

  const warnings = combinedWarnings;

  const toggleWarningDetails = (warningId: string) => {
    setExpandedWarnings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(warningId)) {
        newSet.delete(warningId);
      } else {
        newSet.add(warningId);
      }
      return newSet;
    });
  };

  if (warnings.length === 0) {
    return null;
  }

  // Group warnings by severity for better organization
  const groupedWarnings = warnings.reduce(
    (acc, warning) => {
      if (!acc[warning.severity]) {
        acc[warning.severity] = [];
      }
      acc[warning.severity].push(warning);
      return acc;
    },
    {} as Record<string, CombinedWarning[]>,
  );

  if (warnings.length === 0) {
    return null;
  }

  // Use WarningBannerList for modern banner-style display
  const bannerWarnings = warnings.map((warning) => ({
    id: warning.id,
    severity: warning.severity,
    message: warning.message,
  }));

  return (
    <section
      className={`mb-6 ${className}`}
      role="region"
      aria-label="使用上の注意事項"
    >
      <WarningBannerList
        warnings={bannerWarnings}
        onDismiss={handleDismissWarning}
        maxVisible={5}
      />

      {/* Detailed view for expanded warnings */}
      {showDetails && (
        <div className="mt-4 space-y-4">
          {(["high", "mid", "low"] as const).map((severity) => {
            const severityWarnings = warnings.filter(
              (w) => w.severity === severity,
            );
            if (!severityWarnings?.length) return null;

            const config = getSeverityConfig(severity);

            return (
              <div
                key={severity}
                className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}
                role="alert"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 ${config.iconColor}`}
                    aria-hidden="true"
                  >
                    <span className="text-lg">{config.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-semibold ${config.textColor} mb-3`}
                      id={`warnings-${severity}-heading`}
                    >
                      {config.label} ({severityWarnings.length}件)
                    </h3>

                    <div
                      className="space-y-3"
                      role="list"
                      aria-labelledby={`warnings-${severity}-heading`}
                    >
                      {severityWarnings.map((warning) => {
                        const isExpanded = expandedWarnings.has(warning.id);
                        const hasDetails =
                          warning.ingredient || warning.violation;

                        return (
                          <div
                            key={warning.id}
                            className="border-l-2 border-gray-200 pl-4"
                            role="listitem"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
                                    aria-label={`タイプ: ${warning.type === "persona" ? "ペルソナ" : "コンプライアンス"}`}
                                  >
                                    {warning.type === "persona"
                                      ? getCategoryLabel(warning.tag || "")
                                      : "コンプライアンス"}
                                  </span>
                                </div>

                                <p
                                  className={`text-sm ${config.textColor} leading-relaxed`}
                                  id={`warning-message-${warning.id}`}
                                >
                                  {warning.message}
                                </p>
                              </div>

                              {hasDetails && (
                                <button
                                  className={`ml-3 flex-shrink-0 text-xs ${config.textColor} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded`}
                                  onClick={() =>
                                    toggleWarningDetails(warning.id)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      toggleWarningDetails(warning.id);
                                    }
                                  }}
                                  aria-expanded={isExpanded}
                                  aria-controls={`warning-details-${warning.id}`}
                                  aria-describedby={`warning-message-${warning.id}`}
                                  type="button"
                                >
                                  {isExpanded ? "詳細を閉じる" : "詳細を見る"}
                                  <span
                                    className={`ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    aria-hidden="true"
                                  >
                                    ▼
                                  </span>
                                </button>
                              )}
                            </div>

                            {hasDetails && isExpanded && (
                              <div
                                id={`warning-details-${warning.id}`}
                                className={`mt-3 p-3 rounded-md bg-white bg-opacity-50 border ${config.borderColor}`}
                                role="region"
                                aria-labelledby={`warning-message-${warning.id}`}
                              >
                                {warning.ingredient && (
                                  <div className="mb-2">
                                    <h4
                                      className={`text-xs font-medium ${config.textColor} mb-1`}
                                    >
                                      対象成分:
                                    </h4>
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
                                      aria-label={`成分: ${warning.ingredient}`}
                                    >
                                      {warning.ingredient}
                                    </span>
                                  </div>
                                )}

                                {warning.violation && (
                                  <div className="mb-2">
                                    <h4
                                      className={`text-xs font-medium ${config.textColor} mb-1`}
                                    >
                                      検出された表現:
                                    </h4>
                                    <div className="space-y-1">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800 border border-red-200`}
                                      >
                                        {warning.violation.match}
                                      </span>
                                      <span className="mx-2 text-xs text-gray-500">
                                        →
                                      </span>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800 border border-green-200`}
                                      >
                                        {warning.violation.suggestion}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {warnings.length}件の注意事項があります。
        {warnings.filter((w) => w.severity === "high").length > 0 &&
          `重要な警告${warnings.filter((w) => w.severity === "high").length}件、`}
        {warnings.filter((w) => w.severity === "mid").length > 0 &&
          `注意事項${warnings.filter((w) => w.severity === "mid").length}件、`}
        {warnings.filter((w) => w.severity === "low").length > 0 &&
          `参考情報${warnings.filter((w) => w.severity === "low").length}件`}
      </div>
    </section>
  );
}

// Main export with Error Boundary
export function PersonaWarnings(props: Props) {
  return (
    <WarningErrorBoundary>
      <PersonaWarningsContent {...props} />
    </WarningErrorBoundary>
  );
}
