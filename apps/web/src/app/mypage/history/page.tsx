'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DiagnosisHistoryList } from '../../../components/DiagnosisHistoryList';
import { DiagnosisHistoryDetail } from '../../../components/DiagnosisHistoryDetail';
import { DiagnosisHistoryComparison } from '../../../components/DiagnosisHistoryComparison';
import { type DiagnosisHistory } from '../../../lib/diagnosis-history';

type ViewMode = 'list' | 'detail' | 'comparison';

export default function DiagnosisHistoryPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedItem, setSelectedItem] = useState<DiagnosisHistory | null>(null);
    const [comparisonItems, setComparisonItems] = useState<DiagnosisHistory[]>([]);

    const handleItemClick = (item: DiagnosisHistory) => {
        setSelectedItem(item);
        setViewMode('detail');
    };

    const handleCompareClick = (items: DiagnosisHistory[]) => {
        setComparisonItems(items);
        setViewMode('comparison');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedItem(null);
        setComparisonItems([]);
    };

    const handleItemEdit = (item: DiagnosisHistory) => {
        // 編集機能は将来的に実装
        console.log('Edit item:', item);
    };

    const handleItemDelete = (id: string) => {
        // 削除後はリストビューに戻る
        handleBackToList();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* ヘッダー */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            戻る
                        </button>

                        {viewMode !== 'list' && (
                            <button
                                onClick={handleBackToList}
                                className="flex items-center text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                一覧に戻る
                            </button>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {viewMode === 'list' && '診断履歴'}
                        {viewMode === 'detail' && '診断履歴詳細'}
                        {viewMode === 'comparison' && '診断履歴比較'}
                    </h1>

                    <p className="text-gray-600">
                        {viewMode === 'list' && '過去の診断結果を確認・比較できます。'}
                        {viewMode === 'detail' && '診断結果の詳細情報を表示しています。'}
                        {viewMode === 'comparison' && '複数の診断結果を比較しています。'}
                    </p>
                </div>

                {/* コンテンツ */}
                {viewMode === 'list' && (
                    <DiagnosisHistoryList
                        onItemClick={handleItemClick}
                        onCompareClick={handleCompareClick}
                    />
                )}

                {viewMode === 'detail' && selectedItem && (
                    <DiagnosisHistoryDetail
                        item={selectedItem}
                        onClose={handleBackToList}
                        onEdit={handleItemEdit}
                        onDelete={handleItemDelete}
                    />
                )}

                {viewMode === 'comparison' && comparisonItems.length > 0 && (
                    <DiagnosisHistoryComparison
                        items={comparisonItems}
                        onClose={handleBackToList}
                    />
                )}
            </div>
        </div>
    );
}