'use client';

import React, { useState, memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { ScoreResult, ScoreBreakdown as ScoreBreakdownType } from '@/lib/scoring';

/**
 * スコア詳細表示コンポーネントのプロパティ
 */
export interface ScoreBreakdownProps {
  /** スコア詳細データ */
  breakdown: ScoreResult['breakdown'];
  /** 重み設定 */
  weights: ScoreResult['weights'];
  /** 追加のCSSクラス */
  className?: string;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  error?: string | null;
}

/**
 * 展開可能セクションのプロパティ
 */
interface CollapsibleSectionProps {
  /** セクションタイトル */
  title: string;
  /** スコア値 */
  score: number;
  /** 重み（パーセンテージ表示用） */
  weight: number;
  /** 初期展開状態 */
  defaultExpanded?: boolean;
  /** 子要素 */
  children: React.ReactNode;
  /** セクションID（アクセシビリティ用） */
  sectionId: string;
}

/**
 * 要因表示コンポーネントのプロパティ
 */
interface FactorDisplayProps {
  /** 要因データ */
  factor: {
    name: string;
    value: number;
    weight: number;
    description: string;
  };
  /** 親スコアへの貢献度を表示するかどうか */
  showContribution?: boolean;
}

/**
 * スコアに基づく色分けを取得
 * @param score スコア値 (0-100)
 * @returns 色分けクラス名
 */
function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
  if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  return 'text-red-600 bg-red-100 border-red-200';
}

/**
 * スコアレベルのアイコンを取得
 * @param score スコア値 (0-100)
 * @returns アイコンのJSX
 */
function getScoreIcon(score: number): JSX.Element {
  if (score >= 80) {
    return (
      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.23 10.661a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
      </svg>
    );
  }
  if (score >= 60) {
    return (
      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    );
  }
  if (score >= 40) {
    return (
      <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * 要因表示コンポーネント
 * 
 * 個別の計算要因を詳細に表示します
 */
const FactorDisplay = memo(function FactorDisplay({ factor, showContribution = true }: FactorDisplayProps) {
  const contribution = useMemo(() => factor.value * factor.weight, [factor.value, factor.weight]);
  const weightPercentage = useMemo(() => Math.round(factor.weight * 100), [factor.weight]);
  
  const factorId = useMemo(() => 
    `factor-${factor.name.toLowerCase().replace(/\s+/g, '-')}`, 
    [factor.name]
  );
  
  return (
    <div 
      className="bg-gray-50 rounded-lg p-4 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-colors"
      role="group"
      aria-labelledby={`${factorId}-title`}
      aria-describedby={`${factorId}-description`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 id={`${factorId}-title`} className="font-medium text-gray-900 mb-1">
            {factor.name}
          </h5>
          <p id={`${factorId}-description`} className="text-sm text-gray-600">
            {factor.description}
          </p>
        </div>
        
        <div className="flex-shrink-0 ml-4 text-right">
          <div 
            className="text-lg font-semibold text-gray-900"
            aria-label={`${factor.name}の値: ${factor.value.toFixed(1)}点`}
          >
            {factor.value.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500" aria-label={`重み付け: ${weightPercentage}パーセント`}>
            重み {weightPercentage}%
          </div>
        </div>
      </div>
      
      {/* 重み付け貢献度の可視化 */}
      {showContribution && factor.weight < 1.0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">貢献度</span>
            <span className="font-medium text-gray-900">
              {contribution.toFixed(1)}点
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2" role="group" aria-label="貢献度表示">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, contribution)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(contribution * 10) / 10}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${factor.name}の貢献度: ${contribution.toFixed(1)}点`}
              tabIndex={0}
            />
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 展開可能セクションコンポーネント
 * 
 * 各スコア要素の詳細を展開/折りたたみ可能な形式で表示します
 */
const CollapsibleSection = memo(function CollapsibleSection({ 
  title, 
  score, 
  weight, 
  defaultExpanded = false, 
  children,
  sectionId
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const colorClass = useMemo(() => getScoreColorClass(score), [score]);
  const scoreIcon = useMemo(() => getScoreIcon(score), [score]);
  const weightPercentage = useMemo(() => Math.round(weight * 100), [weight]);
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        toggleExpanded();
        break;
      case 'Escape':
        if (isExpanded) {
          event.preventDefault();
          setIsExpanded(false);
          buttonRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        if (isExpanded && contentRef.current) {
          event.preventDefault();
          const firstFocusable = contentRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
        break;
    }
  }, [isExpanded, toggleExpanded]);
  
  // 展開状態が変わった時のアナウンス
  useEffect(() => {
    if (isExpanded) {
      // スクリーンリーダーに展開されたことを通知
      const announcement = `${title}セクションが展開されました。詳細情報が表示されています。`;
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }
  }, [isExpanded, title]);
  
  return (
    <div className={`border rounded-lg ${colorClass} transition-all duration-200`}>
      {/* ヘッダー（クリック可能） */}
      <button
        ref={buttonRef}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg hover:bg-black hover:bg-opacity-5 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={sectionId}
        aria-describedby={`${sectionId}-description`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div aria-hidden="true">{scoreIcon}</div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {title}
              </h4>
              <p id={`${sectionId}-description`} className="text-sm opacity-75">
                重み {weightPercentage}% • {isExpanded ? '折りたたむ' : '展開して詳細を表示'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div 
                className="text-xl font-bold"
                aria-label={`${title}スコア: ${score.toFixed(1)}点`}
              >
                {score.toFixed(1)}
              </div>
              <div className="text-xs opacity-75" aria-hidden="true">
                /100
              </div>
            </div>
            
            {/* 展開/折りたたみアイコン */}
            <svg
              className={`h-5 w-5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {/* 展開可能コンテンツ */}
      {isExpanded && (
        <div
          ref={contentRef}
          id={sectionId}
          className="px-4 pb-4 border-t border-current border-opacity-20"
          role="region"
          aria-labelledby={`${sectionId}-title`}
        >
          <div className="pt-4">
            <h5 id={`${sectionId}-title`} className="sr-only">
              {title}の詳細情報
            </h5>
            {children}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 単一スコア詳細コンポーネント
 * 
 * 一つのスコア要素（エビデンス、安全性等）の詳細を表示します
 */
interface SingleScoreBreakdownProps {
  /** スコア要素名 */
  title: string;
  /** スコア詳細データ */
  breakdown: ScoreBreakdownType;
  /** 重み */
  weight: number;
  /** 初期展開状態 */
  defaultExpanded?: boolean;
  /** セクションID */
  sectionId: string;
}

const SingleScoreBreakdown = memo(function SingleScoreBreakdown({ 
  title, 
  breakdown, 
  weight, 
  defaultExpanded = false,
  sectionId
}: SingleScoreBreakdownProps) {
  const hasDataIssues = useMemo(() => 
    breakdown.factors.some(f => f.description.includes('エラー') || f.description.includes('不足')),
    [breakdown.factors]
  );
  
  return (
    <CollapsibleSection
      title={title}
      score={breakdown.score}
      weight={weight}
      defaultExpanded={defaultExpanded}
      sectionId={sectionId}
    >
      {/* スコア説明 */}
      <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
        <p className="text-sm text-gray-700">
          {breakdown.explanation}
        </p>
      </div>
      
      {/* 計算要因一覧 */}
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900 mb-2">
          計算要因
        </h5>
        
        <div role="list" aria-label={`${title}の計算要因一覧`}>
          {breakdown.factors.map((factor, index) => (
            <div key={index} role="listitem">
              <FactorDisplay
                factor={factor}
                showContribution={breakdown.factors.length > 1}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* データ不足の場合の注意事項 */}
      {hasDataIssues && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg" role="alert">
          <div className="flex items-start">
            <svg 
              className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              aria-hidden="true"
              role="img"
              aria-label="注意アイコン"
            >
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h6 className="text-sm font-medium text-yellow-800">
                注意事項
              </h6>
              <p className="text-sm text-yellow-700 mt-1">
                一部のデータが不足しているため、推定値を使用してスコアを計算しています。
                より正確な評価のために、商品の詳細情報を確認することをお勧めします。
              </p>
            </div>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
});

/**
 * スケルトンローダーコンポーネント
 */
const ScoreBreakdownSkeleton = memo(function ScoreBreakdownSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="スコア詳細分析読み込み中">
      {/* ヘッダースケルトン */}
      <div className="text-center mb-6">
        <div className="animate-pulse bg-gray-300 rounded h-6 w-48 mx-auto mb-2"></div>
        <div className="animate-pulse bg-gray-300 rounded h-4 w-64 mx-auto"></div>
      </div>
      
      {/* セクションスケルトン */}
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse bg-gray-300 rounded-full h-5 w-5"></div>
              <div>
                <div className="animate-pulse bg-gray-300 rounded h-5 w-20 mb-1"></div>
                <div className="animate-pulse bg-gray-300 rounded h-3 w-32"></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="animate-pulse bg-gray-300 rounded h-6 w-12 mb-1"></div>
                <div className="animate-pulse bg-gray-300 rounded h-3 w-8"></div>
              </div>
              <div className="animate-pulse bg-gray-300 rounded h-5 w-5"></div>
            </div>
          </div>
        </div>
      ))}
      
      <span className="sr-only">スコア詳細分析を読み込んでいます。しばらくお待ちください。</span>
    </div>
  );
});

/**
 * エラー表示コンポーネント
 */
const ScoreBreakdownError = memo(function ScoreBreakdownError({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void; 
}) {
  return (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
      role="alert"
      aria-labelledby="breakdown-error-title"
    >
      <svg 
        className="h-12 w-12 text-red-400 mx-auto mb-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 id="breakdown-error-title" className="text-lg font-medium text-red-800 mb-2">
        スコア詳細の読み込みに失敗しました
      </h3>
      <p className="text-sm text-red-700 mb-4">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="スコア詳細の読み込みを再試行"
        >
          再試行
        </button>
      )}
    </div>
  );
});

/**
 * スコア詳細表示コンポーネント
 * 
 * 4要素スコアの詳細な計算根拠と説明を展開可能な形式で表示します。
 * 各要素の計算要因、重み付け、貢献度を視覚的に表現します。
 * 
 * 要件2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 4.4, 6.4に対応
 */
export const ScoreBreakdown = memo(function ScoreBreakdown({ 
  breakdown, 
  weights, 
  className = '',
  isLoading = false,
  error = null
}: ScoreBreakdownProps) {
  // スクリーンリーダー用の詳細説明（Hooksは条件分岐の前に呼び出す）
  const screenReaderSummary = useMemo(() => {
    return `スコア詳細分析：` +
      `エビデンススコア${breakdown.evidence.score}点（重み${Math.round(weights.evidence * 100)}%）、` +
      `安全性スコア${breakdown.safety.score}点（重み${Math.round(weights.safety * 100)}%）、` +
      `コストスコア${breakdown.cost.score}点（重み${Math.round(weights.cost * 100)}%）、` +
      `実用性スコア${breakdown.practicality.score}点（重み${Math.round(weights.practicality * 100)}%）。` +
      `各セクションを展開すると詳細な計算根拠を確認できます。`;
  }, [breakdown, weights]);

  // ローディング状態の表示
  if (isLoading) {
    return <ScoreBreakdownSkeleton className={className} />;
  }
  
  // エラー状態の表示
  if (error) {
    return <ScoreBreakdownError error={error} className={className} />;
  }
  
  return (
    <div 
      className={`space-y-4 ${className}`}
      role="region"
      aria-labelledby="score-breakdown-title"
      aria-describedby="score-breakdown-summary"
    >
      {/* ヘッダー */}
      <div className="text-center mb-6">
        <h3 id="score-breakdown-title" className="text-lg font-semibold text-gray-900 mb-2">
          スコア詳細分析
        </h3>
        <p className="text-sm text-gray-600">
          各要素をクリックまたはEnterキーで詳細な計算根拠を確認できます
        </p>
      </div>
      
      {/* 各スコア要素の詳細 */}
      <SingleScoreBreakdown
        title="エビデンス"
        breakdown={breakdown.evidence}
        weight={weights.evidence}
        defaultExpanded={false}
        sectionId="evidence-breakdown"
      />
      
      <SingleScoreBreakdown
        title="安全性"
        breakdown={breakdown.safety}
        weight={weights.safety}
        defaultExpanded={false}
        sectionId="safety-breakdown"
      />
      
      <SingleScoreBreakdown
        title="コスト"
        breakdown={breakdown.cost}
        weight={weights.cost}
        defaultExpanded={false}
        sectionId="cost-breakdown"
      />
      
      <SingleScoreBreakdown
        title="実用性"
        breakdown={breakdown.practicality}
        weight={weights.practicality}
        defaultExpanded={false}
        sectionId="practicality-breakdown"
      />
      
      {/* 重み設定の説明 */}
      <div 
        className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        role="complementary"
        aria-labelledby="weight-settings-title"
      >
        <h4 id="weight-settings-title" className="font-medium text-blue-900 mb-2">
          重み設定について
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          総合スコアは以下の重み付けで計算されています：
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm" role="list" aria-label="重み設定一覧">
          <div className="flex justify-between" role="listitem">
            <span>エビデンス:</span>
            <span className="font-medium" aria-label={`エビデンスの重み ${Math.round(weights.evidence * 100)}パーセント`}>
              {Math.round(weights.evidence * 100)}%
            </span>
          </div>
          <div className="flex justify-between" role="listitem">
            <span>安全性:</span>
            <span className="font-medium" aria-label={`安全性の重み ${Math.round(weights.safety * 100)}パーセント`}>
              {Math.round(weights.safety * 100)}%
            </span>
          </div>
          <div className="flex justify-between" role="listitem">
            <span>コスト:</span>
            <span className="font-medium" aria-label={`コストの重み ${Math.round(weights.cost * 100)}パーセント`}>
              {Math.round(weights.cost * 100)}%
            </span>
          </div>
          <div className="flex justify-between" role="listitem">
            <span>実用性:</span>
            <span className="font-medium" aria-label={`実用性の重み ${Math.round(weights.practicality * 100)}パーセント`}>
              {Math.round(weights.practicality * 100)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* アクセシビリティ用の隠しテキスト */}
      <div id="score-breakdown-summary" className="sr-only">
        <p>{screenReaderSummary}</p>
      </div>
    </div>
  );
});

export default ScoreBreakdown;
