/**
 * Compliance Checker for A11y Testing
 * 薬機法準拠チェッカー（テスト用簡易版）
 */

export interface ComplianceViolation {
  pattern: string;
  match: string;
  suggestion: string;
  position: {
    start: number;
    end: number;
  };
}

export class ComplianceChecker {
  checkText(text: string): ComplianceViolation[] {
    // 簡易版：基本的な禁止表現のみチェック
    const violations: ComplianceViolation[] = [];
    const prohibitedTerms = ["治療", "治る", "薬"];

    prohibitedTerms.forEach((term) => {
      const index = text.indexOf(term);
      if (index !== -1) {
        violations.push({
          pattern: term,
          match: term,
          suggestion: "サポート",
          position: {
            start: index,
            end: index + term.length,
          },
        });
      }
    });

    return violations;
  }
}

export const defaultComplianceChecker = new ComplianceChecker();
