import { Metadata } from 'next';
import DiagnosisResult from '@/components/diagnosis/DiagnosisResult';

export const metadata: Metadata = {
    title: '診断結果 | サプティア',
    description: 'あなたに最適なサプリメントの診断結果をご確認ください。個人に最適化されたスコアと推奨商品をご提案します。',
};

export default function DiagnosisResultPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            診断結果
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            あなたの回答に基づいて、最適なサプリメントを診断しました。
                            スコアと推奨理由をご確認ください。
                        </p>
                    </div>

                    <DiagnosisResult />
                </div>
            </div>
        </div>
    );
}