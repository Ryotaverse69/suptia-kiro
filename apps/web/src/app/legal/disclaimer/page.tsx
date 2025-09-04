import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '免責事項 - サプティア',
    description: 'サプティアの免責事項です。サービス利用時の注意事項について説明しています。',
};

export default function DisclaimerPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">免責事項</h1>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 mb-6">
                        最終更新日: 2025年1月1日
                    </p>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>重要な注意事項:</strong> 本サービスは医療アドバイスを提供するものではありません。
                                    健康に関する重要な決定を行う前に、必ず医師にご相談ください。
                                </p>
                            </div>
                        </div>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. サービスの性質について</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            サプティアは、サプリメント選択の参考情報を提供する情報サービスです。
                            以下の点にご注意ください：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>医療診断、治療、医療アドバイスを提供するものではありません</li>
                            <li>医師の診断や治療の代替となるものではありません</li>
                            <li>個人の健康状態や医学的条件を考慮した専門的判断は含まれません</li>
                            <li>提供される情報は一般的な参考情報に過ぎません</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 情報の正確性について</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            当社は情報の正確性向上に努めていますが、以下の点にご留意ください：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>提供される情報の完全性や正確性を保証するものではありません</li>
                            <li>科学的研究は日々進歩しており、情報が変更される可能性があります</li>
                            <li>商品情報や価格情報は変動する可能性があります</li>
                            <li>第三者から提供される情報の正確性について責任を負いません</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 健康への影響について</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            サプリメントの使用に関して、以下の点を十分にご理解ください：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>サプリメントの効果には個人差があります</li>
                            <li>既存の薬物治療との相互作用の可能性があります</li>
                            <li>アレルギー反応や副作用が生じる可能性があります</li>
                            <li>妊娠中、授乳中、疾患をお持ちの方は特に注意が必要です</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 推奨事項</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            安全で効果的なサプリメント利用のため、以下を強く推奨します：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>新しいサプリメントを始める前に医師に相談する</li>
                            <li>既存の治療や薬物との相互作用について確認する</li>
                            <li>推奨用量を守り、過剰摂取を避ける</li>
                            <li>異常を感じた場合は直ちに使用を中止し、医師に相談する</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 責任の制限</h2>
                        <p className="text-gray-700 leading-relaxed">
                            当社は、本サービスの利用により生じた直接的または間接的な損害について、
                            法令上許される限り、一切の責任を負いません。
                            ユーザーは自己の責任において本サービスを利用するものとします。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. お問い合わせ</h2>
                        <p className="text-gray-700 leading-relaxed">
                            本免責事項に関するお問い合わせは、以下までご連絡ください：<br />
                            メール: legal@suptia.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}