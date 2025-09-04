import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'マイページ - サプティア',
    description: 'お気に入り商品、診断履歴、価格アラートなどを管理できるマイページです。',
};

export default function MyPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">お気に入り</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            保存した商品を管理・比較できます
                        </p>
                        <a href="/mypage/favorites" className="text-blue-600 hover:text-blue-700 font-medium">
                            お気に入りを見る →
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">診断履歴</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            過去の診断結果を確認・比較できます
                        </p>
                        <a href="/mypage/history" className="text-blue-600 hover:text-blue-700 font-medium">
                            履歴を見る →
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 17H7l5 5v-5zM12 3v5l5-5H12zM7 3l5 5V3H7z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">価格アラート</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            商品の価格変動を通知で受け取れます
                        </p>
                        <a href="/mypage/alerts" className="text-blue-600 hover:text-blue-700 font-medium">
                            アラート設定 →
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">プロフィール</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            個人情報と設定を管理できます
                        </p>
                        <a href="/mypage/profile" className="text-blue-600 hover:text-blue-700 font-medium">
                            設定を見る →
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">プレミアム</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            有料会員特典とプラン管理
                        </p>
                        <a href="/mypage/premium" className="text-blue-600 hover:text-blue-700 font-medium">
                            特典を見る →
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 ml-3">設定</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            通知設定やアカウント管理
                        </p>
                        <a href="/mypage/settings" className="text-blue-600 hover:text-blue-700 font-medium">
                            設定を開く →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}