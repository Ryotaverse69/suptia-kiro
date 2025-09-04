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



  return (
    <WarningBanner
      violations={violations}
      onDismiss={onDismiss}
      className={className}
    />
  );
}