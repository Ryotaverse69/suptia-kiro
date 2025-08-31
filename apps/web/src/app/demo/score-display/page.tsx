'use client';

import React, { useState } from 'react';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { score, Product } from '@/lib/scoring';

// デモ用の商品データ
const demoProduct: Product = {
  name: 'マルチビタミン プレミアム',
  brand: 'ヘルスケア株式会社',
  priceJPY: 3980,
  servingsPerContainer: 60,
  servingsPerDay: 2,
  form: 'capsule',
  ingredients: [
    {
      ingredient: {
        name: 'ビタミンC',
        evidenceLevel: 'A',
        safetyNotes: [],
        category: 'ビタミン'
      },
      amountMgPerServing: 500
    },
    {
      ingredient: {
        name: 'ビタミンD3',
        evidenceLevel: 'A',
        safetyNotes: ['高用量摂取時は注意'],
        category: 'ビタミン'
      },
      amountMgPerServing: 25
    },
    {
      ingredient: {
        name: 'ビタミンB12',
        evidenceLevel: 'B',
        safetyNotes: [],
        category: 'ビタミン'
      },
      amountMgPerServing: 10
    }
  ],
  warnings: ['妊娠中・授乳中の方は医師にご相談ください'],
  thirdPartyTested: true
};

// データ不足の商品例
const incompleteProduct: Product = {
  name: '不完全データ商品',
  brand: 'テスト株式会社',
  priceJPY: 0, // 価格データなし
  servingsPerContainer: 30,
  servingsPerDay: 1,
  ingredients: [], // 成分データなし
};

// 低スコア商品例
const lowScoreProduct: Product = {
  name: '低スコア商品',
  brand: 'テスト株式会社',
  priceJPY: 8000, // 高価格
  servingsPerContainer: 15, // 少ない容量
  servingsPerDay: 4, // 頻繁な摂取
  form: 'powder', // 摂取しにくい形状
  ingredients: [
    {
      ingredient: {
        name: '不明成分',
        evidenceLevel: 'C', // 低いエビデンス
        safetyNotes: ['副作用の報告あり', '相互作用の可能性', '禁忌事項多数'],
        category: '不明'
      },
      amountMgPerServing: 100
    }
  ],
  warnings: [
    '重篤な副作用の可能性があります',
    '他の薬剤との併用禁止',
    '妊娠中・授乳中は使用禁止',
    '18歳未満は使用禁止'
  ]
};

export default function ScoreDisplayDemoPage() {
  // 各商品のスコア計算
  const highScoreResult = score(demoProduct);
  const incompleteScoreResult = score(incompleteProduct);
  const lowScoreResult = score(lowScoreProduct);

  // 詳細表示の状態管理
  const [showBreakdown, setShowBreakdown] = useState({
    high: false,
    incomplete: false,
    low: false
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          スコア表示システム デモ
        </h1>
        <p className="text-lg text-gray-600">
          商品スコアリングシステムの表示機能をテストするためのデモページです。
        </p>
      </div>

      {/* 高スコア商品の例 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          高品質商品の例（総合スコア: {highScoreResult.total.toFixed(1)}点）
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">商品情報:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 商品名: {demoProduct.name}</li>
            <li>• ブランド: {demoProduct.brand}</li>
            <li>• 価格: ¥{demoProduct.priceJPY.toLocaleString()}</li>
            <li>• 容量: {demoProduct.servingsPerContainer}回分</li>
            <li>• 摂取回数: 1日{demoProduct.servingsPerDay}回</li>
            <li>• 剤形: {demoProduct.form}</li>
            <li>• 成分数: {demoProduct.ingredients?.length}種類</li>
          </ul>
        </div>
        <ScoreDisplay scoreResult={highScoreResult} />
        
        {/* 詳細表示切り替えボタン */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowBreakdown(prev => ({ ...prev, high: !prev.high }))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showBreakdown.high ? '詳細を隠す' : '詳細な計算根拠を表示'}
          </button>
        </div>
        
        {/* スコア詳細表示 */}
        {showBreakdown.high && (
          <div className="mt-6">
            <ScoreBreakdown 
              breakdown={highScoreResult.breakdown} 
              weights={highScoreResult.weights} 
            />
          </div>
        )}
      </section>

      {/* データ不足商品の例 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          データ不足商品の例（総合スコア: {incompleteScoreResult.total.toFixed(1)}点）
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">商品情報:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 商品名: {incompleteProduct.name}</li>
            <li>• ブランド: {incompleteProduct.brand}</li>
            <li>• 価格: データなし</li>
            <li>• 容量: {incompleteProduct.servingsPerContainer}回分</li>
            <li>• 摂取回数: 1日{incompleteProduct.servingsPerDay}回</li>
            <li>• 成分数: データなし</li>
          </ul>
        </div>
        <ScoreDisplay scoreResult={incompleteScoreResult} />
        
        {/* 詳細表示切り替えボタン */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowBreakdown(prev => ({ ...prev, incomplete: !prev.incomplete }))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showBreakdown.incomplete ? '詳細を隠す' : '詳細な計算根拠を表示'}
          </button>
        </div>
        
        {/* スコア詳細表示 */}
        {showBreakdown.incomplete && (
          <div className="mt-6">
            <ScoreBreakdown 
              breakdown={incompleteScoreResult.breakdown} 
              weights={incompleteScoreResult.weights} 
            />
          </div>
        )}
      </section>

      {/* 低スコア商品の例 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          低品質商品の例（総合スコア: {lowScoreResult.total.toFixed(1)}点）
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">商品情報:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 商品名: {lowScoreProduct.name}</li>
            <li>• ブランド: {lowScoreProduct.brand}</li>
            <li>• 価格: ¥{lowScoreProduct.priceJPY.toLocaleString()}</li>
            <li>• 容量: {lowScoreProduct.servingsPerContainer}回分</li>
            <li>• 摂取回数: 1日{lowScoreProduct.servingsPerDay}回</li>
            <li>• 剤形: {lowScoreProduct.form}</li>
            <li>• 警告数: {lowScoreProduct.warnings?.length}件</li>
          </ul>
        </div>
        <ScoreDisplay scoreResult={lowScoreResult} />
        
        {/* 詳細表示切り替えボタン */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowBreakdown(prev => ({ ...prev, low: !prev.low }))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showBreakdown.low ? '詳細を隠す' : '詳細な計算根拠を表示'}
          </button>
        </div>
        
        {/* スコア詳細表示 */}
        {showBreakdown.low && (
          <div className="mt-6">
            <ScoreBreakdown 
              breakdown={lowScoreResult.breakdown} 
              weights={lowScoreResult.weights} 
            />
          </div>
        )}
      </section>

      {/* スコア計算の詳細情報 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          スコア計算の詳細
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">重み設定</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">35%</div>
              <div className="text-sm text-gray-600">エビデンス</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">30%</div>
              <div className="text-sm text-gray-600">安全性</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">20%</div>
              <div className="text-sm text-gray-600">コスト</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">15%</div>
              <div className="text-sm text-gray-600">実用性</div>
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4">スコアレベル</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="text-lg font-bold text-green-600">80-100</div>
              <div className="text-sm text-gray-600">優秀</div>
            </div>
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <div className="text-lg font-bold text-blue-600">60-79</div>
              <div className="text-sm text-gray-600">良好</div>
            </div>
            <div className="text-center p-3 bg-yellow-100 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">40-59</div>
              <div className="text-sm text-gray-600">普通</div>
            </div>
            <div className="text-center p-3 bg-red-100 rounded-lg">
              <div className="text-lg font-bold text-red-600">0-39</div>
              <div className="text-sm text-gray-600">要改善</div>
            </div>
          </div>
        </div>
      </section>

      {/* ナビゲーション */}
      <div className="text-center">
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}