"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { WarningBanner, type WarningType, type WarningSeverity } from "./WarningBanner";
import { checkText, type ComplianceResult } from "../lib/compliance";
import { checkPersonaRules, type PersonaCheckResult } from "../lib/persona-rules";

// 商品の型定義（Sanityスキーマに基づく）
interface Product {
  _id?: string;
  name?: string;
  description?: string;
  ingredients?: Array<{
    ingredient: {
      name?: string;
    } | string;
    amountMgPerServing?: number;
  }>;
  warnings?: string[];
}

// PersonaWarningsコンポーネントのプロパティ
export interface PersonaWarningsProps {
  product: Product;
  userPersona?: string[];
  onWarningDismiss?: (warningId: string) => void;
  className?: string;
}

// 警告の状態管理用インターフェース
interface WarningState {
  complianceWarnings: ComplianceResult;
  personaWarnings: PersonaCheckResult;
  dismissedWarnings: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// 統合された警告アイテム
interface CombinedWarning {
  id: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  suggestion?: string;
  priority: number; // ソート用の優先度
}

/**
 * PersonaWarnings Container Component
 * 
 * コンプライアンスチェックとペルソナルールチェックを統合し、
 * 優先度順に警告を表示するコンテナコンポーネント
 * 
 * Requirements: 1.4, 2.4, 4.1, 6.4
 */
export function PersonaWarnings({
  product,
  userPersona = [],
  onWarningDismiss,
  className = "",
}: PersonaWarningsProps) {
  // 警告状態の管理
  const [warningState, setWarningState] = useState<WarningState>({
    complianceWarnings: { hasViolations: false, violations: [] },
    personaWarnings: { hasWarnings: false, warnings: [] },
    dismissedWarnings: new Set<string>(),
    isLoading: false,
    error: null,
  });

  // 警告チェックの実行
  const performWarningChecks = useCallback(async () => {
    if (!product) {
      return;
    }

    setWarningState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 商品テキストの抽出
      const productText = extractProductText(product);

      // 並行してコンプライアンスチェックとペルソナチェックを実行
      const [complianceResult, personaResult] = await Promise.all([
        checkText(productText).catch(error => {
          console.error('Compliance check failed:', error);
          return { hasViolations: false, violations: [] };
        }),
        Promise.resolve(checkPersonaRules(product as any, userPersona)).catch(error => {
          console.error('Persona check failed:', error);
          return { hasWarnings: false, warnings: [] };
        })
      ]);

      setWarningState(prev => ({
        ...prev,
        complianceWarnings: complianceResult,
        personaWarnings: personaResult,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Warning checks failed:', error);
      setWarningState(prev => ({
        ...prev,
        error: '警告チェックを実行できませんでした',
        isLoading: false,
      }));
    }
  }, [product, userPersona]);

  // 商品またはペルソナが変更された時に警告チェックを実行
  useEffect(() => {
    performWarningChecks();
  }, [performWarningChecks]);

  // 警告の解除処理
  const handleWarningDismiss = useCallback((warningId: string) => {
    setWarningState(prev => {
      const newDismissedWarnings = new Set(prev.dismissedWarnings);
      newDismissedWarnings.add(warningId);
      return {
        ...prev,
        dismissedWarnings: newDismissedWarnings
      };
    });

    // 親コンポーネントに通知
    if (onWarningDismiss) {
      onWarningDismiss(warningId);
    }
  }, [onWarningDismiss]);

  // 統合された警告リストの生成（メモ化）
  const combinedWarnings = useMemo(() => {
    const warnings: CombinedWarning[] = [];

    // コンプライアンス警告の追加
    if (warningState.complianceWarnings.hasViolations) {
      warningState.complianceWarnings.violations.forEach((violation, index) => {
        const warningId = `compliance-${index}`;
        
        if (!warningState.dismissedWarnings.has(warningId)) {
          warnings.push({
            id: warningId,
            type: 'compliance',
            severity: mapComplianceSeverity(violation.severity),
            message: `「${violation.originalText}」という表現について注意が必要です`,
            suggestion: violation.suggestedText,
            priority: getSeverityPriority(mapComplianceSeverity(violation.severity))
          });
        }
      });
    }

    // ペルソナ警告の追加
    if (warningState.personaWarnings.hasWarnings) {
      warningState.personaWarnings.warnings.forEach((warning, index) => {
        const warningId = `persona-${warning.ruleId}-${index}`;
        
        if (!warningState.dismissedWarnings.has(warningId)) {
          warnings.push({
            id: warningId,
            type: 'persona',
            severity: mapPersonaSeverity(warning.severity),
            message: warning.message,
            suggestion: warning.action,
            priority: getSeverityPriority(mapPersonaSeverity(warning.severity))
          });
        }
      });
    }

    // 優先度順にソート（高い優先度が先頭）
    return warnings.sort((a, b) => b.priority - a.priority);
  }, [warningState.complianceWarnings, warningState.personaWarnings, warningState.dismissedWarnings]);

  // エラー境界の処理
  if (warningState.error) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <p className="text-sm text-gray-600">
          {warningState.error}
        </p>
      </div>
    );
  }

  // ローディング状態
  if (warningState.isLoading) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <p className="text-sm text-gray-600">
          警告をチェック中...
        </p>
      </div>
    );
  }

  // 警告がない場合は何も表示しない
  if (combinedWarnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {combinedWarnings.map((warning) => (
        <WarningBanner
          key={warning.id}
          type={warning.type}
          severity={warning.severity}
          message={warning.message}
          suggestion={warning.suggestion}
          onDismiss={() => handleWarningDismiss(warning.id)}
        />
      ))}
    </div>
  );
}

/**
 * 商品から検索可能なテキストを抽出
 */
function extractProductText(product: Product): string {
  if (!product) {
    return '';
  }

  const textParts: string[] = [];

  // 商品名と説明を追加
  if (product.name) {
    textParts.push(product.name);
  }

  if (product.description) {
    textParts.push(product.description);
  }

  // 成分名を追加（Sanityスキーマに合わせて調整）
  if (product.ingredients && Array.isArray(product.ingredients)) {
    product.ingredients.forEach(ingredientItem => {
      if (ingredientItem && ingredientItem.ingredient) {
        // Sanityの参照型の場合、nameプロパティを確認
        if (typeof ingredientItem.ingredient === 'object' && ingredientItem.ingredient.name) {
          textParts.push(ingredientItem.ingredient.name);
        } else if (typeof ingredientItem.ingredient === 'string') {
          textParts.push(ingredientItem.ingredient);
        }
      }
    });
  }

  // 警告事項も含める
  if (product.warnings && Array.isArray(product.warnings)) {
    textParts.push(...product.warnings);
  }

  return textParts.join(' ');
}

/**
 * コンプライアンス警告の重要度をWarningBannerの形式にマッピング
 */
function mapComplianceSeverity(severity?: string): WarningSeverity {
  switch (severity) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    default:
      return 'medium'; // コンプライアンス違反はデフォルトでmedium
  }
}

/**
 * ペルソナ警告の重要度をWarningBannerの形式にマッピング
 */
function mapPersonaSeverity(severity: 'low' | 'mid' | 'high'): WarningSeverity {
  switch (severity) {
    case 'high':
      return 'high';
    case 'mid':
      return 'medium';
    case 'low':
    default:
      return 'low';
  }
}

/**
 * 重要度を数値の優先度に変換（ソート用）
 */
function getSeverityPriority(severity: WarningSeverity): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

// エラー境界コンポーネント
export class PersonaWarningsErrorBoundary extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'PersonaWarningsError';
  }
}

// 型定義のエクスポート
export type { WarningState };