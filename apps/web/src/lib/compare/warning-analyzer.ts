/**
 * 製品比較における警告分析ロジック
 * 警告の重要度分析、カテゴリ分類、最重要警告の特定を行う
 */

export interface Warning {
  id: string;
  type: "critical" | "warning" | "info";
  category: string;
  message: string;
  severity: number; // 1-10 (10が最も重要)
  productId: string;
}

export interface WarningAnalysis {
  totalWarnings: number;
  criticalWarnings: Warning[];
  mostImportantWarning?: Warning;
  warningsByProduct: Record<string, Warning[]>;
  warningsByCategory: Record<string, Warning[]>;
  severitySummary: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface Product {
  id: string;
  name: string;
  warnings: Warning[];
}

/**
 * 警告分析器クラス
 * 製品の警告データを分析し、比較表示用の情報を生成する
 */
export class WarningAnalyzer {
  /**
   * 製品リストの警告を分析する
   */
  analyzeWarnings(products: Product[]): WarningAnalysis {
    const allWarnings = products.flatMap((product) => product.warnings);

    const warningsByProduct = this.groupWarningsByProduct(products);
    const warningsByCategory = this.groupWarningsByCategory(allWarnings);
    const criticalWarnings = this.filterCriticalWarnings(allWarnings);
    const mostImportantWarning = this.findMostImportantWarning(allWarnings);
    const severitySummary = this.calculateSeveritySummary(allWarnings);

    return {
      totalWarnings: allWarnings.length,
      criticalWarnings,
      mostImportantWarning,
      warningsByProduct,
      warningsByCategory,
      severitySummary,
    };
  }

  /**
   * 最も重要な警告を特定する
   * 重要度スコア（severity）が最も高い警告を返す
   */
  findMostImportantWarning(warnings: Warning[]): Warning | undefined {
    if (warnings.length === 0) return undefined;

    return warnings.reduce((most, current) => {
      // 重要度が同じ場合は、タイプの優先度で判定
      if (current.severity === most.severity) {
        const typeOrder = { critical: 3, warning: 2, info: 1 };
        return typeOrder[current.type] > typeOrder[most.type] ? current : most;
      }
      return current.severity > most.severity ? current : most;
    });
  }

  /**
   * 警告をカテゴリ別にグループ化する
   */
  groupWarningsByCategory(warnings: Warning[]): Record<string, Warning[]> {
    return warnings.reduce(
      (groups, warning) => {
        const category = warning.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(warning);
        return groups;
      },
      {} as Record<string, Warning[]>,
    );
  }

  /**
   * 警告を製品別にグループ化する
   */
  private groupWarningsByProduct(
    products: Product[],
  ): Record<string, Warning[]> {
    return products.reduce(
      (groups, product) => {
        groups[product.id] = product.warnings;
        return groups;
      },
      {} as Record<string, Warning[]>,
    );
  }

  /**
   * 重要度の高い警告（critical）をフィルタリングする
   */
  private filterCriticalWarnings(warnings: Warning[]): Warning[] {
    return warnings.filter((warning) => warning.type === "critical");
  }

  /**
   * 警告の重要度別サマリーを計算する
   */
  private calculateSeveritySummary(
    warnings: Warning[],
  ): WarningAnalysis["severitySummary"] {
    return warnings.reduce(
      (summary, warning) => {
        summary[warning.type]++;
        return summary;
      },
      { critical: 0, warning: 0, info: 0 },
    );
  }

  /**
   * 警告の重要度スコアを計算する
   * 製品全体の警告リスクレベルを数値化
   */
  calculateWarningSeverityScore(warnings: Warning[]): number {
    if (warnings.length === 0) return 0;

    const totalScore = warnings.reduce((sum, warning) => {
      // タイプ別の重み付け
      const typeWeight = { critical: 3, warning: 2, info: 1 };
      return sum + warning.severity * typeWeight[warning.type];
    }, 0);

    // 平均スコアを返す（0-30の範囲）
    return Math.round(totalScore / warnings.length);
  }

  /**
   * 製品間での警告比較情報を生成する
   */
  compareWarningsBetweenProducts(products: Product[]): {
    safestProduct?: Product;
    riskiestProduct?: Product;
    warningCounts: Record<string, number>;
  } {
    if (products.length === 0) {
      return { warningCounts: {} };
    }

    const warningCounts = products.reduce(
      (counts, product) => {
        counts[product.id] = product.warnings.length;
        return counts;
      },
      {} as Record<string, number>,
    );

    const safestProduct = products.reduce((safest, current) =>
      current.warnings.length < safest.warnings.length ? current : safest,
    );

    const riskiestProduct = products.reduce((riskiest, current) =>
      current.warnings.length > riskiest.warnings.length ? current : riskiest,
    );

    return {
      safestProduct:
        safestProduct.warnings.length < riskiestProduct.warnings.length
          ? safestProduct
          : undefined,
      riskiestProduct:
        riskiestProduct.warnings.length > safestProduct.warnings.length
          ? riskiestProduct
          : undefined,
      warningCounts,
    };
  }
}

/**
 * デフォルトの警告分析器インスタンス
 */
export const warningAnalyzer = new WarningAnalyzer();

/**
 * 警告分析のヘルパー関数
 */
export function analyzeProductWarnings(products: Product[]): WarningAnalysis {
  return warningAnalyzer.analyzeWarnings(products);
}

export function findMostImportantWarning(
  warnings: Warning[],
): Warning | undefined {
  return warningAnalyzer.findMostImportantWarning(warnings);
}

export function groupWarningsByCategory(
  warnings: Warning[],
): Record<string, Warning[]> {
  return warningAnalyzer.groupWarningsByCategory(warnings);
}

export function calculateWarningSeverityScore(warnings: Warning[]): number {
  return warningAnalyzer.calculateWarningSeverityScore(warnings);
}
