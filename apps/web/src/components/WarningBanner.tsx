"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import type { Severity } from "@/lib/persona-rules";

export interface WarningBannerProps {
  severity: Severity;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
  id?: string;
  ariaLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

const SEVERITY_STYLES = {
  high: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-500",
    button: "text-red-600 hover:text-red-800 focus:ring-red-500",
  },
  mid: {
    container: "bg-orange-50 border-orange-200 text-orange-800",
    icon: "text-orange-500",
    button: "text-orange-600 hover:text-orange-800 focus:ring-orange-500",
  },
  low: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: "text-yellow-500",
    button: "text-yellow-600 hover:text-yellow-800 focus:ring-yellow-500",
  },
} as const;

const SEVERITY_LABELS = {
  high: "重要な警告",
  mid: "注意事項",
  low: "情報",
} as const;

export const WarningBanner = memo<WarningBannerProps>(
  ({
    severity,
    message,
    onDismiss,
    dismissible = true,
    className = "",
    id,
    ariaLevel = 2,
  }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const styles = SEVERITY_STYLES[severity];
    const label = SEVERITY_LABELS[severity];

    const handleDismiss = useCallback(() => {
      if (!dismissible) return;
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 150);
    }, [dismissible, onDismiss]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Escape" && dismissible) {
          event.preventDefault();
          handleDismiss();
        }
      },
      [dismissible, handleDismiss],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <div
        id={id}
        className={`relative rounded-lg border p-4 transition-all duration-150 ease-in-out ${styles.container} ${isAnimating ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"} ${className}`}
        role="status"
        aria-level={ariaLevel}
        aria-live="polite"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="sr-only">{label}: </span>
                <p className="text-sm font-medium leading-relaxed">{message}</p>
              </div>
              {dismissible && (
                <div className="flex-shrink-0 ml-4">
                  <button
                    type="button"
                    className={`inline-flex rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${styles.button}`}
                    onClick={handleDismiss}
                    aria-label={`${label}を閉じる`}
                    title="警告を閉じる (Escキー)"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

WarningBanner.displayName = "WarningBanner";

export interface WarningBannerListProps {
  warnings: Array<{
    id: string;
    severity: Severity;
    message: string;
  }>;
  onDismiss?: (id: string) => void;
  className?: string;
  maxVisible?: number;
}

export const WarningBannerList = memo<WarningBannerListProps>(
  ({ warnings, onDismiss, className = "", maxVisible = 5 }) => {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const handleDismiss = useCallback(
      (id: string) => {
        setDismissedIds((prev) => new Set([...prev, id]));
        onDismiss?.(id);
      },
      [onDismiss],
    );

    const visibleWarnings = warnings
      .filter((warning) => !dismissedIds.has(warning.id))
      .slice(0, maxVisible);

    if (visibleWarnings.length === 0) {
      return null;
    }

    return (
      <div
        className={`space-y-3 ${className}`}
        role="region"
        aria-label="警告一覧"
      >
        {visibleWarnings.map((warning, index) => (
          <WarningBanner
            key={warning.id}
            id={`warning-${warning.id}`}
            severity={warning.severity}
            message={warning.message}
            onDismiss={() => handleDismiss(warning.id)}
            ariaLevel={index === 0 ? 2 : 3}
          />
        ))}

        {warnings.length > maxVisible && (
          <div className="text-sm text-gray-600 text-center py-2">
            他に {warnings.length - maxVisible} 件の警告があります
          </div>
        )}
      </div>
    );
  },
);

WarningBannerList.displayName = "WarningBannerList";
