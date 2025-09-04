import { Metadata } from 'next';
import DiagnosisForm from '@/components/diagnosis/DiagnosisForm';

export const metadata: Metadata = {
    title: 'サプリメント診断 | サプティア',
    description: 'あなたに最適なサプリメントを見つけるための簡単な診断を行います。目的・体質・ライフスタイルに基づいて個人に最適化された推奨をご提供します。',
};

export default function DiagnosisPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            サプリメント診断
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            簡単な質問にお答えいただくことで、あなたに最適なサプリメントをAIが診断します。
                            目的・体質・ライフスタイルに基づいて個人に最適化された推奨をご提供します。
                        </p>
                    </div>

                    <DiagnosisForm />
                </div>
            </div>
        </div>
    );
}