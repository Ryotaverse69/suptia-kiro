'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ScoreDisplay from '@/components/ScoreDisplay';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import { DiagnosisResult as DiagnosisResultType, DangerAlert } from '@/lib/diagnosis-scoring';
import { saveDiagnosisHistory, type DiagnosisAnswers, type DiagnosisResults } from '@/lib/diagnosis-history';

// モックデータ（実際の実装では診断フォームからの結果を使用）
const MOCK_DIAGNOSIS_RESULTS: DiagnosisResultType[] = [
    {
        totalScore: 87.5,
        personalizedScore: 87.5,
        baseScore: {
            total: 85.2,
            components: {
                evidence: 90,
                safety: 85,
                cost: 78,
                practicality: 88
            },
            weights: {
                evidence: 0.35,
                safety: 0.35,
                cost: 0.15,
                practicality: 0.15
            },
            breakdown: {
                evidence: {
                    score: 90,
                    factors: [
                        {
                            name: 'エビデンスレベル',
                            value: 90,
                            weight: 1.0,
                            description: '成分の科学的根拠の質 (A, B)'
                        }
                    ],
                    explanation: 'エビデンススコアは成分の科学的根拠の質を評価します'
                },
                safety: {
                    score: 85,
                    factors: [
                        {
                            name: '副作用リスク',
                            value: 85,
                            weight: 1.0,
                            description: 'リスク要因数: 1件 (レベル: low)'
                        }
                    ],
                    explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
                },
                cost: {
                    score: 78,
                    factors: [
                        {
                            name: 'mg単価効率',
                            value: 78,
                            weight: 1.0,
                            description: '0.125円/mg/日 (1日125円)'
                        }
                    ],
                    explanation: 'コストスコアは価格対効果を評価します'
                },
                practicality: {
                    score: 88,
                    factors: [
                        {
                            name: '摂取頻度',
                            value: 85,
                            weight: 0.4,
                            description: '1日2回摂取'
                        },
                        {
                            name: '剤形',
                            value: 100,
                            weight: 0.3,
                            description: 'capsule形式'
                        },
                        {
                            name: '容量',
                            value: 80,
                            weight: 0.3,
                            description: '1容器で30日分'
                        }
                    ],
                    explanation: '実用性スコアは使いやすさを評価します'
                }
            },
            isComplete: true,
            missingData: []
        },
        costPerDay: 125,
        dangerAlerts: [],
        recommendations: [
            '科学的根拠が豊富で信頼性の高い成分を含んでいます',
            '副作用のリスクが低く、安全性に優れています',
            '美容・アンチエイジングに効果的な成分を含んでいます',
            '月額予算（5,000円〜10,000円）内で継続可能です'
        ],
        warnings: []
    },
    {
        totalScore: 72.3,
        personalizedScore: 67.3,
        baseScore: {
            total: 72.3,
            components: {
                evidence: 75,
                safety: 70,
                cost: 85,
                practicality: 65
            },
            weights: {
                evidence: 0.35,
                safety: 0.35,
                cost: 0.15,
                practicality: 0.15
            },
            breakdown: {
                evidence: {
                    score: 75,
                    factors: [
                        {
                            name: 'エビデンスレベル',
                            value: 75,
                            weight: 1.0,
                            description: '成分の科学的根拠の質 (B, C)'
                        }
                    ],
                    explanation: 'エビデンススコアは成分の科学的根拠の質を評価します'
                },
                safety: {
                    score: 70,
                    factors: [
                        {
                            name: '副作用リスク',
                            value: 70,
                            weight: 1.0,
                            description: 'リスク要因数: 3件 (レベル: mid)'
                        }
                    ],
                    explanation: '安全性スコアは副作用や相互作用のリスクを評価します'
                },
                cost: {
                    score: 85,
                    factors: [
                        {
                            name: 'mg単価効率',
                            value: 85,
                            weight: 1.0,
                            description: '0.080円/mg/日 (1日80円)'
                        }
                    ],
                    explanation: 'コストスコアは価格対効果を評価します'
                },
                practicality: {
                    score: 65,
                    factors: [
                        {
                            name: '摂取頻度',
                            value: 70,
                            weight: 0.4,
                            description: '1日3回摂取'
                        },
                        {
                            name: '剤形',
                            value: 90,
                            weight: 0.3,
                            description: 'tablet形式'
                        },
                        {
                            name: '容量',
                            value: 45,
                            weight: 0.3,
                            description: '1容器で20日分'
                        }
                    ],
                    explanation: '実用性スコアは使いやすさを評価します'
                }
            },
            isComplete: true,
            missingData: []
        },
        costPerDay: 80,
        dangerAlerts: [
            {
                ingredient: 'カフェイン',
                severity: 'medium',
                description: '過剰摂取により不眠、動悸、不安感を引き起こす可能性があります',
                recommendation: '1日400mg以下に制限し、就寝6時間前の摂取は避けてください',
                reason: '一般的に注意が必要な成分です'
            }
        ],
        recommendations: [
            'コストパフォーマンスに優れ、経済的です',
            '月額予算（5,000円〜10,000円）内で継続可能です'
        ],
        warnings: [
            '1件の注意すべき成分が含まれています'
        ]
    }
];

interface ProductInfo {
    name: string;
    brand: string;
    image?: string;
}

const MOCK_PRODUCTS: ProductInfo[] = [
    {
        name: 'マルチビタミン&ミネラル プレミアム',
        brand: 'ヘルスケア製薬',
        image: '/images/products/multivitamin-premium.jpg'
    },
    {
        name: 'エナジーブースト コンプレックス',
        brand: 'ニュートリション・ラボ',
        image: '/images/products/energy-boost.jpg'
    }
];

export default function DiagnosisResult() {
    const [selectedResult, setSelectedResult] = useState(0);
    const [showAllResults, setShowAllResults] = useState(false);

    const currentResult = MOCK_DIAGNOSIS_RESULTS[selectedResult];
    const currentProduct = MOCK_PRODUCTS[selectedResult];

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeVariant = (score: number): 'high' | 'medium' | 'low' => {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    };

    const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="space-y-8">
            {/* 結果概要 */}
            <Card className="p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        あなたにおすすめのサプリメント
                    </h2>
                    <p className="text-gray-600">
                        診断結果に基づいて、最適な商品を順位付けしました
                    </p>
                </div>

                {/* 商品選択タブ */}
                <div className="flex justify-center mb-8">
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                        {MOCK_DIAGNOSIS_RESULTS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedResult(index)}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${selectedResult === index
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                第{index + 1}位
                            </button>
                        ))}
                    </div>
                </div>

                {/* 選択された商品の詳細 */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* 商品情報 */}
                    <div>
                        <div className="bg-gray-100 rounded-lg p-6 mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">💊</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {currentProduct.name}
                                    </h3>
                                    <p className="text-gray-600">{currentProduct.brand}</p>
                                </div>
                            </div>
                        </div>

                        {/* 総合スコア */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center space-x-3">
                                <span className="text-lg font-medium text-gray-600">総合スコア</span>
                                <Badge variant={getScoreBadgeVariant(currentResult.totalScore)}>
                                    <span className={`text-2xl font-bold ${getScoreColor(currentResult.totalScore)}`}>
                                        {currentResult.totalScore}
                                    </span>
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                あなたの診断結果に基づく適合度
                            </p>
                        </div>

                        {/* 実効コスト */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <div className="text-center">
                                <p className="text-sm text-blue-600 font-medium mb-1">実効コスト/日</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    ¥{currentResult.costPerDay}
                                </p>
                                <p className="text-sm text-blue-600">
                                    月額約¥{Math.round(currentResult.costPerDay * 30)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* スコア詳細 */}
                    <div>
                        <ScoreDisplay
                            scoreResult={currentResult.baseScore}
                            showBreakdown={true}
                            className="mb-6"
                        />

                        <ScoreBreakdown
                            breakdown={currentResult.baseScore.breakdown}
                            weights={currentResult.baseScore.weights}
                        />
                    </div>
                </div>
            </Card>

            {/* 推奨理由 */}
            {currentResult.recommendations.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        おすすめする理由
                    </h3>
                    <ul className="space-y-2">
                        {currentResult.recommendations.map((reason, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2 mt-1">•</span>
                                <span className="text-gray-700">{reason}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* 危険成分アラート */}
            {currentResult.dangerAlerts.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-red-500 mr-2">⚠️</span>
                        注意が必要な成分
                    </h3>
                    <div className="space-y-4">
                        {currentResult.dangerAlerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold">{alert.ingredient}</h4>
                                    <Badge variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'medium' : 'low'}>
                                        {alert.severity === 'high' ? '高リスク' : alert.severity === 'medium' ? '中リスク' : '低リスク'}
                                    </Badge>
                                </div>
                                <p className="text-sm mb-2">{alert.description}</p>
                                <p className="text-sm font-medium">推奨: {alert.recommendation}</p>
                                <p className="text-xs text-gray-600 mt-1">{alert.reason}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* 注意事項 */}
            {currentResult.warnings.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        注意事項
                    </h3>
                    <ul className="space-y-2">
                        {currentResult.warnings.map((warning, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-yellow-500 mr-2 mt-1">•</span>
                                <span className="text-gray-700">{warning}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* 他の結果を表示 */}
            {!showAllResults && MOCK_DIAGNOSIS_RESULTS.length > 1 && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        onClick={() => setShowAllResults(true)}
                    >
                        他の候補も見る（{MOCK_DIAGNOSIS_RESULTS.length - 1}件）
                    </Button>
                </div>
            )}

            {/* 全結果表示 */}
            {showAllResults && (
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                        全診断結果
                    </h3>
                    <div className="space-y-4">
                        {MOCK_DIAGNOSIS_RESULTS.map((result, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedResult === index
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => setSelectedResult(index)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-lg font-bold text-gray-600">
                                            #{index + 1}
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-gray-900">
                                                {MOCK_PRODUCTS[index].name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {MOCK_PRODUCTS[index].brand}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={getScoreBadgeVariant(result.totalScore)}>
                                            {result.totalScore}
                                        </Badge>
                                        <p className="text-sm text-gray-600 mt-1">
                                            ¥{result.costPerDay}/日
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* 履歴保存 */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">診断結果を保存</h3>
                        <p className="text-gray-600 text-sm">
                            この診断結果を履歴に保存して、後で確認や比較ができます
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            try {
                                // モックデータを履歴形式に変換
                                const mockAnswers: DiagnosisAnswers = {
                                    purpose: ['疲労回復', '免疫力向上'],
                                    constitution: ['健康体'],
                                    lifestyle: ['運動習慣あり', '規則正しい生活'],
                                };

                                const mockResults: DiagnosisResults = {
                                    totalScore: currentResult.totalScore,
                                    breakdown: {
                                        evidence: currentResult.baseScore.components.evidence,
                                        safety: currentResult.baseScore.components.safety,
                                        cost: currentResult.baseScore.components.cost,
                                        practicality: currentResult.baseScore.components.practicality,
                                    },
                                    costPerDay: currentResult.costPerDay,
                                    dangerAlerts: currentResult.dangerAlerts.map(alert => ({
                                        ingredient: alert.ingredient,
                                        severity: alert.severity,
                                        description: alert.description,
                                        recommendation: alert.recommendation,
                                    })),
                                    recommendedProducts: [currentProduct.name],
                                };

                                saveDiagnosisHistory(mockAnswers, mockResults);
                                alert('診断結果を履歴に保存しました');
                            } catch (error) {
                                console.error('履歴保存に失敗しました:', error);
                                alert('履歴保存に失敗しました');
                            }
                        }}
                    >
                        履歴に保存
                    </Button>
                </div>
            </Card>

            {/* アクションボタン */}
            <div className="flex justify-center space-x-4">
                <Button variant="outline">
                    診断をやり直す
                </Button>
                <Button>
                    商品詳細を見る
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mypage/history'}>
                    診断履歴を見る
                </Button>
            </div>
        </div>
    );
}