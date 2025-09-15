'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PriceAlertsList } from '../../../components/PriceAlertsList';
import { PriceAlertForm } from '../../../components/PriceAlertForm';
import { type PriceAlert } from '../../../lib/price-alerts';

type ViewMode = 'list' | 'create' | 'edit';

export default function PriceAlertsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
    const [initialProductData, setInitialProductData] = useState<{
        productId?: string;
        productName?: string;
        productBrand?: string;
        currentPrice?: number;
    }>({});

    // URLパラメータから商品情報を取得
    useEffect(() => {
        const create = searchParams.get('create');
        const productId = searchParams.get('productId');
        const productName = searchParams.get('productName');
        const productBrand = searchParams.get('productBrand');
        const currentPrice = searchParams.get('currentPrice');

        if (create === 'true' && productId && productName) {
            setInitialProductData({
                productId,
                productName,
                productBrand: productBrand || undefined,
                currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
            });
            setViewMode('create');
        }
    }, [searchParams]);

    const handleCreateAlert = () => {
        setEditingAlert(null);
        setViewMode('create');
    };

    const handleEditAlert = (alert: PriceAlert) => {
        setEditingAlert(alert);
        setViewMode('edit');
    };

    const handleViewProduct = (productId: string) => {
        router.push(`/products/${productId}`);
    };

    const handleFormSave = (alert: PriceAlert) => {
        setViewMode('list');
        setEditingAlert(null);
    };

    const handleFormCancel = () => {
        setViewMode('list');
        setEditingAlert(null);
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

                        {viewMode !== 'list' && (
                            <button
                                onClick={() => setViewMode('list')}
                                className="flex items-center text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                一覧に戻る
                            </button>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {viewMode === 'list' && '価格アラート'}
                        {viewMode === 'create' && '新しい価格アラート'}
                        {viewMode === 'edit' && '価格アラートを編集'}
                    </h1>

                    <p className="text-gray-600">
                        {viewMode === 'list' && '商品の価格変動を監視して、条件に合致したときに通知を受け取れます。'}
                        {viewMode === 'create' && '新しい価格アラートを作成します。'}
                        {viewMode === 'edit' && '価格アラートの設定を変更します。'}
                    </p>
                </div>

                {/* コンテンツ */}
                {viewMode === 'list' && (
                    <PriceAlertsList
                        onCreateAlert={handleCreateAlert}
                        onEditAlert={handleEditAlert}
                        onViewProduct={handleViewProduct}
                    />
                )}

                {(viewMode === 'create' || viewMode === 'edit') && (
                    <PriceAlertForm
                        alert={editingAlert || undefined}
                        productId={initialProductData.productId}
                        productName={initialProductData.productName}
                        productBrand={initialProductData.productBrand}
                        currentPrice={initialProductData.currentPrice}
                        onSave={handleFormSave}
                        onCancel={handleFormCancel}
                    />
                )}
            </div>
        </div>
    );
}