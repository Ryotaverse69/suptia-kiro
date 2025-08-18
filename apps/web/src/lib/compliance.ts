// Note: fs operations are moved to server-side only functions

export interface ComplianceRule {
  pattern: string;
  suggest: string;
}

export interface ComplianceRules {
  ng: ComplianceRule[];
}

export interface ComplianceViolation {
  pattern: string;
  match: string;
  suggestion: string;
  position: {
    start: number;
    end: number;
  };
}

export interface ComplianceChecker {
  checkText(text: string): ComplianceViolation[];
  loadRules(): ComplianceRules;
  suggestAlternatives(text: string): string;
}

class ComplianceCheckerImpl implements ComplianceChecker {
  private rules: ComplianceRules | null = null;

  constructor() {
    // Initialize with default rules for client-side usage
    this.rules = {
      ng: [
        { pattern: "治療", suggest: "サポート" },
        { pattern: "治る", suggest: "健康維持に役立つ" },
        { pattern: "効果", suggest: "働き" },
        { pattern: "薬", suggest: "サプリメント" },
        { pattern: "病気", suggest: "健康状態" },
        { pattern: "症状", suggest: "体調" },
      ],
    };
  }

  /**
   * rules.jsonファイルを動的に読み込む（サーバーサイドでのみ使用）
   */
  loadRules(): ComplianceRules {
    if (!this.rules) {
      // Fallback to default rules if not loaded
      this.rules = {
        ng: [
          { pattern: "治療", suggest: "サポート" },
          { pattern: "治る", suggest: "健康維持に役立つ" },
          { pattern: "効果", suggest: "働き" },
          { pattern: "薬", suggest: "サプリメント" },
          { pattern: "病気", suggest: "健康状態" },
          { pattern: "症状", suggest: "体調" },
        ],
      };
    }
    return this.rules;
  }

  /**
   * テキストをチェックしてコンプライアンス違反を検出
   */
  checkText(text: string): ComplianceViolation[] {
    if (!text || typeof text !== "string") {
      return [];
    }

    try {
      const rules = this.loadRules();
      const violations: ComplianceViolation[] = [];

      for (const rule of rules.ng) {
        try {
          const regex = new RegExp(rule.pattern, "gi");
          let match;

          while ((match = regex.exec(text)) !== null) {
            violations.push({
              pattern: rule.pattern,
              match: match[0],
              suggestion: rule.suggest,
              position: {
                start: match.index,
                end: match.index + match[0].length,
              },
            });

            // 無限ループを防ぐ
            if (regex.lastIndex === match.index) {
              regex.lastIndex++;
            }
          }
        } catch (patternError) {
          console.warn(`Invalid regex pattern: ${rule.pattern}`, patternError);
          continue;
        }
      }

      // 位置順でソート
      return violations.sort((a, b) => a.position.start - b.position.start);
    } catch (error) {
      console.error("Error checking text for compliance violations:", error);
      return [];
    }
  }

  /**
   * テキストの代替案を提案
   */
  suggestAlternatives(text: string): string {
    if (!text || typeof text !== "string") {
      return text;
    }

    try {
      const violations = this.checkText(text);
      let result = text;

      // 後ろから前に向かって置換（位置がずれないように）
      for (let i = violations.length - 1; i >= 0; i--) {
        const violation = violations[i];
        const before = result.substring(0, violation.position.start);
        const after = result.substring(violation.position.end);
        result = before + violation.suggestion + after;
      }

      return result;
    } catch (error) {
      console.error("Error suggesting alternatives:", error);
      return text;
    }
  }
}

// シングルトンインスタンス
let complianceCheckerInstance: ComplianceChecker | null = null;

/**
 * ComplianceCheckerのシングルトンインスタンスを取得
 */
export function getComplianceChecker(rulesPath?: string): ComplianceChecker {
  if (!complianceCheckerInstance) {
    complianceCheckerInstance = new ComplianceCheckerImpl();
  }
  return complianceCheckerInstance;
}

/**
 * テキストをチェックする便利関数
 */
export function checkText(text: string): ComplianceViolation[] {
  return getComplianceChecker().checkText(text);
}

/**
 * 代替案を提案する便利関数
 */
export function suggestAlternatives(text: string): string {
  return getComplianceChecker().suggestAlternatives(text);
}

/**
 * ルールを読み込む便利関数
 */
export function loadRules(): ComplianceRules {
  return getComplianceChecker().loadRules();
}

/**
 * サンプル商品説明を生成する関数
 */
export function generateSampleDescription(productName: string): string {
  return `${productName}は、日々の健康維持をサポートするサプリメントです。バランスの取れた食事と適度な運動と併せてお役立てください。個人差がありますので、体調に合わせてご利用ください。`;
}

/**
 * コンプライアンスチェック関数
 */
export function checkCompliance(text: string): ComplianceViolation[] {
  return getComplianceChecker().checkText(text);
}
