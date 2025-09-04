import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '利用規約 - サプティア',
    description: 'サプティアの利用規約です。サービスをご利用いただく際の条件について説明しています。',
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 mb-6">
                        最終更新日: 2025年1月1日
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
                        <p className="text-gray-700 leading-relaxed">
                            本利用規約（以下「本規約」）は、サプティア（以下「当社」）が提供するサービス（以下「本サービス」）の
                            利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスをご利用ください。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（サービス内容）</h2>
                        <p className="text-gray-700 leading-relaxed">
                            本サービスは、サプリメント選択支援に関する情報提供サービスです。
                            医療アドバイスや診断を提供するものではありません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（禁止事項）</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません：
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>当社または第三者の知的財産権を侵害する行為</li>
                            <li>虚偽の情報を登録する行為</li>
                            <li>本サービスの運営を妨害する行為</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（免責事項）</h2>
                        <p className="text-gray-700 leading-relaxed">
                            当社は、本サービスの利用により生じた損害について、法令上許される限り、
                            一切の責任を負いません。本サービスは情報提供のみを目的とし、
                            医療上の判断や治療の代替となるものではありません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（規約の変更）</h2>
                        <p className="text-gray-700 leading-relaxed">
                            当社は、必要に応じて本規約を変更することがあります。
                            変更後の規約は、本サイトに掲載した時点で効力を生じるものとします。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（お問い合わせ）</h2>
                        <p className="text-gray-700 leading-relaxed">
                            本規約に関するお問い合わせは、以下までご連絡ください：<br />
                            メール: legal@suptia.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}