'use client';

import { useRouter } from 'next/navigation';
import { FavoritesList } from '../../../components/FavoritesList';

export default function FavoritesPage() {
    const router = useRouter();

    const handleProductClick = (productId: string) => {
        router.push(`/products/${productId}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* ヘッダー */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            戻る
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">お気に入り商品</h1>
                    <p className="text-gray-600">
                        保存した商品を管理・整理できます。カテゴリを作成して商品を分類することも可能です。
                    </p>
                </div>

                {/* お気に入り一覧 */}
                <FavoritesList onProductClick={handleProductClick} />
            </div>
        </div>
    );
}