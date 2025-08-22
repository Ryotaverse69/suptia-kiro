/**
 * Product Price Matcher
 * 複数ソースからの商品マッチング機能
 * GTIN/JAN優先、容量一致必須のフォールバック
 */

import type { RakutenProduct } from "./rakuten-connector";
import type { YahooProduct } from "./yahoo-connector";

export interface ProductInfo {
  id: string;
  name: string;
  brand: string;
  gtin?: string;
  jan?: string;
  capacity: {
    amount: number;
    unit: string;
    servingsPerContainer?: number;
  };
  category: string;
  description?: string;
}

export interface ProductMatch {
  productId: string;
  source: "rakuten" | "yahoo";
  sourceProductId: string;
  confidence: number; // 0-1
  matchType: "gtin" | "jan" | "name_capacity" | "name_brand" | "fuzzy";
  product: RakutenProduct | YahooProduct;
  matchDetails: {
    gtinMatch?: boolean;
    janMatch?: boolean;
    nameMatch?: number; // similarity score 0-1
    brandMatch?: boolean;
    capacityMatch?: boolean;
    categoryMatch?: boolean;
  };
}

export interface MatchingResult {
  productInfo: ProductInfo;
  matches: ProductMatch[];
  bestMatches: ProductMatch[];
  confidence: {
    overall: number;
    bySource: Record<string, number>;
  };
  warnings: string[];
}

export class ProductMatcher {
  private readonly CONFIDENCE_THRESHOLDS = {
    GTIN_MATCH: 1.0,
    JAN_MATCH: 1.0,
    HIGH_CONFIDENCE: 0.9,
    MEDIUM_CONFIDENCE: 0.7,
    LOW_CONFIDENCE: 0.6,
    MINIMUM_ACCEPTABLE: 0.6,
  };

  private readonly MATCH_WEIGHTS = {
    GTIN: 1.0,
    JAN: 1.0,
    NAME: 0.4,
    BRAND: 0.3,
    CAPACITY: 0.2,
    CATEGORY: 0.1,
  };

  /**
   * GTIN優先マッチング
   */
  async matchByGTIN(
    productInfo: ProductInfo,
    rakutenProducts: RakutenProduct[],
    yahooProducts: YahooProduct[],
  ): Promise<ProductMatch[]> {
    if (!productInfo.gtin) {
      return [];
    }

    const matches: ProductMatch[] = [];

    // 楽天でGTINマッチング
    for (const rakutenProduct of rakutenProducts) {
      if (rakutenProduct.gtin === productInfo.gtin) {
        matches.push({
          productId: productInfo.id,
          source: "rakuten",
          sourceProductId: rakutenProduct.itemCode,
          confidence: this.CONFIDENCE_THRESHOLDS.GTIN_MATCH,
          matchType: "gtin",
          product: rakutenProduct,
          matchDetails: {
            gtinMatch: true,
            nameMatch: this.calculateNameSimilarity(
              productInfo.name,
              rakutenProduct.itemName,
            ),
            brandMatch: this.isBrandMatch(
              productInfo.brand,
              rakutenProduct.shopName,
            ),
            capacityMatch: this.isCapacityMatch(
              productInfo.capacity,
              this.extractCapacityFromName(rakutenProduct.itemName),
            ),
          },
        });
      }
    }

    // Yahoo!でGTINマッチング
    for (const yahooProduct of yahooProducts) {
      if (yahooProduct.gtin === productInfo.gtin) {
        matches.push({
          productId: productInfo.id,
          source: "yahoo",
          sourceProductId: yahooProduct.code,
          confidence: this.CONFIDENCE_THRESHOLDS.GTIN_MATCH,
          matchType: "gtin",
          product: yahooProduct,
          matchDetails: {
            gtinMatch: true,
            nameMatch: this.calculateNameSimilarity(
              productInfo.name,
              yahooProduct.name,
            ),
            brandMatch: this.isBrandMatch(
              productInfo.brand,
              yahooProduct.seller.name,
            ),
            capacityMatch: this.isCapacityMatch(
              productInfo.capacity,
              this.extractCapacityFromName(yahooProduct.name),
            ),
          },
        });
      }
    }

    return matches;
  }

  /**
   * JAN優先マッチング
   */
  async matchByJAN(
    productInfo: ProductInfo,
    rakutenProducts: RakutenProduct[],
    yahooProducts: YahooProduct[],
  ): Promise<ProductMatch[]> {
    if (!productInfo.jan) {
      return [];
    }

    const matches: ProductMatch[] = [];

    // 楽天でJANマッチング
    for (const rakutenProduct of rakutenProducts) {
      if (rakutenProduct.jan === productInfo.jan) {
        matches.push({
          productId: productInfo.id,
          source: "rakuten",
          sourceProductId: rakutenProduct.itemCode,
          confidence: this.CONFIDENCE_THRESHOLDS.JAN_MATCH,
          matchType: "jan",
          product: rakutenProduct,
          matchDetails: {
            janMatch: true,
            nameMatch: this.calculateNameSimilarity(
              productInfo.name,
              rakutenProduct.itemName,
            ),
            brandMatch: this.isBrandMatch(
              productInfo.brand,
              rakutenProduct.shopName,
            ),
            capacityMatch: this.isCapacityMatch(
              productInfo.capacity,
              this.extractCapacityFromName(rakutenProduct.itemName),
            ),
          },
        });
      }
    }

    // Yahoo!でJANマッチング
    for (const yahooProduct of yahooProducts) {
      if (yahooProduct.jan === productInfo.jan) {
        matches.push({
          productId: productInfo.id,
          source: "yahoo",
          sourceProductId: yahooProduct.code,
          confidence: this.CONFIDENCE_THRESHOLDS.JAN_MATCH,
          matchType: "jan",
          product: yahooProduct,
          matchDetails: {
            janMatch: true,
            nameMatch: this.calculateNameSimilarity(
              productInfo.name,
              yahooProduct.name,
            ),
            brandMatch: this.isBrandMatch(
              productInfo.brand,
              yahooProduct.seller.name,
            ),
            capacityMatch: this.isCapacityMatch(
              productInfo.capacity,
              this.extractCapacityFromName(yahooProduct.name),
            ),
          },
        });
      }
    }

    return matches;
  }

  /**
   * 商品名・容量マッチング（フォールバック）
   */
  async matchByNameAndCapacity(
    productInfo: ProductInfo,
    rakutenProducts: RakutenProduct[],
    yahooProducts: YahooProduct[],
  ): Promise<ProductMatch[]> {
    const matches: ProductMatch[] = [];

    // 楽天で名前・容量マッチング
    for (const rakutenProduct of rakutenProducts) {
      const nameMatch = this.calculateNameSimilarity(
        productInfo.name,
        rakutenProduct.itemName,
      );
      const brandMatch = this.isBrandMatch(
        productInfo.brand,
        rakutenProduct.shopName,
      );
      const capacityMatch = this.isCapacityMatch(
        productInfo.capacity,
        this.extractCapacityFromName(rakutenProduct.itemName),
      );

      // 容量一致が必須
      if (capacityMatch && nameMatch >= 0.5) {
        const confidence = this.calculateOverallConfidence({
          nameMatch,
          brandMatch,
          capacityMatch,
        });

        if (confidence >= this.CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE) {
          matches.push({
            productId: productInfo.id,
            source: "rakuten",
            sourceProductId: rakutenProduct.itemCode,
            confidence,
            matchType: "name_capacity",
            product: rakutenProduct,
            matchDetails: {
              nameMatch,
              brandMatch,
              capacityMatch,
            },
          });
        }
      }
    }

    // Yahoo!で名前・容量マッチング
    for (const yahooProduct of yahooProducts) {
      const nameMatch = this.calculateNameSimilarity(
        productInfo.name,
        yahooProduct.name,
      );
      const brandMatch = this.isBrandMatch(
        productInfo.brand,
        yahooProduct.seller.name,
      );
      const capacityMatch = this.isCapacityMatch(
        productInfo.capacity,
        this.extractCapacityFromName(yahooProduct.name),
      );

      // 容量一致が必須
      if (capacityMatch && nameMatch >= 0.5) {
        const confidence = this.calculateOverallConfidence({
          nameMatch,
          brandMatch,
          capacityMatch,
        });

        if (confidence >= this.CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE) {
          matches.push({
            productId: productInfo.id,
            source: "yahoo",
            sourceProductId: yahooProduct.code,
            confidence,
            matchType: "name_capacity",
            product: yahooProduct,
            matchDetails: {
              nameMatch,
              brandMatch,
              capacityMatch,
            },
          });
        }
      }
    }

    return matches;
  }

  /**
   * 統合マッチング処理
   */
  async matchProduct(
    productInfo: ProductInfo,
    rakutenProducts: RakutenProduct[],
    yahooProducts: YahooProduct[],
  ): Promise<MatchingResult> {
    const allMatches: ProductMatch[] = [];
    const warnings: string[] = [];

    // 1. GTIN優先マッチング
    const gtinMatches = await this.matchByGTIN(
      productInfo,
      rakutenProducts,
      yahooProducts,
    );
    allMatches.push(...gtinMatches);

    // 2. JAN優先マッチング（GTINマッチがない場合）
    if (gtinMatches.length === 0) {
      const janMatches = await this.matchByJAN(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );
      allMatches.push(...janMatches);
    }

    // 3. 名前・容量マッチング（GTIN/JANマッチがない場合）
    if (allMatches.length === 0) {
      const nameCapacityMatches = await this.matchByNameAndCapacity(
        productInfo,
        rakutenProducts,
        yahooProducts,
      );
      allMatches.push(...nameCapacityMatches);

      if (nameCapacityMatches.length === 0) {
        warnings.push(
          "GTIN/JAN/名前・容量での一致する商品が見つかりませんでした",
        );
      }
    }

    // 4. 信頼度でソート
    allMatches.sort((a, b) => b.confidence - a.confidence);

    // 5. 最高信頼度のマッチを選択
    const bestMatches = this.selectBestMatches(allMatches);

    // 6. 信頼度が低い場合の警告
    const lowConfidenceMatches = allMatches.filter(
      (match) =>
        match.confidence < this.CONFIDENCE_THRESHOLDS.MEDIUM_CONFIDENCE,
    );
    if (lowConfidenceMatches.length > 0) {
      warnings.push(
        `信頼度が低いマッチが${lowConfidenceMatches.length}件あります`,
      );
    }

    // 7. 全体信頼度計算
    const overallConfidence = this.calculateOverallMatchConfidence(bestMatches);
    const confidenceBySource = this.calculateConfidenceBySource(bestMatches);

    return {
      productInfo,
      matches: allMatches,
      bestMatches,
      confidence: {
        overall: overallConfidence,
        bySource: confidenceBySource,
      },
      warnings,
    };
  }

  /**
   * 商品名類似度計算（Levenshtein距離ベース）
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = this.normalizeProductName(name1);
    const normalized2 = this.normalizeProductName(name2);

    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * 商品名正規化
   */
  private normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[【】\[\]（）()]/g, "") // 括弧除去
      .replace(/\s+/g, "") // 空白除去
      .replace(/[・･]/g, "") // 中点除去
      .trim();
  }

  /**
   * Levenshtein距離計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * ブランドマッチング
   */
  private isBrandMatch(brand1: string, brand2: string): boolean {
    const normalized1 = brand1.toLowerCase().trim();
    const normalized2 = brand2.toLowerCase().trim();

    return (
      normalized1.includes(normalized2) || normalized2.includes(normalized1)
    );
  }

  /**
   * 容量マッチング
   */
  private isCapacityMatch(
    capacity1: ProductInfo["capacity"],
    capacity2: ProductInfo["capacity"] | null,
  ): boolean {
    if (!capacity2) return false;

    // 単位が異なる場合は一致しない
    if (capacity1.unit !== capacity2.unit) return false;

    // 容量の許容誤差（±10%）
    const tolerance = 0.1;
    const diff =
      Math.abs(capacity1.amount - capacity2.amount) / capacity1.amount;

    return diff <= tolerance;
  }

  /**
   * 商品名から容量情報を抽出
   */
  private extractCapacityFromName(
    productName: string,
  ): ProductInfo["capacity"] | null {
    // 容量パターンマッチング
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(mg|g|kg|ml|l|粒|錠|カプセル|包)/gi,
      /(\d+(?:\.\d+)?)\s*(ミリグラム|グラム|キログラム|ミリリットル|リットル)/gi,
    ];

    for (const pattern of patterns) {
      const match = productName.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        return {
          amount,
          unit: this.normalizeUnit(unit),
        };
      }
    }

    return null;
  }

  /**
   * 単位正規化
   */
  private normalizeUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      ミリグラム: "mg",
      グラム: "g",
      キログラム: "kg",
      ミリリットル: "ml",
      リットル: "l",
      錠: "粒",
      カプセル: "粒",
    };

    return unitMap[unit] || unit;
  }

  /**
   * 総合信頼度計算
   */
  private calculateOverallConfidence(matchDetails: {
    nameMatch?: number;
    brandMatch?: boolean;
    capacityMatch?: boolean;
    gtinMatch?: boolean;
    janMatch?: boolean;
  }): number {
    let score = 0;
    let totalWeight = 0;

    if (matchDetails.gtinMatch) {
      score += this.MATCH_WEIGHTS.GTIN;
      totalWeight += this.MATCH_WEIGHTS.GTIN;
    }

    if (matchDetails.janMatch) {
      score += this.MATCH_WEIGHTS.JAN;
      totalWeight += this.MATCH_WEIGHTS.JAN;
    }

    if (matchDetails.nameMatch !== undefined) {
      score += matchDetails.nameMatch * this.MATCH_WEIGHTS.NAME;
      totalWeight += this.MATCH_WEIGHTS.NAME;
    }

    if (matchDetails.brandMatch !== undefined) {
      score += (matchDetails.brandMatch ? 1 : 0) * this.MATCH_WEIGHTS.BRAND;
      totalWeight += this.MATCH_WEIGHTS.BRAND;
    }

    if (matchDetails.capacityMatch !== undefined) {
      score +=
        (matchDetails.capacityMatch ? 1 : 0) * this.MATCH_WEIGHTS.CAPACITY;
      totalWeight += this.MATCH_WEIGHTS.CAPACITY;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * 最適マッチ選択
   */
  private selectBestMatches(matches: ProductMatch[]): ProductMatch[] {
    if (matches.length === 0) return [];

    // ソース別に最高信頼度のマッチを選択
    const bestBySource: Record<string, ProductMatch> = {};

    for (const match of matches) {
      const current = bestBySource[match.source];
      if (!current || match.confidence > current.confidence) {
        bestBySource[match.source] = match;
      }
    }

    return Object.values(bestBySource);
  }

  /**
   * 全体マッチ信頼度計算
   */
  private calculateOverallMatchConfidence(bestMatches: ProductMatch[]): number {
    if (bestMatches.length === 0) return 0;

    const totalConfidence = bestMatches.reduce(
      (sum, match) => sum + match.confidence,
      0,
    );
    return totalConfidence / bestMatches.length;
  }

  /**
   * ソース別信頼度計算
   */
  private calculateConfidenceBySource(
    bestMatches: ProductMatch[],
  ): Record<string, number> {
    const confidenceBySource: Record<string, number> = {};

    for (const match of bestMatches) {
      confidenceBySource[match.source] = match.confidence;
    }

    return confidenceBySource;
  }

  /**
   * マッチ検証
   */
  validateMatch(match: ProductMatch, productInfo: ProductInfo): boolean {
    // 最小信頼度チェック
    if (match.confidence < this.CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE) {
      return false;
    }

    // GTIN/JANマッチの場合は常に有効
    if (match.matchType === "gtin" || match.matchType === "jan") {
      return true;
    }

    // 名前・容量マッチの場合は容量一致が必須
    if (match.matchType === "name_capacity") {
      return match.matchDetails.capacityMatch === true;
    }

    return true;
  }
}
