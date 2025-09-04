'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface DiagnosisQuestion {
    id: string;
    type: 'single' | 'multiple' | 'scale';
    category: 'purpose' | 'constitution' | 'lifestyle';
    question: string;
    options: string[];
    required?: boolean;
}

export interface DiagnosisAnswers {
    purpose: string[];
    constitution: string[];
    lifestyle: string[];
}

const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
    // 目的に関する質問
    {
        id: 'purpose_main',
        type: 'multiple',
        category: 'purpose',
        question: 'サプリメントを摂取する主な目的は何ですか？（複数選択可）',
        options: [
            '疲労回復・エネルギー向上',
            '美容・アンチエイジング',
            '免疫力向上',
            '筋力・体力向上',
            '睡眠の質改善',
            '集中力・記憶力向上',
            '骨・関節の健康',
            'ダイエット・体重管理',
            'ストレス軽減',
            '栄養補給'
        ],
        required: true
    },
    {
        id: 'purpose_priority',
        type: 'single',
        category: 'purpose',
        question: '最も重要視する効果は何ですか？',
        options: [
            '即効性（すぐに効果を感じたい）',
            '持続性（長期的な健康維持）',
            '安全性（副作用のリスクを最小限に）',
            'コストパフォーマンス（価格と効果のバランス）'
        ],
        required: true
    },

    // 体質に関する質問
    {
        id: 'constitution_age',
        type: 'single',
        category: 'constitution',
        question: '年齢層を教えてください',
        options: [
            '20代以下',
            '30代',
            '40代',
            '50代',
            '60代以上'
        ],
        required: true
    },
    {
        id: 'constitution_gender',
        type: 'single',
        category: 'constitution',
        question: '性別を教えてください',
        options: [
            '男性',
            '女性',
            'その他・回答しない'
        ],
        required: true
    },
    {
        id: 'constitution_health',
        type: 'multiple',
        category: 'constitution',
        question: '現在気になる健康状態はありますか？（複数選択可）',
        options: [
            '特になし',
            '慢性的な疲労',
            '肌荒れ・乾燥',
            '便秘・消化不良',
            '冷え性',
            '肩こり・腰痛',
            '不眠・睡眠不足',
            'ストレス・イライラ',
            '集中力低下',
            '体重増加'
        ]
    },
    {
        id: 'constitution_allergies',
        type: 'multiple',
        category: 'constitution',
        question: 'アレルギーや摂取を避けたい成分はありますか？（複数選択可）',
        options: [
            'なし',
            '乳製品',
            '大豆',
            '卵',
            '魚・甲殻類',
            'ナッツ類',
            'グルテン',
            '人工甘味料',
            '人工着色料',
            '動物由来成分（ベジタリアン）'
        ]
    },

    // ライフスタイルに関する質問
    {
        id: 'lifestyle_exercise',
        type: 'single',
        category: 'lifestyle',
        question: '運動習慣について教えてください',
        options: [
            'ほとんど運動しない',
            '週1-2回軽い運動',
            '週3-4回定期的な運動',
            '週5回以上の激しい運動',
            'プロ・セミプロレベルの運動'
        ],
        required: true
    },
    {
        id: 'lifestyle_diet',
        type: 'single',
        category: 'lifestyle',
        question: '食生活について教えてください',
        options: [
            'バランスの取れた食事を心がけている',
            '忙しくて不規則な食事が多い',
            '外食・コンビニ食が中心',
            'ダイエット中で食事制限している',
            '特定の食事法を実践している（ベジタリアンなど）'
        ],
        required: true
    },
    {
        id: 'lifestyle_budget',
        type: 'single',
        category: 'lifestyle',
        question: 'サプリメントの月額予算はどの程度ですか？',
        options: [
            '3,000円未満',
            '3,000円〜5,000円',
            '5,000円〜10,000円',
            '10,000円〜20,000円',
            '20,000円以上'
        ],
        required: true
    },
    {
        id: 'lifestyle_form',
        type: 'multiple',
        category: 'lifestyle',
        question: '希望するサプリメントの形状は？（複数選択可）',
        options: [
            'タブレット・錠剤',
            'カプセル',
            'パウダー・粉末',
            'ドリンク・液体',
            'グミ・チュアブル',
            'こだわりなし'
        ]
    }
];

export default function DiagnosisForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentQuestion = DIAGNOSIS_QUESTIONS[currentStep];
    const totalSteps = DIAGNOSIS_QUESTIONS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const handleAnswer = (questionId: string, value: string, isMultiple: boolean = false) => {
        setAnswers(prev => {
            if (isMultiple) {
                const currentAnswers = prev[questionId] || [];
                const newAnswers = currentAnswers.includes(value)
                    ? currentAnswers.filter(a => a !== value)
                    : [...currentAnswers, value];
                return { ...prev, [questionId]: newAnswers };
            } else {
                return { ...prev, [questionId]: [value] };
            }
        });
    };

    const canProceed = () => {
        const currentAnswers = answers[currentQuestion.id] || [];
        return !currentQuestion.required || currentAnswers.length > 0;
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // 診断結果の処理をここに実装
            const formattedAnswers = formatAnswersForSubmission();
            console.log('診断回答:', formattedAnswers);

            // 診断結果をローカルストレージに保存（実際の実装では API に送信）
            localStorage.setItem('diagnosisAnswers', JSON.stringify(formattedAnswers));

            // 診断結果ページへリダイレクト
            router.push('/diagnosis/result');
        } catch (error) {
            console.error('診断処理中にエラーが発生しました:', error);
            // エラーハンドリング（実際の実装ではユーザーにエラーメッセージを表示）
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatAnswersForSubmission = (): DiagnosisAnswers => {
        const result: DiagnosisAnswers = {
            purpose: [],
            constitution: [],
            lifestyle: []
        };

        Object.entries(answers).forEach(([questionId, answerValues]) => {
            const question = DIAGNOSIS_QUESTIONS.find(q => q.id === questionId);
            if (question) {
                result[question.category].push(...answerValues);
            }
        });

        return result;
    };

    return (
        <Card className="max-w-3xl mx-auto p-8">
            {/* プログレスバー */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                        質問 {currentStep + 1} / {totalSteps}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* 質問 */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = (answers[currentQuestion.id] || []).includes(option);
                        const isMultiple = currentQuestion.type === 'multiple';

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswer(currentQuestion.id, option, isMultiple)}
                                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                        }`}>
                                        {isSelected && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <span className="font-medium">{option}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ナビゲーションボタン */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                >
                    前の質問
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!canProceed() || isSubmitting}
                >
                    {isSubmitting ? '診断中...' : currentStep === totalSteps - 1 ? '診断結果を見る' : '次の質問'}
                </Button>
            </div>
        </Card>
    );
}