'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { ScoreResult } from '@/lib/scoring';

/**
 * スコア表示コンポーネントのプロパティ
 */
export interface ScoreDisplayProps {
  /** スコア計算結果 */
  scoreResult: ScoreResult | null;
  /** 詳細表示を含めるかどうか */
  showBreakdown?: boolean;
  /** 追加のCSSクラス */
  className?: string;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  error?: string | null;
}

/**
 * スコア可視化設定
 */
interface ScoreVisualization {
  total: number;
  components: {
    evidence: number;
    safety: number;
    cost: number;
    practicality: number;
  };
  colors: {
    excellent: string; // 80-100
    good: string;      // 60-79
    fair: string;      // 40-59
    poor: string;      // 0-39
  };
}

/**
 * スコアに基づく色分けを取得
 * @param score スコア値 (0-100)
 * @returns 色分けクラス名
 */
function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-blue-600 bg-blue-100';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

/**
 * スコアレベルのテキストを取得
 * @param score スコア値 (0-100)
 * @returns スコアレベル
 */
function getScoreLevel(score: number): string {
  if (score >= 80) return '優秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '普通';
  return '要改善';
}

/**
 * プログレスバーコンポーネント
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  isAnimated?: boolean;
}

const ProgressBar = memo(function ProgressBar({ 
  value, 
  max = 100, 
  className = '', 
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  isAnimated = true
}: ProgressBarProps) {
  const percentage = useMemo(() => 
    Math.min(100, Math.max(0, (value / max) * 100)), 
    [value, max]
  );
  
  const colorClass = useMemo(() => getScoreColorClass(value), [value]);
  
  const progressBarColor = useMemo(() => {
    if (colorClass.includes('green')) return 'bg-green-500';
    if (colorClass.includes('blue')) return 'bg-blue-500';
    if (colorClass.includes('yellow')) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [colorClass]);
  
  return (
    <div 
      className={`w-full bg-gray-200 rounded-full h-3 ${className}`}
      role="group"
      aria-label="スコア表示"
    >
      <div
        className={`h-3 rounded-full ${isAnimated ? 'transition-all duration-300' : ''} ${progressBarColor}`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={Math.round(value * 10) / 10}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || `スコア: ${value.toFixed(1)}/${max}`}
        aria-describedby={ariaDescribedBy}
        tabIndex={0}
      />
    </div>
  );
});

/**
 * スケルトンローダーコンポーネント
 */
interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

const Skeleton = memo(function Skeleton({ className = '', 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-300 rounded ${className}`}
      role="status"
      aria-label={ariaLabel || "読み込み中"}
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
});

/**
 * スコア表示スケルトンコンポーネント
 */
const ScoreDisplaySkeleton = memo(function ScoreDisplaySkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} role="status" aria-label="スコア計算中">
      {/* 総合スコア表示スケルトン */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center">
          <Skeleton className="h-6 w-24 mx-auto mb-4" aria-label="総合スコアタイトル読み込み中" />
          
          {/* 大きなスコア表示スケルトン */}
          <div className="mb-4">
            <Skeleton className="h-16 w-32 mx-auto rounded-full" aria-label="総合スコア値読み込み中" />
            <Skeleton className="h-4 w-16 mx-auto mt-2" aria-label="スコアレベル読み込み中" />
          </div>
          
          {/* 総合スコアプログレスバースケルトン */}
          <div className="max-w-md mx-auto">
            <Skeleton className="h-4 w-full rounded-full" aria-label="総合スコアプログレスバー読み込み中" />
          </div>
        </div>
      </div>
      
      {/* 個別スコア表示スケルトン */}
      <div className="p-6">
        <Skeleton className="h-5 w-32 mb-4" aria-label="要素別スコアタイトル読み込み中" />
        
        <div className="space-y-3">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 min-w-0 sm:w-32">
                <Skeleton className="h-4 w-20 mb-1" aria-label={`要素${index}名読み込み中`} />
                <Skeleton className="h-3 w-16" aria-label={`要素${index}重み読み込み中`} />
              </div>
              
              <div className="flex-shrink-0">
                <Skeleton className="h-6 w-12 rounded-full" aria-label={`要素${index}スコア読み込み中`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-full rounded-full" aria-label={`要素${index}プログレスバー読み込み中`} />
              </div>
              
              <div className="sm:max-w-xs">
                <Skeleton className="h-3 w-full" aria-label={`要素${index}説明読み込み中`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <span className="sr-only">スコアを計算しています。しばらくお待ちください。</span>
    </div>
  );
});

/**
 * 個別スコア表示コンポーネント
 */
interface IndividualScoreProps {
  label: string;
  score: number;
  weight: number;
  description?: string;
  index: number;
}

const IndividualScore = memo(function IndividualScore({ 
  label, 
  score, 
  weight, 
  description, 
  index 
}: IndividualScoreProps) {
  const colorClass = useMemo(() => getScoreColorClass(score), [score]);
  const weightPercentage = useMemo(() => Math.round(weight * 100), [weight]);
  const scoreLevel = useMemo(() => getScoreLevel(score), [score]);
  
  const descriptionId = `score-description-${index}`;
  const scoreId = `score-value-${index}`;
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Enterキーまたはスペースキーで詳細にフォーカス
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const progressBar = event.currentTarget.querySelector('[role="progressbar"]') as HTMLElement;
      if (progressBar) {
        progressBar.focus();
      }
    }
  }, []);
  
  return (
    <div 
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors"
      role="group"
      aria-labelledby={scoreId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* ラベルと重み */}
      <div className="flex-shrink-0 min-w-0 sm:w-32">
        <div id={scoreId} className="font-medium text-gray-900 truncate">
          {label}
        </div>
        <div className="text-sm text-gray-500" aria-label={`重み付け ${weightPercentage}パーセント`}>
          重み {weightPercentage}%
        </div>
      </div>
      
      {/* スコア値 */}
      <div className="flex-shrink-0">
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${colorClass}`}
          aria-label={`${label}スコア ${score.toFixed(1)}点、評価レベル ${scoreLevel}`}
        >
          {score.toFixed(1)}
        </span>
      </div>
      
      {/* プログレスバー */}
      <div className="flex-1 min-w-0">
        <ProgressBar 
          value={score} 
          aria-label={`${label}スコア: ${score.toFixed(1)}/100、評価レベル: ${scoreLevel}`}
          aria-describedby={description ? descriptionId : undefined}
        />
      </div>
      
      {/* 説明（モバイルでは折りたたみ） */}
      {description && (
        <div id={descriptionId} className="text-sm text-gray-600 sm:max-w-xs">
          {description}
        </div>
      )}
    </div>
  );
});

/**
 * データ不足警告コンポーネント
 */
interface MissingDataWarningProps {
  missingData: string[];
}

const MissingDataWarning = memo(function MissingDataWarning({ missingData }: MissingDataWarningProps) {
  if (missingData.length === 0) return null;
  
  return (
    <div 
      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
      role="alert"
      aria-labelledby="missing-data-title"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-yellow-400" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            aria-hidden="true"
            role="img"
            aria-label="警告アイコン"
          >
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 id="missing-data-title" className="text-sm font-medium text-yellow-800">
            データが不足しています
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>以下のデータが不足しているため、一部のスコアは推定値となります：</p>
            <ul className="list-disc list-inside mt-1" role="list">
              {missingData.map((item, index) => (
                <li key={index} role="listitem">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * エラー表示コンポーネント
 */
interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

const ErrorDisplay = memo(function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-4"
      role="alert"
      aria-labelledby="error-title"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            aria-hidden="true"
            role="img"
            aria-label="エラーアイコン"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 id="error-title" className="text-sm font-medium text-red-800">
            スコア計算エラー
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="スコア計算を再試行"
              >
                再試行
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * スコア表示コンポーネント
 * 
 * 商品の4要素スコア（エビデンス、安全性、コスト、実用性）と
 * 重み付け総合スコアを視覚的に表示します。
 * 
 * 要件1.3, 4.1, 4.2, 4.4, 6.4に対応
 */
export const ScoreDisplay = memo(function ScoreDisplay({ 
  scoreResult, 
  showBreakdown = false, 
  className = '',
  isLoading = false,
  error = null
}: ScoreDisplayProps) {
  // ローディング状態の表示
  if (isLoading) {
    return <ScoreDisplaySkeleton className={className} />;
  }
  
  // エラー状態の表示
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
        <ErrorDisplay error={error} />
      </div>
    );
  }
  
  // スコア結果がない場合
  if (!scoreResult) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>スコアデータがありません</p>
        </div>
      </div>
    );
  }
  
  const { total, components, weights, isComplete, missingData } = scoreResult;
  
  // スコア可視化データの準備（メモ化）
  const visualization: ScoreVisualization = useMemo(() => ({
    total,
    components,
    colors: {
      excellent: 'text-green-600 bg-green-100',
      good: 'text-blue-600 bg-blue-100', 
      fair: 'text-yellow-600 bg-yellow-100',
      poor: 'text-red-600 bg-red-100'
    }
  }), [total, components]);
  
  const totalColorClass = useMemo(() => getScoreColorClass(total), [total]);
  const totalLevel = useMemo(() => getScoreLevel(total), [total]);
  
  // スクリーンリーダー用の詳細説明
  const screenReaderSummary = useMemo(() => {
    const summary = `商品の総合スコアは${total.toFixed(1)}点（${totalLevel}）です。` +
      `内訳：エビデンス${components.evidence.toFixed(1)}点（重み${Math.round(weights.evidence * 100)}%）、` +
      `安全性${components.safety.toFixed(1)}点（重み${Math.round(weights.safety * 100)}%）、` +
      `コスト${components.cost.toFixed(1)}点（重み${Math.round(weights.cost * 100)}%）、` +
      `実用性${components.practicality.toFixed(1)}点（重み${Math.round(weights.practicality * 100)}%）。`;
    
    if (!isComplete && missingData.length > 0) {
      return summary + `データ不足項目：${missingData.join('、')}`;
    }
    
    return summary;
  }, [total, totalLevel, components, weights, isComplete, missingData]);
  
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      role="region"
      aria-labelledby="score-display-title"
      aria-describedby="score-display-summary"
    >
      {/* データ不足警告 */}
      {!isComplete && (
        <div className="p-4 pb-0">
          <MissingDataWarning missingData={missingData} />
        </div>
      )}
      
      {/* 総合スコア表示 */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center">
          <h3 id="score-display-title" className="text-lg font-semibold text-gray-900 mb-2">
            総合スコア
          </h3>
          
          {/* 大きなスコア表示 */}
          <div className="mb-4">
            <div 
              className={`inline-flex items-center px-6 py-3 rounded-full text-3xl font-bold ${totalColorClass}`}
              role="img"
              aria-label={`総合スコア ${total.toFixed(1)}点、評価レベル ${totalLevel}`}
            >
              {total.toFixed(1)}
              <span className="text-lg ml-1" aria-hidden="true">/100</span>
            </div>
            <div className="mt-2 text-sm font-medium text-gray-600" aria-hidden="true">
              {totalLevel}
            </div>
          </div>
          
          {/* 総合スコアプログレスバー */}
          <div className="max-w-md mx-auto">
            <ProgressBar 
              value={total} 
              className="h-4"
              aria-label={`総合スコア: ${total.toFixed(1)}/100 (${totalLevel})`}
              aria-describedby="score-display-summary"
            />
          </div>
        </div>
      </div>
      
      {/* 個別スコア表示 */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          要素別スコア
        </h4>
        
        <div className="space-y-3" role="list" aria-label="要素別スコア一覧">
          <div role="listitem">
            <IndividualScore
              label="エビデンス"
              score={components.evidence}
              weight={weights.evidence}
              description="科学的根拠の質と量"
              index={0}
            />
          </div>
          
          <div role="listitem">
            <IndividualScore
              label="安全性"
              score={components.safety}
              weight={weights.safety}
              description="副作用や相互作用のリスク"
              index={1}
            />
          </div>
          
          <div role="listitem">
            <IndividualScore
              label="コスト"
              score={components.cost}
              weight={weights.cost}
              description="価格対効果の評価"
              index={2}
            />
          </div>
          
          <div role="listitem">
            <IndividualScore
              label="実用性"
              score={components.practicality}
              weight={weights.practicality}
              description="摂取のしやすさ"
              index={3}
            />
          </div>
        </div>
        
        {/* 詳細表示の切り替えヒント */}
        {!showBreakdown && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              各スコアの詳細な計算根拠を確認するには、詳細表示をご利用ください
            </p>
          </div>
        )}
      </div>
      
      {/* アクセシビリティ用の隠しテキスト */}
      <div id="score-display-summary" className="sr-only">
        <p>{screenReaderSummary}</p>
      </div>
    </div>
  );
});

export default ScoreDisplay;