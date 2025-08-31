"use client";

import { ComplianceViolation } from "@/lib/compliance";
import { WarningBanner } from "./WarningBanner";

interface LegacyWarningBannerProps {
  violations: ComplianceViolation[];
  onDismiss?: () => void;
  className?: string;
}

export function LegacyWarningBanner({
  violations,
  onDismiss,
  className = "",
}: LegacyWarningBannerProps) {
  if (violations.length === 0) {
    return null;
  }

  // 複数の違反を1つのメッセージにまとめる
  const message = violations.length === 1 
    ? `「${violations[0].originalText}」→「${violations[0].suggestedText}」`
    : `${violations.length}件の表現について改善提案があります`;

  const suggestion = violations.length > 1 
    ? violations.map(v => `「${v.originalText}」→「${v.suggestedText}」`).join('、')
    : undefined;

  // 最も高い重要度を使用
  const severity = violations.reduce((highest, violation) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const currentSeverity = violation.severity || 'low';
    const highestSeverity = highest || 'low';
    
    return (severityOrder[currentSeverity] > severityOrder[highestSeverity]) 
      ? currentSeverity 
      : highestSeverity;
  }, 'low' as 'low' | 'medium' | 'high');

  return (
    <WarningBanner
      type="compliance"
      severity={severity}
      message={message}
      suggestion={suggestion}
      onDismiss={onDismiss || (() => {})}
      className={className}
    />
  );
}