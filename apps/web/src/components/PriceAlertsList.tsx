'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
    getPriceAlerts,
    getActivePriceAlerts,
    getPriceAlertHistory,
    getPriceAlertStatistics,
    deletePriceAlert,
    deletePriceAlertsBatch,
    togglePriceAlert,
    updatePriceAlert,
    requestNotificationPermission,
    type PriceAlert,
    type PriceAlertHistory,
} from '../lib/price-alerts';

interface PriceAlertsListProps {
    onCreateAlert?: () => void;
    onEditAlert?: (alert: PriceAlert) => void;
    onViewProduct?: (productId: string) => void;
}

/**
 * 価格アラート一覧コンポーネント
 */
export function PriceAlertsList({ onCreateAlert, onEditAlert, onViewProduct }: PriceAlertsListProps) {
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [history, setHistory] = useState<PriceAlertHistory[]>([]);
    const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // データを読み込み
    useEffect(() => {
        loadData();
        checkNotificationPermission();
    }, []);

    const loadData = () => {
        try {
            setIsLoading(true);
            const allAlerts = getPriceAlerts();
            const alertHistory = getPriceAlertHistory();

            setAlerts(allAlerts);
            setHistory(alertHistory);
        } catch (error) {
            console.error('価格アラートの読み込みに失敗しました:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkNotificationPermission = () => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    };

    // 表示するアラートを取得
    const getDisplayAlerts = (): PriceAlert[] => {
        return showInactive ? alerts : alerts.filter(alert => alert.isActive);
    };

    // アラートを削除
    const handleDelete = (id: string) => {
        if (!confirm('この価格アラートを削除しますか？')) return;

        try {
            deletePriceAlert(id);
            loadData();
            setSelectedAlerts(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } catch (error) {
            console.error('価格アラートの削除に失敗しました:', error);
        }
    };

    // 選択されたアラートを一括削除
    const handleBatchDelete = () => {
        if (selectedAlerts.size === 0) return;
        if (!confirm(`${selectedAlerts.size}件の価格アラートを削除しますか？`)) return;

        try {
            deletePriceAlertsBatch(Array.from(selectedAlerts));
            loadData();
            setSelectedAlerts(new Set());
        } catch (error) {
            console.error('価格アラートの一括削除に失敗しました:', error);
        }
    };

    // アラートのアクティブ状態を切り替え
    const handleToggleActive = (id: string) => {
        try {
            togglePriceAlert(id);
            loadData();
        } catch (error) {
            console.error('価格アラートの状態切り替えに失敗しました:', error);
        }
    };

    // メモを編集
    const handleNotesEdit = (id: string, currentNotes: string) => {
        setEditingId(id);
        setEditNotes(currentNotes || '');
    };

    const handleNotesSave = () => {
        if (!editingId) return;

        try {
            updatePriceAlert(editingId, { notes: editNotes });
            setEditingId(null);
            setEditNotes('');
            loadData();
        } catch (error) {
            console.error('メモの更新に失敗しました:', error);
        }
    };

    // 選択の切り替え
    const toggleSelection = (id: string) => {
        setSelectedAlerts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 通知権限をリクエスト
    const handleRequestNotification = async () => {
        try {
            const permission = await requestNotificationPermission();
            setNotificationPermission(permission);
        } catch (error) {
            console.error('通知権限のリクエストに失敗しました:', error);
        }
    };

    // アラートタイプの表示名を取得
    const getAlertTypeLabel = (alertType: PriceAlert['alertType']): string => {
        switch (alertType) {
            case 'below': return '以下になったら';
            case 'above': return '以上になったら';
            case 'change': return '変動したら';
            default: return alertType;
        }
    };

    // アラートタイプの色を取得
    const getAlertTypeColor = (alertType: PriceAlert['alertType']): string => {
        switch (alertType) {
            case 'below': return 'text-green-600 bg-green-50';
            case 'above': return 'text-red-600 bg-red-50';
            case 'change': return 'text-primary-600 bg-primary-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">読み込み中...</span>
            </div>
        );
    }

    const displayAlerts = getDisplayAlerts();
    const statistics = getPriceAlertStatistics();

    return (
        <div className="space-y-6">
            {/* 統計情報 */}
            {showStatistics && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary-600">{statistics.totalAlerts}</div>
                            <div className="text-sm text-gray-600">総アラート数</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{statistics.activeAlerts}</div>
                            <div className="text-sm text-gray-600">アクティブ</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{statistics.triggeredToday}</div>
                            <div className="text-sm text-gray-600">今日の通知</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                ¥{statistics.totalSavings.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">推定節約額</div>
                        </div>
                    </div>

                    {statistics.mostWatchedProducts.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">よく監視される商品</h4>
                            <div className="flex flex-wrap gap-2">
                                {statistics.mostWatchedProducts.map(({ productName, alertCount }) => (
                                    <Badge key={productName} variant="info">
                                        {productName} ({alertCount}件)
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* 通知権限 */}
            {notificationPermission !== 'granted' && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                                <h4 className="font-medium text-yellow-900">通知を有効にしてください</h4>
                                <p className="text-sm text-yellow-800">
                                    価格変動をリアルタイムで受け取るには、ブラウザ通知を許可してください
                                </p>
                            </div>
                        </div>
                        <Button size="sm" onClick={handleRequestNotification}>
                            許可する
                        </Button>
                    </div>
                </Card>
            )}

            {/* コントロールパネル */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button onClick={onCreateAlert}>
                            新しいアラート
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInactive(!showInactive)}
                        >
                            {showInactive ? 'アクティブのみ' : '全て表示'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowStatistics(!showStatistics)}
                        >
                            統計情報
                        </Button>
                    </div>

                    {selectedAlerts.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedAlerts.size}件選択中
                            </span>
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
                                onClick={() => setSelectedAlerts(new Set())}
                            >
                                選択解除
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* アラート一覧 */}
            {displayAlerts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM12 17H7l5 5v-5zM12 3v5l5-5H12zM7 3l5 5V3H7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        価格アラートがありません
                    </h3>
                    <p className="text-gray-600 mb-4">
                        商品の価格変動を監視するアラートを作成してください
                    </p>
                    <Button onClick={onCreateAlert}>
                        最初のアラートを作成
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayAlerts.map(alert => {
                        const alertHistory = history.filter(h => h.alertId === alert.id);
                        const lastTriggered = alertHistory[0];

                        return (
                            <Card key={alert.id} className={`hover:shadow-md transition-shadow ${!alert.isActive ? 'opacity-60' : ''
                                }`}>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedAlerts.has(alert.id)}
                                                onChange={() => toggleSelection(alert.id)}
                                                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {alert.productName}
                                                    </h3>
                                                    {!alert.isActive && (
                                                        <Badge variant="info" className="text-gray-500">
                                                            無効
                                                        </Badge>
                                                    )}
                                                </div>

                                                {alert.productBrand && (
                                                    <p className="text-gray-600 text-sm mb-2">{alert.productBrand}</p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <span>現在価格: {alert.currency === 'USD' ? '$' : '¥'}{alert.currentPrice.toLocaleString()}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getAlertTypeColor(alert.alertType)}`}>
                                                        {getAlertTypeLabel(alert.alertType)} {alert.currency === 'USD' ? '$' : '¥'}{alert.targetPrice.toLocaleString()}
                                                        {alert.alertType === 'change' && alert.changePercentage && ` (${alert.changePercentage}%)`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                                    <span>作成: {new Date(alert.createdAt).toLocaleDateString('ja-JP')}</span>
                                                    {alert.lastChecked && (
                                                        <span>最終チェック: {new Date(alert.lastChecked).toLocaleString('ja-JP')}</span>
                                                    )}
                                                    {alert.lastTriggered && (
                                                        <span className="text-orange-600">
                                                            最終通知: {new Date(alert.lastTriggered).toLocaleString('ja-JP')}
                                                        </span>
                                                    )}
                                                </div>

                                                {lastTriggered && (
                                                    <div className="p-3 bg-orange-50 rounded-lg mb-3">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                            </svg>
                                                            <span className="text-orange-800">
                                                                最新の通知: {alert.currency === 'USD' ? '$' : '¥'}{lastTriggered.oldPrice} → {alert.currency === 'USD' ? '$' : '¥'}{lastTriggered.newPrice}
                                                                ({new Date(lastTriggered.triggeredAt).toLocaleString('ja-JP')})
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* メモ編集 */}
                                                {editingId === alert.id ? (
                                                    <div className="mb-3">
                                                        <textarea
                                                            value={editNotes}
                                                            onChange={(e) => setEditNotes(e.target.value)}
                                                            placeholder="メモを入力..."
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                                                            rows={2}
                                                        />
                                                        <div className="flex gap-2 mt-2">
                                                            <Button size="sm" onClick={handleNotesSave}>
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
                                                    </div>
                                                ) : alert.notes ? (
                                                    <div
                                                        className="p-2 bg-gray-50 rounded text-sm text-gray-700 mb-3 cursor-pointer hover:bg-gray-100"
                                                        onClick={() => handleNotesEdit(alert.id, alert.notes || '')}
                                                    >
                                                        {alert.notes}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleNotesEdit(alert.id, '')}
                                                        className="text-sm text-gray-500 hover:text-gray-700 mb-3"
                                                    >
                                                        + メモを追加
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleActive(alert.id)}
                                            >
                                                {alert.isActive ? '無効化' : '有効化'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditAlert?.(alert)}
                                            >
                                                編集
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewProduct?.(alert.productId)}
                                            >
                                                商品を見る
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(alert.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                削除
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 通知履歴 */}
                                    {alertHistory.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                通知履歴 ({alertHistory.length}件)
                                            </h4>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {alertHistory.slice(0, 3).map(historyItem => (
                                                    <div key={historyItem.id} className="text-xs text-gray-600 flex justify-between">
                                                        <span>
                                                            {alert.currency === 'USD' ? '$' : '¥'}{historyItem.oldPrice} → {alert.currency === 'USD' ? '$' : '¥'}{historyItem.newPrice}
                                                        </span>
                                                        <span>{new Date(historyItem.triggeredAt).toLocaleDateString('ja-JP')}</span>
                                                    </div>
                                                ))}
                                                {alertHistory.length > 3 && (
                                                    <div className="text-xs text-gray-500">
                                                        他 {alertHistory.length - 3} 件...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}