'use client';

import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { compareDiagnosisHistory, type DiagnosisHistory } from '../lib/diagnosis-history';

interface DiagnosisHistoryComparisonProps {
    items: DiagnosisHistory[];
    onClose?: () => void;
}

/**
 * 診断履歴比較コンポーネント
 */
export function DiagnosisHistoryComparison({ items, onClose }: DiagnosisHistoryComparisonProps) {
    const comparison = compareDiagnosisHistory(items.map(item => item.id));

    // スコアに基づく色を取得
    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    // 最高スコアを持つアイテムを特定
    const getBestScore = (scores: number[]): number => Math.max(...scores);
    const getWorstScore = (scores: number[]): number => Math.min(...scores);

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">診断履歴比較</h2>
                    <p className="text-gray-600 mt-1">
                        {items.length}件の診断結果を比較しています
                    </p>
                </div>
                {onClose && (
                    <Button variant="outline" onClick={onClose}>
                        閉じる
                    </Button>
                )}
            </div>

            {/* 基本情報比較 */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-4 font-medium text-gray-900">項目</th>
                                {comparison.items.map(item => (
                                    <th key={item.id} className="text-left py-2 px-4 font-medium text-gray-900 min-w-[200px]">
                                        {item.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 px-4 text-gray-600">診断日時</td>
                                {comparison.items.map(item => (
                                    <td key={item.id} className="py-2 px-4 text-sm">
                                        {new Date(item.timestamp).toLocaleString('ja-JP')}
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 px-4 text-gray-600">総合スコア</td>
                                {comparison.items.map(item => (
                                    <td key={item.id} className="py-2 px-4">
                                        <span className={`text-lg font-semibold ${getScoreColor(item.results.totalScore)}`}>
                                            {item.results.totalScore}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 px-4 text-gray-600">実効コスト/日</td>
                                {comparison.items.map(item => (
                                    <td key={item.id} className="py-2 px-4 text-sm">
                                        ¥{item.results.costPerDay}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-gray-600">注意事項</td>
                                {comparison.items.map(item => (
                                    <td key={item.id} className="py-2 px-4 text-sm">
                                        {item.results.dangerAlerts.length > 0 ? (
                                            <span className="text-red-600">
                                                {item.results.dangerAlerts.length}件
                                            </span>
                                        ) : (
                                            <span className="text-green-600">なし</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* スコア詳細比較 */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">スコア詳細比較</h3>
                <div className="space-y-6">
                    {/* スコア内訳テーブル */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-4 font-medium text-gray-900">スコア項目</th>
                                    {comparison.comparison.scoreComparison.map((item: any) => (
                                        <th key={item.id} className="text-center py-2 px-4 font-medium text-gray-900 min-w-[120px]">
                                            {item.title}
                                        </th>
                                    ))}
                                    <th className="text-center py-2 px-4 font-medium text-gray-900">最高</th>
                                    <th className="text-center py-2 px-4 font-medium text-gray-900">最低</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2 px-4 text-gray-600">エビデンス</td>
                                    {comparison.comparison.scoreComparison.map((item: any) => (
                                        <td key={item.id} className="py-2 px-4 text-center">
                                            <span className={`font-semibold ${getScoreColor(item.breakdown.evidence)}`}>
                                                {item.breakdown.evidence}
                                            </span>
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-center text-green-600 font-semibold">
                                        {getBestScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.evidence))}
                                    </td>
                                    <td className="py-2 px-4 text-center text-red-600 font-semibold">
                                        {getWorstScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.evidence))}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2 px-4 text-gray-600">安全性</td>
                                    {comparison.comparison.scoreComparison.map((item: any) => (
                                        <td key={item.id} className="py-2 px-4 text-center">
                                            <span className={`font-semibold ${getScoreColor(item.breakdown.safety)}`}>
                                                {item.breakdown.safety}
                                            </span>
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-center text-green-600 font-semibold">
                                        {getBestScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.safety))}
                                    </td>
                                    <td className="py-2 px-4 text-center text-red-600 font-semibold">
                                        {getWorstScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.safety))}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2 px-4 text-gray-600">コスト</td>
                                    {comparison.comparison.scoreComparison.map((item: any) => (
                                        <td key={item.id} className="py-2 px-4 text-center">
                                            <span className={`font-semibold ${getScoreColor(item.breakdown.cost)}`}>
                                                {item.breakdown.cost}
                                            </span>
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-center text-green-600 font-semibold">
                                        {getBestScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.cost))}
                                    </td>
                                    <td className="py-2 px-4 text-center text-red-600 font-semibold">
                                        {getWorstScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.cost))}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 text-gray-600">実用性</td>
                                    {comparison.comparison.scoreComparison.map((item: any) => (
                                        <td key={item.id} className="py-2 px-4 text-center">
                                            <span className={`font-semibold ${getScoreColor(item.breakdown.practicality)}`}>
                                                {item.breakdown.practicality}
                                            </span>
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-center text-green-600 font-semibold">
                                        {getBestScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.practicality))}
                                    </td>
                                    <td className="py-2 px-4 text-center text-red-600 font-semibold">
                                        {getWorstScore(comparison.comparison.scoreComparison.map((item: any) => item.breakdown.practicality))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* スコア推移グラフ（簡易版） */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">スコア推移</h4>
                        <div className="space-y-2">
                            {comparison.comparison.scoreComparison.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-32 text-sm text-gray-600 truncate">
                                        {item.title}
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${item.totalScore >= 80 ? 'bg-green-500' :
                                                item.totalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${item.totalScore}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-sm font-medium text-right">
                                        {item.totalScore}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* 回答比較 */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">回答比較</h3>
                <div className="space-y-6">
                    {comparison.comparison.answerComparison.map((questionData: any) => (
                        <div key={questionData.question}>
                            <h4 className="font-medium text-gray-900 mb-3">{questionData.question}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            {questionData.answers.map((answer: any) => (
                                                <th key={answer.id} className="text-left py-2 px-4 font-medium text-gray-900 min-w-[200px]">
                                                    {answer.title}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {questionData.answers.map((answer: any) => (
                                                <td key={answer.id} className="py-2 px-4 align-top">
                                                    <div className="flex flex-wrap gap-1">
                                                        {answer.answer.map((item: string) => (
                                                            <Badge key={item} variant="info" className="text-xs">
                                                                {item}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* 改善提案 */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">改善提案</h3>
                <div className="space-y-4">
                    {(() => {
                        const scores = comparison.comparison.scoreComparison.map((item: any) => item.totalScore);
                        const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
                        const trend = scores.length > 1 ?
                            (scores[0] > scores[scores.length - 1] ? 'improving' :
                                scores[0] < scores[scores.length - 1] ? 'declining' : 'stable') : 'stable';

                        return (
                            <>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h5 className="font-medium text-blue-900 mb-2">全体的な傾向</h5>
                                    <p className="text-primary-800 text-sm">
                                        平均スコア: {avgScore.toFixed(1)}点 |
                                        傾向: {trend === 'improving' ? '改善中' :
                                            trend === 'declining' ? '低下中' : '安定'}
                                    </p>
                                </div>

                                {avgScore < 70 && (
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <h5 className="font-medium text-yellow-900 mb-2">改善のポイント</h5>
                                        <ul className="text-yellow-800 text-sm space-y-1">
                                            <li>• より高品質なサプリメントの選択を検討してください</li>
                                            <li>• 安全性の高い成分を重視した選択をお勧めします</li>
                                            <li>• コストパフォーマンスを見直してみてください</li>
                                        </ul>
                                    </div>
                                )}

                                {trend === 'improving' && (
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <h5 className="font-medium text-green-900 mb-2">良い傾向です！</h5>
                                        <p className="text-green-800 text-sm">
                                            スコアが改善傾向にあります。現在の選択基準を継続することをお勧めします。
                                        </p>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </Card>
        </div>
    );
}