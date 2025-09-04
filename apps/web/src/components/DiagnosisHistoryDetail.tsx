'use client';

import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ScoreDisplay } from './ScoreDisplay';
import { ScoreBreakdown } from './ScoreBreakdown';
import { type DiagnosisHistory } from '../lib/diagnosis-history';

interface DiagnosisHistoryDetailProps {
    item: DiagnosisHistory;
    onClose?: () => void;
    onEdit?: (item: DiagnosisHistory) => void;
    onDelete?: (id: string) => void;
}

/**
 * 診断履歴詳細表示コンポーネント
 */
export function DiagnosisHistoryDetail({
    item,
    onClose,
    onEdit,
    onDelete
}: DiagnosisHistoryDetailProps) {
    const handleDelete = () => {
        if (!confirm('この診断履歴を削除しますか？')) return;
        onDelete?.(item.id);
    };

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
                    <p className="text-gray-600 mt-1">
                        {new Date(item.timestamp).toLocaleString('ja-JP')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onEdit?.(item)}>
                        編集
                    </Button>
                    <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                        削除
                    </Button>
                    {onClose && (
                        <Button variant="outline" onClick={onClose}>
                            閉じる
                        </Button>
                    )}
                </div>
            </div>

            {/* スコア表示 */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">診断結果</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <ScoreDisplay
                        scoreResult={{
                            total: item.results.totalScore,
                            components: item.results.breakdown,
                            breakdown: {
                                evidence: { score: item.results.breakdown.evidence } as any,
                                safety: { score: item.results.breakdown.safety } as any,
                                cost: { score: item.results.breakdown.cost } as any,
                                practicality: { score: item.results.breakdown.practicality } as any
                            },
                            weights: { evidence: 0.3, safety: 0.3, cost: 0.2, practicality: 0.2 },
                            isComplete: true,
                            missingData: []
                        } as any}
                    />
                    <ScoreBreakdown
                        breakdown={{
                            evidence: { score: item.results.breakdown.evidence } as any,
                            safety: { score: item.results.breakdown.safety } as any,
                            cost: { score: item.results.breakdown.cost } as any,
                            practicality: { score: item.results.breakdown.practicality } as any
                        }}
                        weights={{ evidence: 0.3, safety: 0.3, cost: 0.2, practicality: 0.2 }}
                    />
                </div>
            </Card>

            {/* 危険成分アラート */}
            {item.results.dangerAlerts.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">注意事項</h3>
                    <div className="space-y-4">
                        {item.results.dangerAlerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border-l-4 ${alert.severity === 'high'
                                    ? 'bg-red-50 border-red-400'
                                    : alert.severity === 'medium'
                                        ? 'bg-yellow-50 border-yellow-400'
                                        : 'bg-blue-50 border-blue-400'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-900">{alert.ingredient}</h4>
                                            <Badge
                                                variant={
                                                    alert.severity === 'high' ? 'danger' :
                                                        alert.severity === 'medium' ? 'medium' : 'low'
                                                }
                                            >
                                                {alert.severity === 'high' ? '高リスク' :
                                                    alert.severity === 'medium' ? '中リスク' : '低リスク'}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 mb-2">{alert.description}</p>
                                        <p className="text-sm text-gray-600">
                                            <strong>推奨:</strong> {alert.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* 診断回答詳細 */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">回答内容</h3>
                <div className="space-y-6">
                    {/* 目的 */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">目的</h4>
                        <div className="flex flex-wrap gap-2">
                            {item.answers.purpose.map(purpose => (
                                <Badge key={purpose} variant="info">
                                    {purpose}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* 体質 */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">体質</h4>
                        <div className="flex flex-wrap gap-2">
                            {item.answers.constitution.map(constitution => (
                                <Badge key={constitution} variant="info">
                                    {constitution}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* ライフスタイル */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">ライフスタイル</h4>
                        <div className="flex flex-wrap gap-2">
                            {item.answers.lifestyle.map(lifestyle => (
                                <Badge key={lifestyle} variant="info">
                                    {lifestyle}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* 追加情報 */}
                    {(item.answers.age || item.answers.weight || item.answers.gender) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">基本情報</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                {item.answers.age && (
                                    <div>
                                        <span className="text-gray-600">年齢:</span>
                                        <span className="ml-2 font-medium">{item.answers.age}歳</span>
                                    </div>
                                )}
                                {item.answers.weight && (
                                    <div>
                                        <span className="text-gray-600">体重:</span>
                                        <span className="ml-2 font-medium">{item.answers.weight}kg</span>
                                    </div>
                                )}
                                {item.answers.gender && (
                                    <div>
                                        <span className="text-gray-600">性別:</span>
                                        <span className="ml-2 font-medium">
                                            {item.answers.gender === 'male' ? '男性' :
                                                item.answers.gender === 'female' ? '女性' : 'その他'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* アレルギー・服薬情報 */}
                    {(item.answers.allergies?.length || item.answers.medications?.length) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">健康情報</h4>
                            <div className="space-y-2">
                                {item.answers.allergies && item.answers.allergies.length > 0 && (
                                    <div>
                                        <span className="text-gray-600 text-sm">アレルギー:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.answers.allergies.map(allergy => (
                                                <Badge key={allergy} variant="danger" className="text-red-600">
                                                    {allergy}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {item.answers.medications && item.answers.medications.length > 0 && (
                                    <div>
                                        <span className="text-gray-600 text-sm">服薬中:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.answers.medications.map(medication => (
                                                <Badge key={medication} variant="medium" className="text-orange-600">
                                                    {medication}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* 推奨商品 */}
            {item.results.recommendedProducts.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">推奨商品</h3>
                    <div className="space-y-2">
                        {item.results.recommendedProducts.map((productId, index) => (
                            <div key={productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">商品 #{index + 1}</span>
                                <Button variant="outline" size="sm">
                                    詳細を見る
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* メモ */}
            {item.notes && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">メモ</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{item.notes}</p>
                    </div>
                </Card>
            )}
        </div>
    );
}