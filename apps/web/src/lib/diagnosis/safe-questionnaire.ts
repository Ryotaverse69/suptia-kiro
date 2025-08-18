/**
 * Safe Questionnaire for A11y Testing
 * 薬機法準拠の安全な質問フロー（テスト用簡易版）
 */

export interface SafeQuestion {
  id: string;
  text: string;
  type: "single" | "multiple" | "scale" | "boolean";
  options?: string[];
  required: boolean;
  helpText?: string;
  validationRules?: {
    min?: number;
    max?: number;
  };
}

export interface SafeQuestionnaireResponse {
  questionId: string;
  answer: any;
  timestamp: string;
}

export interface SafeRecommendationCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export const SAFE_QUESTIONS: SafeQuestion[] = [
  {
    id: "age_group",
    text: "年齢層を教えてください",
    type: "single",
    options: ["20代", "30代", "40代", "50代", "60代以上"],
    required: true,
  },
  {
    id: "lifestyle",
    text: "普段の生活スタイルはどれに近いですか？",
    type: "single",
    options: [
      "デスクワーク中心",
      "立ち仕事中心",
      "運動習慣あり",
      "不規則な生活",
    ],
    required: true,
  },
];

export class SafeQuestionnaireAnalyzer {
  validateResponse(
    questionId: string,
    value: any,
  ): { isValid: boolean; error?: string } {
    if (!value) {
      return { isValid: false, error: "回答を選択してください" };
    }
    return { isValid: true };
  }

  analyzeResponses(
    responses: SafeQuestionnaireResponse[],
  ): SafeRecommendationCategory[] {
    return [
      {
        id: "general_health",
        name: "総合的な健康サポート",
        description: "バランスの取れた栄養サポートをおすすめします",
        keywords: ["マルチビタミン", "ミネラル", "基本栄養素"],
      },
    ];
  }
}

export const questionnaireUtils = {
  // ユーティリティ関数（必要に応じて実装）
};
