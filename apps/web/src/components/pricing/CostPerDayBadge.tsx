/**
 * Cost Per Day Badge Component
 * 実効コスト/日を視覚的に表示するバッジ
 */

"use client";

import React from "react";

export interface CostPerDayBadgeProps {
  cost: number;
  currency?: "JPY" | "USD";
  isLowest?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const formatCurrency = (amount: number, currency: "JPY" | "USD"): string => {
  return new Intl.NumberFormat(currency === "JPY" ? "ja-JP" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
};

const getCostLevel = (
  cost: number,
): "low" | "medium" | "high" | "very-high" => {
  if (cost <= 50) return "low";
  if (cost <= 100) return "medium";
  if (cost <= 200) return "high";
  return "very-high";
};

const getCostLevelConfig = (level: string, isLowest: boolean) => {
  if (isLowest) {
    return {
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-200",
      icon: "🏆",
      label: "最安値",
    };
  }

  switch (level) {
    case "low":
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200",
        icon: "💰",
        label: "お得",
      };
    case "medium":
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
        icon: "💵",
        label: "標準",
      };
    case "high":
      return {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
        icon: "💸",
        label: "やや高",
      };
    case "very-high":
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
        icon: "💸",
        label: "高額",
      };
    default:
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
        icon: "💰",
        label: "標準",
      };
  }
};

const getSizeConfig = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return {
        padding: "px-2 py-1",
        textSize: "text-xs",
        iconSize: "text-xs",
      };
    case "lg":
      return {
        padding: "px-4 py-2",
        textSize: "text-base",
        iconSize: "text-base",
      };
    default: // md
      return {
        padding: "px-3 py-1.5",
        textSize: "text-sm",
        iconSize: "text-sm",
      };
  }
};

export const CostPerDayBadge: React.FC<CostPerDayBadgeProps> = ({
  cost,
  currency = "JPY",
  isLowest = false,
  size = "md",
  showLabel = true,
  className = "",
}) => {
  const costLevel = getCostLevel(cost);
  const config = getCostLevelConfig(costLevel, isLowest);
  const sizeConfig = getSizeConfig(size);

  const formattedCost = formatCurrency(cost, currency);
  const ariaLabel = `実効コスト1日あたり${formattedCost}${isLowest ? "、最安値" : ""}`;

  return (
    <div
      className={`inline-flex items-center space-x-1 rounded-full border font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeConfig.padding} ${sizeConfig.textSize} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <span className={sizeConfig.iconSize} aria-hidden="true">
        {config.icon}
      </span>

      <span className="font-semibold">{formattedCost}</span>

      <span className="text-gray-600">/日</span>

      {showLabel && (
        <span className={`ml-1 ${sizeConfig.textSize}`} aria-hidden="true">
          ({config.label})
        </span>
      )}
    </div>
  );
};

// Compact version for table cells
export const CompactCostPerDayBadge: React.FC<
  Omit<CostPerDayBadgeProps, "showLabel" | "size">
> = (props) => {
  return <CostPerDayBadge {...props} size="sm" showLabel={false} />;
};

// Large version for prominent display
export const LargeCostPerDayBadge: React.FC<CostPerDayBadgeProps> = (props) => {
  return <CostPerDayBadge {...props} size="lg" showLabel={true} />;
};
