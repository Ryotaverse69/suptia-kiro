import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'サプティアとは - サプティア',
    description: 'サプティアは科学的根拠に基づいた分析で、あなたに最も合うサプリを最も安い価格で見つけるサービスです。',
};

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">
                        サプティアとは
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        あなたに最も合うサプリを最も安い価格で。<br />
                        科学的根拠に基づいた分析で、安全で効果的なサプリメント選択をサポートします。
                    </p>
                </div>

                {/* Mission Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">私たちのミッション</h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        サプリメント市場は情報が複雑で、消費者が最適な選択をするのは困難です。
                        サプティアは、AIと科学的データを活用して、個人のニーズに最適化された
                        サプリメント選択を支援し、健康的な生活の実現をサポートします。
                    </p>
                </div>

                {/* Features Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">サプティアの特徴</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">科学的根拠に基づく分析</h3>
                            <p className="text-gray-600">
                                研究論文、臨床試験データを基に、各成分の効果と安全性を客観的に評価します。
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">価格最適化</h3>
                            <p className="text-gray-600">
                                同じ成分でも価格は大きく異なります。実効コスト/日を計算し、最もコストパフォーマンスの良い商品を提案します。
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">個人最適化</h3>
                            <p className="text-gray-600">
                                年齢、性別、体質、ライフスタイルを考慮し、あなたに最適なサプリメントを推奨します。
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">安全性重視</h3>
                            <p className="text-gray-600">
                                相互作用、禁忌、副作用情報を詳細に分析し、安全性の高い選択肢を優先的に提案します。
                            </p>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">サプティアの使い方</h2>
                    <div className="space-y-8">
                        <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">簡単診断</h3>
                                <p className="text-gray-600">
                                    目的、体質、ライフスタイルに関する簡単な質問に答えるだけで、あなたの健康プロファイルを作成します。
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI分析</h3>
                                <p className="text-gray-600">
                                    科学的データベースと照合し、エビデンス・安全性・コスト・実用性の4つの観点から総合的に分析します。
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">最適提案</h3>
                                <p className="text-gray-600">
                                    あなたに最も適したサプリメントを、価格比較と共に提案。継続的な価格監視も可能です。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">今すぐ始めてみませんか？</h2>
                    <p className="text-lg mb-6 opacity-90">
                        無料診断で、あなたに最適なサプリメントを見つけましょう
                    </p>
                    <div className="space-x-4">
                        <a
                            href="/diagnosis"
                            className="inline-block bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            無料診断を始める
                        </a>
                        <a
                            href="/compare"
                            className="inline-block border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-primary-600 transition-colors duration-200"
                        >
                            商品を比較する
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}