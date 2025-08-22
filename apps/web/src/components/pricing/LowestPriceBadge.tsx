/**
 * Lowest Price Badge Component
 * 最安値を示すバッジコンポーネント
 */

"use client";

import React from "react";

export interface LowestPriceBadgeProps {
  variant?: "default" | "compact" | "prominent";
  animated?: boolean;
  className?: string;
}

const getVariantConfig = (variant: "default" | "compact" | "prominent") => {
  switch (variant) {
    case "compact":
      return {
        padding: "px-2 py-1",
        textSize: "text-xs",
        iconSize: "text-xs",
        rounded: "rounded",
      };
    case "prominent":
      return {
        padding: "px-4 py-2",
        textSize: "text-base",
        iconSize: "text-lg",
        rounded: "rounded-lg",
      };
    default: // default
      return {
        padding: "px-3 py-1.5",
        textSize: "text-sm",
        iconSize: "text-sm",
        rounded: "rounded-full",
      };
  }
};

export const LowestPriceBadge: React.FC<LowestPriceBadgeProps> = ({
  variant = "default",
  animated = true,
  className = "",
}) => {
  const config = getVariantConfig(variant);

  const animationClass = animated
    ? "animate-pulse hover:animate-none transition-all duration-300 hover:scale-105"
    : "";

  return (
    <div
      className={`inline-flex items-center space-x-1 bg-gradient-to-r from-green-400 to-green-600 text-white border border-green-500 font-bold shadow-sm ${config.padding} ${config.textSize} ${config.rounded} ${animationClass} ${className}`}
      role="status"
      aria-label="最安値"
    >
      <span className={`${config.iconSize}`} aria-hidden="true">
        🏆
      </span>

      <span>最安値</span>

      {variant === "prominent" && (
        <span className="ml-1 text-green-100" aria-hidden="true">
          ✨
        </span>
      )}
    </div>
  );
};

// Specialized variants for different use cases
export const CompactLowestPriceBadge: React.FC<
  Omit<LowestPriceBadgeProps, "variant">
> = (props) => {
  return <LowestPriceBadge {...props} variant="compact" />;
};

export const ProminentLowestPriceBadge: React.FC<
  Omit<LowestPriceBadgeProps, "variant">
> = (props) => {
  return <LowestPriceBadge {...props} variant="prominent" />;
};

// Badge with additional context
export interface LowestPriceBadgeWithSavingsProps
  extends LowestPriceBadgeProps {
  savings?: number;
  savingsPercentage?: number;
  currency?: "JPY" | "USD";
}

export const LowestPriceBadgeWithSavings: React.FC<
  LowestPriceBadgeWithSavingsProps
> = ({ savings, savingsPercentage, currency = "JPY", ...badgeProps }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currency === "JPY" ? "ja-JP" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(amount);
  };

  const savingsText =
    savings && savingsPercentage
      ? `${formatCurrency(savings)}お得 (${Math.round(savingsPercentage)}%オフ)`
      : savings
        ? `${formatCurrency(savings)}お得`
        : savingsPercentage
          ? `${Math.round(savingsPercentage)}%オフ`
          : null;

  return (
    <div className="flex flex-col items-center space-y-1">
      <LowestPriceBadge {...badgeProps} />
      {savingsText && (
        <div
          className="text-xs text-green-600 font-medium"
          aria-label={`節約額: ${savingsText}`}
        >
          {savingsText}
        </div>
      )}
    </div>
  );
};

// Badge for comparison tables
export const TableLowestPriceBadge: React.FC = () => {
  return (
    <div
      className="inline-flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold"
      role="status"
      aria-label="この商品が最安値です"
    >
      <span aria-hidden="true">🏆</span>
      <span>最安</span>
    </div>
  );
};

// Badge with tooltip information
export interface LowestPriceBadgeWithTooltipProps
  extends LowestPriceBadgeProps {
  tooltipText?: string;
  showTooltip?: boolean;
}

export const LowestPriceBadgeWithTooltip: React.FC<
  LowestPriceBadgeWithTooltipProps
> = ({
  tooltipText = "この商品が最も安い実効コスト/日です",
  showTooltip = true,
  ...badgeProps
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);

  if (!showTooltip) {
    return <LowestPriceBadge {...badgeProps} />;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => setIsTooltipVisible(true)}
      onBlur={() => setIsTooltipVisible(false)}
    >
      <LowestPriceBadge {...badgeProps} />

      {isTooltipVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap"
          role="tooltip"
          aria-hidden="true"
        >
          {tooltipText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};
