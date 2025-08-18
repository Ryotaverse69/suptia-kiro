/**
 * Price Source Link Component
 * 価格ソースへのリンクと取得時刻を表示
 */

"use client";

import React, { useState, useCallback } from "react";

export interface PriceSourceLinkProps {
  url: string;
  source: "rakuten" | "yahoo" | "amazon" | "iherb" | string;
  productName: string;
  timestamp?: string;
  showTimestamp?: boolean;
  showDisclaimer?: boolean;
  trackClick?: boolean;
  className?: string;
}

const getSourceConfig = (source: string) => {
  switch (source) {
    case "rakuten":
      return {
        name: "楽天市場",
        color: "text-red-600 hover:text-red-800",
        bgColor: "hover:bg-red-50",
        icon: "🛒",
        domain: "rakuten.co.jp",
      };
    case "yahoo":
      return {
        name: "Yahoo!ショッピング",
        color: "text-purple-600 hover:text-purple-800",
        bgColor: "hover:bg-purple-50",
        icon: "🛍️",
        domain: "shopping.yahoo.co.jp",
      };
    case "amazon":
      return {
        name: "Amazon",
        color: "text-orange-600 hover:text-orange-800",
        bgColor: "hover:bg-orange-50",
        icon: "📦",
        domain: "amazon.co.jp",
      };
    case "iherb":
      return {
        name: "iHerb",
        color: "text-green-600 hover:text-green-800",
        bgColor: "hover:bg-green-50",
        icon: "🌿",
        domain: "iherb.com",
      };
    default:
      return {
        name: source,
        color: "text-blue-600 hover:text-blue-800",
        bgColor: "hover:bg-blue-50",
        icon: "🔗",
        domain: "external",
      };
  }
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return "たった今";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return new Intl.DateTimeFormat("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }
  } catch {
    return "不明";
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const PriceSourceLink: React.FC<PriceSourceLinkProps> = ({
  url,
  source,
  productName,
  timestamp,
  showTimestamp = true,
  showDisclaimer = true,
  trackClick = true,
  className = "",
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const config = getSourceConfig(source);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isValidUrl(url)) {
        e.preventDefault();
        console.warn("Invalid URL provided:", url);
        return;
      }

      setIsClicked(true);

      // Track click if enabled
      if (trackClick) {
        // Here you would integrate with your analytics service
        console.log("Price source link clicked:", {
          source,
          productName,
          url,
          timestamp: new Date().toISOString(),
        });
      }

      // Reset clicked state after animation
      setTimeout(() => setIsClicked(false), 200);
    },
    [url, source, productName, trackClick],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const linkElement = e.currentTarget as HTMLAnchorElement;
      linkElement.click();
    }
  }, []);

  if (!isValidUrl(url)) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        <span className="mr-1" aria-hidden="true">
          ⚠️
        </span>
        リンク無効
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main link */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 transition-all duration-200 ${config.color} ${config.bgColor} ${isClicked ? "scale-95" : "hover:scale-105"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${config.name}で${productName}を見る（新しいタブで開きます）`}
      >
        <span className="text-lg" aria-hidden="true">
          {config.icon}
        </span>

        <div className="flex flex-col">
          <span className="font-medium text-sm">{config.name}で見る</span>
          {showTimestamp && timestamp && (
            <span className="text-xs text-gray-500">
              {formatTimestamp(timestamp)}更新
            </span>
          )}
        </div>

        <span className="text-gray-400" aria-hidden="true">
          ↗
        </span>
      </a>

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="text-xs text-gray-500 leading-relaxed">
          <div className="flex items-start space-x-1">
            <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
              ℹ️
            </span>
            <div>
              価格は{config.name}での表示価格です。 実際の価格や在庫状況は
              {config.name}でご確認ください。
              {trackClick && (
                <span className="block mt-1">
                  ※クリック数は統計目的で記録されます
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for table cells
export const CompactPriceSourceLink: React.FC<
  Omit<PriceSourceLinkProps, "showTimestamp" | "showDisclaimer">
> = (props) => {
  const config = getSourceConfig(props.source);

  if (!isValidUrl(props.url)) {
    return <span className="text-gray-400 text-xs">リンク無効</span>;
  }

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center space-x-1 text-xs ${config.color} hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded`}
      aria-label={`${config.name}で${props.productName}を見る`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>購入</span>
      <span className="text-gray-400" aria-hidden="true">
        ↗
      </span>
    </a>
  );
};

// Button-style link
export const ButtonPriceSourceLink: React.FC<PriceSourceLinkProps> = (
  props,
) => {
  const config = getSourceConfig(props.source);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isValidUrl(props.url)) {
        e.preventDefault();
        return;
      }

      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);

      if (props.trackClick) {
        console.log("Button price source link clicked:", {
          source: props.source,
          productName: props.productName,
          url: props.url,
        });
      }
    },
    [props.url, props.source, props.productName, props.trackClick],
  );

  if (!isValidUrl(props.url)) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        リンク無効
      </button>
    );
  }

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isClicked ? "scale-95" : "hover:scale-105"} focus:outline-none focus:ring-2 focus:ring-offset-2`}
      style={{
        backgroundColor: config.color.includes("red")
          ? "#fee2e2"
          : config.color.includes("purple")
            ? "#f3e8ff"
            : config.color.includes("orange")
              ? "#fed7aa"
              : config.color.includes("green")
                ? "#dcfce7"
                : "#dbeafe",
        color: config.color.includes("red")
          ? "#dc2626"
          : config.color.includes("purple")
            ? "#9333ea"
            : config.color.includes("orange")
              ? "#ea580c"
              : config.color.includes("green")
                ? "#16a34a"
                : "#2563eb",
      }}
      onClick={handleClick}
      aria-label={`${config.name}で${props.productName}を購入する`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.name}で購入</span>
      <span className="text-current opacity-60" aria-hidden="true">
        ↗
      </span>
    </a>
  );
};
