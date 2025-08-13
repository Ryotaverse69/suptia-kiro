"use client";

import { useState } from "react";
import { ComplianceViolation } from "@/lib/compliance";

interface WarningBannerProps {
  violations: ComplianceViolation[];
  onDismiss?: () => void;
  className?: string;
}

export function WarningBanner({
  violations,
  onDismiss,
  className = "",
}: WarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (violations.length === 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Sort violations by severity (high -> medium -> low)
  const sortedViolations = [...violations].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return (
      (severityOrder[b.pattern as keyof typeof severityOrder] || 0) -
      (severityOrder[a.pattern as keyof typeof severityOrder] || 0)
    );
  });

  return (
    <div
      className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            表現に関する注意
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              以下の表現について、より適切な表現をご提案します：
            </p>
            <ul className="list-disc list-inside space-y-1">
              {sortedViolations.map((violation, index) => (
                <li key={index}>
                  <span className="font-medium">
                    「{violation.originalText}」
                  </span>
                  {" → "}
                  <span className="text-green-700">
                    「{violation.suggestedText}」
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
              aria-label="警告を閉じる"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
