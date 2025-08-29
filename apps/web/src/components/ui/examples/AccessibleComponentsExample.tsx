'use client';

import React, { useState } from 'react';
import { AccessibleTable, AccessibleBanner, TableColumn } from '../index';

// サンプルデータ
const sampleProducts = [
  { id: '1', name: 'ビタミンC', price: 1200, category: 'ビタミン', rating: 4.5 },
  { id: '2', name: 'プロテイン', price: 3500, category: 'タンパク質', rating: 4.8 },
  { id: '3', name: 'オメガ3', price: 2800, category: '脂質', rating: 4.2 },
  { id: '4', name: 'マルチビタミン', price: 1800, category: 'ビタミン', rating: 4.6 },
];

export function AccessibleComponentsExample() {
  const [sortedData, setSortedData] = useState(sampleProducts);
  const [showBanner, setShowBanner] = useState(true);

  // テーブルヘッダー定義
  const headers: TableColumn[] = [
    { key: 'name', label: '商品名', sortable: true },
    { key: 'price', label: '価格（円）', sortable: true },
    { key: 'category', label: 'カテゴリ', sortable: true },
    { key: 'rating', label: '評価', sortable: true },
  ];

  // ソート処理
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    const sorted = [...sortedData].sort((a, b) => {
      const aValue = a[key as keyof typeof a];
      const bValue = b[key as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue, 'ja')
          : bValue.localeCompare(aValue, 'ja');
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setSortedData(sorted);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">
        アクセシブルUIコンポーネントの例
      </h1>

      {/* アクセシブルバナーの例 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          アクセシブルバナー
        </h2>
        
        <div className="space-y-4">
          {showBanner && (
            <AccessibleBanner
              type="info"
              message="これは情報バナーの例です。スクリーンリーダーで適切に読み上げられます。"
              dismissible={true}
              onDismiss={() => setShowBanner(false)}
              role="status"
            />
          )}
          
          <AccessibleBanner
            type="warning"
            message="これは警告バナーの例です。重要な情報を伝えます。"
            role="alert"
            aria-live="assertive"
          />
          
          <AccessibleBanner
            type="success"
            message="操作が正常に完了しました。"
            role="status"
          />
          
          <AccessibleBanner
            type="error"
            message="エラーが発生しました。再度お試しください。"
            role="alert"
          />
        </div>
      </section>

      {/* アクセシブルテーブルの例 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          アクセシブルテーブル
        </h2>
        
        <AccessibleTable
          caption="サプリメント商品一覧。商品名、価格、カテゴリ、評価を表示。各列でソート可能。"
          headers={headers}
          data={sortedData}
          onSort={handleSort}
          aria-label="サプリメント商品の比較テーブル"
          className="border border-gray-300 rounded-lg"
        />
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>アクセシビリティ機能：</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>テーブルキャプションでテーブルの内容を説明</li>
            <li>各列ヘッダーに適切なscope属性を設定</li>
            <li>ソート可能な列にaria-sort属性を設定</li>
            <li>キーボードナビゲーション対応（Enter/Spaceキー）</li>
            <li>スクリーンリーダー用のaria-label属性</li>
          </ul>
        </div>
      </section>

      {/* キーボードナビゲーションの説明 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          キーボードナビゲーション
        </h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">操作方法：</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li><kbd className="px-2 py-1 bg-white border rounded">Tab</kbd> - 次の要素に移動</li>
            <li><kbd className="px-2 py-1 bg-white border rounded">Shift + Tab</kbd> - 前の要素に移動</li>
            <li><kbd className="px-2 py-1 bg-white border rounded">Enter</kbd> または <kbd className="px-2 py-1 bg-white border rounded">Space</kbd> - ソートボタンやバナーの閉じるボタンを実行</li>
            <li><kbd className="px-2 py-1 bg-white border rounded">Escape</kbd> - フォーカスを外す</li>
          </ul>
        </div>
      </section>
    </div>
  );
}