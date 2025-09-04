import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'プライバシーポリシー - サプティア',
    description: 'サプティアのプライバシーポリシーです。個人情報の取り扱いについて詳しく説明しています。',
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 mb-6">
                        最終更新日: 2025年1月1日
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 基本方針</h2>
                        <p className="text-gray-700 leading-relaxed">
                            サプティア（以下「当社」）は、ユーザーの個人情報保護の重要性を認識し、
                            個人情報の保護に関する法律（個人情報保護法）を遵守し、
                            適切な個人情報の取り扱いを行います。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 収集する情報</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            当社は、以下の情報を収集する場合があります：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>診断時に入力される健康関連情報</li>
                            <li>お気に入り商品や検索履歴</li>
                            <li>サービス利用状況に関する情報</li>
                            <li>お問い合わせ時の連絡先情報</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 情報の利用目的</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            収集した個人情報は、以下の目的で利用します：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>サプリメント推奨サービスの提供</li>
                            <li>サービスの改善・開発</li>
                            <li>お問い合わせへの対応</li>
                            <li>重要なお知らせの配信</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 情報の第三者提供</h2>
                        <p className="text-gray-700 leading-relaxed">
                            当社は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. お問い合わせ</h2>
                        <p className="text-gray-700 leading-relaxed">
                            個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください：<br />
                            メール: privacy@suptia.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}