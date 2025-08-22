/**
 * Price Normalizer
 * 複数ソースからの価格情報を統一形式に正規化
 */

import type { RakutenProduct } from "./rakuten-connector";
import type { YahooProduct } from "./yahoo-connector";

export interface NormalizedPrice {
  productId: string;
  source: "rakuten" | "yahoo";
  sourceProductId: string;
  basePrice: number; // 税込価格
  shippingCost: number;
  totalPrice: number; // basePrice + shippingCost
  inStock: boolean;
  isSubscription: boolean;
  subscriptionDiscount?: number; // 割引率（0-1）
  subscriptionInterval?: "weekly" | "monthly" | "quarterly";
  lastUpdated: string;
  sourceUrl: string;
  shopName: string;
  currency: "JPY";
  taxIncluded: boolean;
  metadata: {
    originalPrice?: number;
    taxRate?: number;
    freeShippingThreshold?: number;
    bulkDiscounts?: Array<{
      quantity: number;
      discountRate: number;
    }>;
  };
}

export interface PriceNormalizationConfig {
  defaultTaxRate: number; // 0.1 (10%)
  defaultShippingCost: number; // 500円
  freeShippingThreshold: number; // 3000円
  subscriptionDetectionKeywords: string[];
  currencyConversionRates: Record<string, number>;
}

export class PriceNormalizer {
  private config: PriceNormalizationConfig;

  constructor(config?: Partial<PriceNormalizationConfig>) {
    this.config = {
      defaultTaxRate: 0.1,
      defaultShippingCost: 500,
      freeShippingThreshold: 3000,
      subscriptionDetectionKeywords: [
        "定期",
        "毎月",
        "毎週",
        "サブスク",
        "subscription",
        "継続",
        "自動配送",
        "auto delivery",
        "定期便",
      ],
      currencyConversionRates: {
        USD: 150, // 1USD = 150JPY (デフォルト)
        EUR: 165, // 1EUR = 165JPY (デフォルト)
      },
      ...config,
    };
  }

  /**
   * 楽天商品の価格正規化
   */
  normalizeRakutenPrice(
    product: RakutenProduct,
    productId: string,
    prefecture = "東京都",
  ): NormalizedPrice {
    const basePrice = this.ensureTaxIncluded(product.itemPrice, true);
    const shippingCost = this.calculateRakutenShipping(product, basePrice);
    const totalPrice = basePrice + shippingCost;

    const subscriptionInfo = this.detectSubscription(product.itemName);

    return {
      productId,
      source: "rakuten",
      sourceProductId: product.itemCode,
      basePrice,
      shippingCost,
      totalPrice,
      inStock: product.availability === 1,
      isSubscription: subscriptionInfo.isSubscription,
      subscriptionDiscount: subscriptionInfo.discount,
      subscriptionInterval: subscriptionInfo.interval,
      lastUpdated: new Date().toISOString(),
      sourceUrl: product.itemUrl,
      shopName: product.shopName,
      currency: "JPY",
      taxIncluded: true,
      metadata: {
        originalPrice: product.itemPrice,
        taxRate: this.config.defaultTaxRate,
        freeShippingThreshold: this.config.freeShippingThreshold,
      },
    };
  }

  /**
   * Yahoo!商品の価格正規化
   */
  normalizeYahooPrice(
    product: YahooProduct,
    productId: string,
    prefecture = "東京都",
  ): NormalizedPrice {
    const basePrice = this.ensureTaxIncluded(product.price, true);
    const shippingCost = this.calculateYahooShipping(product, basePrice);
    const totalPrice = basePrice + shippingCost;

    const subscriptionInfo = this.detectSubscription(product.name);

    return {
      productId,
      source: "yahoo",
      sourceProductId: product.code,
      basePrice,
      shippingCost,
      totalPrice,
      inStock: product.inStock,
      isSubscription: subscriptionInfo.isSubscription,
      subscriptionDiscount: subscriptionInfo.discount,
      subscriptionInterval: subscriptionInfo.interval,
      lastUpdated: new Date().toISOString(),
      sourceUrl: product.url,
      shopName: product.seller.name,
      currency: "JPY",
      taxIncluded: true,
      metadata: {
        originalPrice: product.price,
        taxRate: this.config.defaultTaxRate,
        freeShippingThreshold: this.config.freeShippingThreshold,
      },
    };
  }

  /**
   * 税込価格の確保
   */
  private ensureTaxIncluded(price: number, isTaxIncluded: boolean): number {
    if (isTaxIncluded) {
      return Math.round(price);
    }
    return Math.round(price * (1 + this.config.defaultTaxRate));
  }

  /**
   * 楽天送料計算
   */
  private calculateRakutenShipping(
    product: RakutenProduct,
    basePrice: number,
  ): number {
    // 送料込みの場合
    if (product.postageFlag === 1) {
      return 0;
    }

    // 送料無料閾値チェック
    if (basePrice >= this.config.freeShippingThreshold) {
      return 0;
    }

    // デフォルト送料
    return this.config.defaultShippingCost;
  }

  /**
   * Yahoo!送料計算
   */
  private calculateYahooShipping(
    product: YahooProduct,
    basePrice: number,
  ): number {
    // 送料込みの場合
    if (product.shipping.code === 1) {
      return 0;
    }

    // 送料無料閾値チェック
    if (basePrice >= this.config.freeShippingThreshold) {
      return 0;
    }

    // 設定された送料または デフォルト送料
    return product.shipping.price || this.config.defaultShippingCost;
  }

  /**
   * サブスクリプション検出
   */
  private detectSubscription(productName: string): {
    isSubscription: boolean;
    discount?: number;
    interval?: "weekly" | "monthly" | "quarterly";
  } {
    const normalizedName = productName.toLowerCase();

    // サブスクリプションキーワード検出
    const hasSubscriptionKeyword =
      this.config.subscriptionDetectionKeywords.some((keyword) =>
        normalizedName.includes(keyword.toLowerCase()),
      );

    if (!hasSubscriptionKeyword) {
      return { isSubscription: false };
    }

    // 割引率検出
    const discountMatch = productName.match(/(\d+)%\s*(?:off|オフ|割引)/i);
    const discount = discountMatch
      ? parseInt(discountMatch[1]) / 100
      : undefined;

    // 配送間隔検出
    let interval: "weekly" | "monthly" | "quarterly" | undefined;
    if (normalizedName.includes("毎週") || normalizedName.includes("weekly")) {
      interval = "weekly";
    } else if (
      normalizedName.includes("毎月") ||
      normalizedName.includes("monthly")
    ) {
      interval = "monthly";
    } else if (
      normalizedName.includes("3ヶ月") ||
      normalizedName.includes("quarterly")
    ) {
      interval = "quarterly";
    } else {
      interval = "monthly"; // デフォルト
    }

    return {
      isSubscription: true,
      discount,
      interval,
    };
  }

  /**
   * 通貨変換
   */
  convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency = "JPY",
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = this.config.currencyConversionRates[fromCurrency];
    if (!rate) {
      throw new Error(
        `Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`,
      );
    }

    return Math.round(amount * rate);
  }

  /**
   * 価格比較用の正規化
   */
  normalizeForComparison(prices: NormalizedPrice[]): NormalizedPrice[] {
    return prices.map((price) => ({
      ...price,
      // サブスクリプション割引を適用
      totalPrice:
        price.isSubscription && price.subscriptionDiscount
          ? Math.round(price.totalPrice * (1 - price.subscriptionDiscount))
          : price.totalPrice,
    }));
  }

  /**
   * 在庫状況の正規化
   */
  normalizeStockStatus(product: RakutenProduct | YahooProduct): {
    inStock: boolean;
    stockLevel?: "high" | "medium" | "low" | "out_of_stock";
    estimatedRestockDate?: string;
  } {
    if ("availability" in product) {
      // 楽天商品
      return {
        inStock: product.availability === 1,
        stockLevel: product.availability === 1 ? "high" : "out_of_stock",
      };
    } else {
      // Yahoo!商品
      return {
        inStock: product.inStock,
        stockLevel: product.inStock ? "high" : "out_of_stock",
      };
    }
  }

  /**
   * バルク割引の検出と適用
   */
  detectBulkDiscounts(productName: string): Array<{
    quantity: number;
    discountRate: number;
  }> {
    const bulkDiscounts: Array<{ quantity: number; discountRate: number }> = [];

    // バルク割引パターンの検出
    const patterns = [
      /(\d+)個以上で(\d+)%\s*(?:off|オフ|割引)/gi,
      /(\d+)個セットで(\d+)%\s*(?:off|オフ|割引)/gi,
      /まとめ買い(\d+)個で(\d+)%\s*(?:off|オフ|割引)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(productName)) !== null) {
        const quantity = parseInt(match[1]);
        const discountRate = parseInt(match[2]) / 100;

        bulkDiscounts.push({ quantity, discountRate });
      }
    }

    return bulkDiscounts.sort((a, b) => a.quantity - b.quantity);
  }

  /**
   * 価格の妥当性検証
   */
  validatePrice(price: NormalizedPrice): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 基本価格の検証
    if (price.basePrice <= 0) {
      errors.push("基本価格が0以下です");
    }

    if (price.basePrice > 1000000) {
      warnings.push("基本価格が異常に高額です（100万円超）");
    }

    // 送料の検証
    if (price.shippingCost < 0) {
      errors.push("送料が負の値です");
    }

    if (price.shippingCost > 10000) {
      warnings.push("送料が異常に高額です（1万円超）");
    }

    // 合計価格の検証
    if (
      Math.abs(price.totalPrice - (price.basePrice + price.shippingCost)) > 1
    ) {
      errors.push("合計価格の計算が正しくありません");
    }

    // サブスクリプション割引の検証
    if (price.isSubscription && price.subscriptionDiscount) {
      if (price.subscriptionDiscount < 0 || price.subscriptionDiscount > 1) {
        errors.push("サブスクリプション割引率が無効です（0-1の範囲外）");
      }
    }

    // 通貨の検証
    if (price.currency !== "JPY") {
      warnings.push("JPY以外の通貨が設定されています");
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * 価格履歴との比較
   */
  compareWithHistory(
    currentPrice: NormalizedPrice,
    historicalPrices: NormalizedPrice[],
  ): {
    trend: "rising" | "falling" | "stable";
    changePercentage: number;
    isLowestPrice: boolean;
    isHighestPrice: boolean;
    averagePrice: number;
  } {
    if (historicalPrices.length === 0) {
      return {
        trend: "stable",
        changePercentage: 0,
        isLowestPrice: true,
        isHighestPrice: true,
        averagePrice: currentPrice.totalPrice,
      };
    }

    const prices = historicalPrices.map((p) => p.totalPrice);
    const lastPrice = prices[prices.length - 1];
    const changePercentage =
      ((currentPrice.totalPrice - lastPrice) / lastPrice) * 100;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const averagePrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;

    let trend: "rising" | "falling" | "stable" = "stable";
    if (changePercentage > 5) {
      trend = "rising";
    } else if (changePercentage < -5) {
      trend = "falling";
    }

    return {
      trend,
      changePercentage: Math.round(changePercentage * 100) / 100,
      isLowestPrice: currentPrice.totalPrice <= minPrice,
      isHighestPrice: currentPrice.totalPrice >= maxPrice,
      averagePrice: Math.round(averagePrice),
    };
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig: Partial<PriceNormalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 設定の取得
   */
  getConfig(): PriceNormalizationConfig {
    return { ...this.config };
  }
}

/**
 * デフォルトの価格正規化インスタンス
 */
export function createPriceNormalizer(
  config?: Partial<PriceNormalizationConfig>,
): PriceNormalizer {
  return new PriceNormalizer(config);
}
