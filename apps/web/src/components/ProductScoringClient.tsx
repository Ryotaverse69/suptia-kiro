'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ScoreDisplay } from './ScoreDisplay';
import { ScoreBreakdown } from './ScoreBreakdown';
import { score, type Product as ScoringProduct } from '@/lib/scoring';

/**
 * 商品データ型（Sanityスキーマに基づく）
 */
interface Product {
  _id: string;
  name: string;
  brand: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  ingredients?: Array<{
    ingredient: {
      _id: string;
      name: string;
      category?: string;
      safetyNotes?: string[];
      evidenceLevel?: 'A' | 'B' | 'C';
    };
    amountMgPerServing: number;
  }>;
  warnings?: string[];
  form?: 'capsule' | 'tablet' | 'softgel' | 'powder' | 'liquid' | 'gummy' | string;
  thirdPartyTested?: boolean;
}

/**
 * 商品データをスコアリングシステム用に変換
 * @param product Sanityから取得した商品データ
 * @returns スコアリングシステム用の商品データ
 */
function convertToScoringProduct(product: Product): ScoringProduct {
  return {
    name: product.name,
    brand: product.brand,
    priceJPY: product.priceJPY,
    servingsPerContainer: product.servingsPerContainer,
    servingsPerDay: product.servingsPerDay,
    form: product.form as ScoringProduct['form'],
    warnings: product.warnings,
    thirdPartyTested: product.thirdPartyTested,
    ingredients: product.ingredients?.map(ing => ({
      ingredient: {
        name: ing.ingredient.name,
        category: ing.ingredient.category || 'その他',
        evidenceLevel: ing.ingredient.evidenceLevel || 'C', // デフォルトはC
        safetyNotes: ing.ingredient.safetyNotes
      },
      amountMgPerServing: ing.amountMgPerServing
    })) || []
  };
}

/**
 * スコアリングシステム失敗時のフォールバックコンポーネント
 */
function ScoringSystemFallback() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-primary-800">
            スコアリングシステムを一時的に利用できません。商品の詳細情報をご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 商品スコアリングコンポーネント（クライアントサイド）
 * useMemoを使用してスコア計算をキャッシュし、パフォーマンスを最適化
 * ローディング状態とエラーハンドリングを含む
 * 
 * 要件1.1, 1.3, 5.1, 6.4, 4.4に対応
 */
export interface ProductScoringClientProps {
  /** 商品データ */
  product: Product;
  /** 追加のCSSクラス */
  className?: string;
}

export function ProductScoringClient({
  product,
  className = ''
}: ProductScoringClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // スコア計算をキャッシュ（要件5.1, 6.4）
  const scoreResult = useMemo(() => {
    try {
      setError(null);
      const scoringProduct = convertToScoringProduct(product);
      const result = score(scoringProduct);
      return result;
    } catch (error) {
      console.error('スコア計算エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'スコア計算中に予期しないエラーが発生しました';
      setError(errorMessage);
      return null;
    }
  }, [
    product.name,
    product.brand,
    product.priceJPY,
    product.servingsPerContainer,
    product.servingsPerDay,
    product.form,
    product.warnings,
    product.thirdPartyTested,
    JSON.stringify(product.ingredients) // 成分データの変更を検知
  ]);

  // ローディング状態の管理
  useEffect(() => {
    // スコア計算の完了を模擬（実際の計算は同期的だが、UIの一貫性のため）
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [scoreResult]);

  // 再試行ハンドラー
  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);

    // 再計算をトリガー（依存配列の変更により自動的に再計算される）
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* メインスコア表示 */}
      <ScoreDisplay
        scoreResult={scoreResult}
        isLoading={isLoading}
        error={error}
        className="shadow-sm"
      />

      {/* 詳細スコア分析（展開可能） */}
      {scoreResult && (
        <ScoreBreakdown
          breakdown={scoreResult.breakdown}
          weights={scoreResult.weights}
          isLoading={isLoading}
          error={error}
          className="shadow-sm"
        />
      )}

      {/* エラー時の再試行ボタン */}
      {error && !isLoading && (
        <div className="text-center">
          <button
            onClick={handleRetry}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            aria-label="スコア計算を再試行"
          >
            再試行
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductScoringClient;