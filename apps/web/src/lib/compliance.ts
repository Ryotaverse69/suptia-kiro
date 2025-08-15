import { readFileSync } from "fs";
import { join } from "path";

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
  private rulesPath: string;

  constructor(rulesPath?: string) {
    // デフォルトのパスを設定（プロジェクトルートからの相対パス）
    this.rulesPath =
      rulesPath || join(process.cwd(), "tools/phrase-checker/rules.json");
  }

  /**
   * rules.jsonファイルを動的に読み込む
   */
  loadRules(): ComplianceRules {
    try {
      if (!this.rules) {
        const rulesContent = readFileSync(this.rulesPath, "utf-8");
        this.rules = JSON.parse(rulesContent) as ComplianceRules;
      }
      return this.rules;
    } catch (error) {
      throw new Error(
        `Failed to load rules from ${this.rulesPath}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
    complianceCheckerInstance = new ComplianceCheckerImpl(rulesPath);
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
