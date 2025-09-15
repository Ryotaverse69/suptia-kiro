'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
    getDiagnosisHistory,
    deleteDiagnosisHistory,
    deleteDiagnosisHistoryBatch,
    updateDiagnosisHistory,
    filterDiagnosisHistory,
    getDiagnosisStatistics,
    compareDiagnosisHistory,
    type DiagnosisHistory,
} from '../lib/diagnosis-history';

interface DiagnosisHistoryListProps {
    onItemClick?: (item: DiagnosisHistory) => void;
    onCompareClick?: (items: DiagnosisHistory[]) => void;
}

/**
 * 診断履歴一覧コンポーネント
 */
export function DiagnosisHistoryList({ onItemClick, onCompareClick }: DiagnosisHistoryListProps) {
    const [history, setHistory] = useState<DiagnosisHistory[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<DiagnosisHistory[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // フィルタ状態
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        minScore: '',
        maxScore: '',
        purposes: [] as string[],
    });

    // データを読み込み
    useEffect(() => {
        loadData();
    }, []);

    // フィルタが変更されたときに再フィルタリング
    useEffect(() => {
        applyFilters();
    }, [history, filters]);

    const loadData = () => {
        try {
            setIsLoading(true);
            const data = getDiagnosisHistory();
            setHistory(data);
        } catch (error) {
            console.error('診断履歴の読み込みに失敗しました:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        const filtered = filterDiagnosisHistory({
            dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
            dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
            minScore: filters.minScore ? parseInt(filters.minScore) : undefined,
            maxScore: filters.maxScore ? parseInt(filters.maxScore) : undefined,
            purposes: filters.purposes.length > 0 ? filters.purposes : undefined,
        });
        setFilteredHistory(filtered);
    };

    // 診断履歴を削除
    const handleDelete = (id: string) => {
        if (!confirm('この診断履歴を削除しますか？')) return;

        try {
            deleteDiagnosisHistory(id);
            loadData();
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } catch (error) {
            console.error('診断履歴の削除に失敗しました:', error);
        }
    };

    // 選択された診断履歴を一括削除
    const handleBatchDelete = () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`${selectedItems.size}件の診断履歴を削除しますか？`)) return;

        try {
            deleteDiagnosisHistoryBatch(Array.from(selectedItems));
            loadData();
            setSelectedItems(new Set());
        } catch (error) {
            console.error('診断履歴の一括削除に失敗しました:', error);
        }
    };

    // タイトルを編集
    const handleTitleEdit = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const handleTitleSave = () => {
        if (!editingId) return;

        try {
            updateDiagnosisHistory(editingId, { title: editTitle });
            setEditingId(null);
            setEditTitle('');
            loadData();
        } catch (error) {
            console.error('タイトルの更新に失敗しました:', error);
        }
    };

    // 選択の切り替え
    const toggleSelection = (id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 比較機能
    const handleCompare = () => {
        if (selectedItems.size < 2) {
            alert('比較するには2つ以上の診断履歴を選択してください');
            return;
        }

        const selectedHistory = filteredHistory.filter(item => selectedItems.has(item.id));
        onCompareClick?.(selectedHistory);
    };

    // スコアに基づく色を取得
    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    // スコアに基づくバッジバリアントを取得
    const getScoreBadgeVariant = (score: number): 'high' | 'medium' | 'low' => {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">読み込み中...</span>
            </div>
        );
    }

    const statistics = getDiagnosisStatistics();

    return (
        <div className="space-y-6">
            {/* 統計情報 */}
            {showStatistics && statistics.totalCount > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary-600">{statistics.totalCount}</div>
                            <div className="text-sm text-gray-600">総診断回数</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {statistics.averageScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">平均スコア</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{statistics.highestScore}</div>
                            <div className="text-sm text-gray-600">最高スコア</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${statistics.recentTrend === 'improving' ? 'text-green-600' :
                                statistics.recentTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {statistics.recentTrend === 'improving' ? '↗' :
                                    statistics.recentTrend === 'declining' ? '↘' : '→'}
                            </div>
                            <div className="text-sm text-gray-600">最近の傾向</div>
                        </div>
                    </div>

                    {statistics.mostCommonPurposes.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">よく選択される目的</h4>
                            <div className="flex flex-wrap gap-2">
                                {statistics.mostCommonPurposes.map(({ purpose, count }) => (
                                    <Badge key={purpose} variant="info">
                                        {purpose} ({count}回)
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* コントロールパネル */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            フィルタ
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowStatistics(!showStatistics)}
                        >
                            統計情報
                        </Button>
                    </div>

                    {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedItems.size}件選択中
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCompare}
                                disabled={selectedItems.size < 2}
                            >
                                比較
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBatchDelete}
                                className="text-red-600 hover:text-red-700"
                            >
                                削除
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItems(new Set())}
                            >
                                選択解除
                            </Button>
                        </div>
                    )}
                </div>

                {/* フィルタパネル */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    開始日
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    終了日
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    最小スコア
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={filters.minScore}
                                    onChange={(e) => setFilters(prev => ({ ...prev, minScore: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    最大スコア
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={filters.maxScore}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxScore: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilters({
                                    dateFrom: '',
                                    dateTo: '',
                                    minScore: '',
                                    maxScore: '',
                                    purposes: [],
                                })}
                            >
                                フィルタクリア
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 診断履歴一覧 */}
            {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        診断履歴がありません
                    </h3>
                    <p className="text-gray-600">
                        診断ページで診断を実行すると、ここに履歴が表示されます
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredHistory.map(item => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                            className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <div className="flex-1">
                                            {editingId === item.id ? (
                                                <div className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
                                                        onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                                                    />
                                                    <Button size="sm" onClick={handleTitleSave}>
                                                        保存
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        キャンセル
                                                    </Button>
                                                </div>
                                            ) : (
                                                <h3
                                                    className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600"
                                                    onClick={() => handleTitleEdit(item.id, item.title || '')}
                                                >
                                                    {item.title}
                                                </h3>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                <span>{new Date(item.timestamp).toLocaleString('ja-JP')}</span>
                                                <Badge variant={getScoreBadgeVariant(item.results.totalScore)}>
                                                    スコア: {item.results.totalScore}
                                                </Badge>
                                                <span>¥{item.results.costPerDay}/日</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {item.answers.purpose.map(purpose => (
                                                    <Badge key={purpose} variant="info">
                                                        {purpose}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {item.results.dangerAlerts.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-red-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    <span>{item.results.dangerAlerts.length}件の注意事項</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onItemClick?.(item)}
                                        >
                                            詳細
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            削除
                                        </Button>
                                    </div>
                                </div>

                                {/* スコア内訳 */}
                                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                                    <div className="text-center">
                                        <div className={`text-lg font-semibold ${getScoreColor(item.results.breakdown.evidence)}`}>
                                            {item.results.breakdown.evidence}
                                        </div>
                                        <div className="text-xs text-gray-600">エビデンス</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-semibold ${getScoreColor(item.results.breakdown.safety)}`}>
                                            {item.results.breakdown.safety}
                                        </div>
                                        <div className="text-xs text-gray-600">安全性</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-semibold ${getScoreColor(item.results.breakdown.cost)}`}>
                                            {item.results.breakdown.cost}
                                        </div>
                                        <div className="text-xs text-gray-600">コスト</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-semibold ${getScoreColor(item.results.breakdown.practicality)}`}>
                                            {item.results.breakdown.practicality}
                                        </div>
                                        <div className="text-xs text-gray-600">実用性</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}