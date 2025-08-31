// Simple compliance checker without file system dependencies

export interface ComplianceRule {
  pattern: string;
  suggest: string;
}

export interface ComplianceViolation {
  originalText: string;
  suggestedText: string;
  pattern: string;
}

export interface ComplianceResult {
  hasViolations: boolean;
  violations: ComplianceViolation[];
}

// Default rules (fallback when rules.json is not available)
const DEFAULT_RULES: ComplianceRule[] = [
  {
    pattern: "完治",
    suggest: "改善が期待される",
  },
  {
    pattern: "即効|速攻",
    suggest: "短期間での変化が報告されている",
  },
  {
    pattern: "必ず痩せる",
    suggest: "体重管理をサポートする可能性",
  },
];

/**
 * Check text for compliance violations using default rules
 */
export function checkTextSimple(text: string): ComplianceResult {
  if (!text || typeof text !== "string") {
    return {
      hasViolations: false,
      violations: [],
    };
  }

  const violations: ComplianceViolation[] = [];

  for (const rule of DEFAULT_RULES) {
    const regex = new RegExp(rule.pattern, "gi");
    const matches = text.match(regex);

    if (matches) {
      for (const match of matches) {
        violations.push({
          originalText: match,
          suggestedText: rule.suggest,
          pattern: rule.pattern,
        });
      }
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
  };
}

/**
 * Suggest alternatives for compliance violations
 */
export function suggestAlternatives(violations: ComplianceViolation[]): string[] {
  return violations.map(violation => violation.suggestedText);
}

/**
 * Generate sample product description (for demo purposes)
 */
export function generateSampleDescription(productName: string): string {
  const descriptions = [
    `${productName}は健康維持をサポートする高品質なサプリメントです。`,
    `${productName}で毎日の栄養バランスを整えましょう。`,
    `${productName}は科学的根拠に基づいて開発された製品です。`,
    `${productName}は即効性があり、必ず痩せる効果が期待できます。`, // NG表現を含む例
    `${productName}で完治を目指しましょう。`, // NG表現を含む例
  ];

  // ランダムに説明文を選択（デモ用）
  const randomIndex = Math.floor(Math.random() * descriptions.length);
  return descriptions[randomIndex];
}