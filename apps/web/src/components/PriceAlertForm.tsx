'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
    createPriceAlert,
    updatePriceAlert,
    type PriceAlert,
} from '../lib/price-alerts';
import { checkLimit } from '../lib/membership';

interface PriceAlertFormProps {
    alert?: PriceAlert; // 編集時に渡される既存のアラート
    productId?: string;
    productName?: string;
    productBrand?: string;
    currentPrice?: number;
    onSave?: (alert: PriceAlert) => void;
    onCancel?: () => void;
}

/**
 * 価格アラート作成・編集フォームコンポーネント
 */
export function PriceAlertForm({
    alert,
    productId,
    productName,
    productBrand,
    currentPrice,
    onSave,
    onCancel,
}: PriceAlertFormProps) {
    const [formData, setFormData] = useState({
        productId: alert?.productId || productId || '',
        productName: alert?.productName || productName || '',
        productBrand: alert?.productBrand || productBrand || '',
        currentPrice: alert?.currentPrice || currentPrice || 0,
        targetPrice: alert?.targetPrice || 0,
        currency: alert?.currency || 'JPY',
        alertType: alert?.alertType || 'below' as PriceAlert['alertType'],
        changePercentage: alert?.changePercentage || 10,
        notificationMethod: alert?.notificationMethod || 'browser' as PriceAlert['notificationMethod'],
        notes: alert?.notes || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!alert;

    // フォームデータの更新
    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // エラーをクリア
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // バリデーション
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.productName.trim()) {
            newErrors.productName = '商品名は必須です';
        }

        if (formData.currentPrice <= 0) {
            newErrors.currentPrice = '現在価格は0より大きい値を入力してください';
        }

        if (formData.targetPrice <= 0) {
            newErrors.targetPrice = '目標価格は0より大きい値を入力してください';
        }

        if (formData.alertType === 'change' && (formData.changePercentage <= 0 || formData.changePercentage > 100)) {
            newErrors.changePercentage = '変動率は1-100%の範囲で入力してください';
        }

        // アラートタイプ別の論理チェック
        if (formData.alertType === 'below' && formData.targetPrice >= formData.currentPrice) {
            newErrors.targetPrice = '目標価格は現在価格より低く設定してください';
        }

        if (formData.alertType === 'above' && formData.targetPrice <= formData.currentPrice) {
            newErrors.targetPrice = '目標価格は現在価格より高く設定してください';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // フォーム送信
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // 新規作成時の制限チェック
        if (!isEditing) {
            const limitCheck = checkLimit('priceAlerts', 0); // 実際の現在数は外部から取得
            if (!limitCheck.allowed) {
                setErrors({ submit: `価格アラートは${limitCheck.limit}件まで作成できます。プランをアップグレードしてください。` });
                return;
            }
        }

        setIsSubmitting(true);

        try {
            let savedAlert: PriceAlert;

            if (isEditing && alert) {
                // 編集
                updatePriceAlert(alert.id, {
                    productName: formData.productName,
                    productBrand: formData.productBrand || undefined,
                    currentPrice: formData.currentPrice,
                    targetPrice: formData.targetPrice,
                    currency: formData.currency,
                    alertType: formData.alertType,
                    changePercentage: formData.alertType === 'change' ? formData.changePercentage : undefined,
                    notificationMethod: formData.notificationMethod,
                    notes: formData.notes || undefined,
                });
                savedAlert = { ...alert, ...formData };
            } else {
                // 新規作成
                savedAlert = createPriceAlert(
                    formData.productId,
                    formData.productName,
                    formData.currentPrice,
                    formData.targetPrice,
                    formData.alertType,
                    {
                        productBrand: formData.productBrand || undefined,
                        currency: formData.currency,
                        changePercentage: formData.alertType === 'change' ? formData.changePercentage : undefined,
                        notificationMethod: formData.notificationMethod,
                        notes: formData.notes || undefined,
                    }
                );
            }

            onSave?.(savedAlert);
        } catch (error) {
            console.error('価格アラートの保存に失敗しました:', error);
            setErrors({ submit: '保存に失敗しました。もう一度お試しください。' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 推奨価格を計算
    const getSuggestedPrices = () => {
        const current = formData.currentPrice;
        if (current <= 0) return [];

        return [
            { label: '5%安く', value: Math.round(current * 0.95) },
            { label: '10%安く', value: Math.round(current * 0.9) },
            { label: '15%安く', value: Math.round(current * 0.85) },
            { label: '20%安く', value: Math.round(current * 0.8) },
        ];
    };

    const suggestedPrices = getSuggestedPrices();

    return (
        <Card className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    {isEditing ? '価格アラートを編集' : '新しい価格アラート'}
                </h2>
                <p className="text-gray-600 mt-1">
                    商品の価格変動を監視して、条件に合致したときに通知を受け取れます
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 商品情報 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">商品情報</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            商品名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.productName}
                            onChange={(e) => updateFormData('productName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.productName ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="商品名を入力してください"
                        />
                        {errors.productName && (
                            <p className="text-red-600 text-sm mt-1">{errors.productName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ブランド
                        </label>
                        <input
                            type="text"
                            value={formData.productBrand}
                            onChange={(e) => updateFormData('productBrand', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ブランド名（任意）"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                現在価格 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                                <select
                                    value={formData.currency}
                                    onChange={(e) => updateFormData('currency', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="JPY">¥</option>
                                    <option value="USD">$</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.currentPrice}
                                    onChange={(e) => updateFormData('currentPrice', parseFloat(e.target.value) || 0)}
                                    className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.currentPrice ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="0"
                                />
                            </div>
                            {errors.currentPrice && (
                                <p className="text-red-600 text-sm mt-1">{errors.currentPrice}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* アラート設定 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">アラート設定</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            アラートタイプ
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="alertType"
                                    value="below"
                                    checked={formData.alertType === 'below'}
                                    onChange={(e) => updateFormData('alertType', e.target.value)}
                                    className="mr-2"
                                />
                                <span>価格が指定した金額以下になったら通知</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="alertType"
                                    value="above"
                                    checked={formData.alertType === 'above'}
                                    onChange={(e) => updateFormData('alertType', e.target.value)}
                                    className="mr-2"
                                />
                                <span>価格が指定した金額以上になったら通知</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="alertType"
                                    value="change"
                                    checked={formData.alertType === 'change'}
                                    onChange={(e) => updateFormData('alertType', e.target.value)}
                                    className="mr-2"
                                />
                                <span>価格が指定した割合以上変動したら通知</span>
                            </label>
                        </div>
                    </div>

                    {formData.alertType === 'change' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                変動率 (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={formData.changePercentage}
                                onChange={(e) => updateFormData('changePercentage', parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.changePercentage ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="10"
                            />
                            {errors.changePercentage && (
                                <p className="text-red-600 text-sm mt-1">{errors.changePercentage}</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                目標価格 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                                <span className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50">
                                    {formData.currency === 'USD' ? '$' : '¥'}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.targetPrice}
                                    onChange={(e) => updateFormData('targetPrice', parseFloat(e.target.value) || 0)}
                                    className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.targetPrice ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="0"
                                />
                            </div>
                            {errors.targetPrice && (
                                <p className="text-red-600 text-sm mt-1">{errors.targetPrice}</p>
                            )}

                            {/* 推奨価格 */}
                            {formData.alertType === 'below' && suggestedPrices.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-2">推奨価格:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedPrices.map(({ label, value }) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => updateFormData('targetPrice', value)}
                                                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                                            >
                                                {label} ({formData.currency === 'USD' ? '$' : '¥'}{value.toLocaleString()})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 通知設定 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">通知設定</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            通知方法
                        </label>
                        <select
                            value={formData.notificationMethod}
                            onChange={(e) => updateFormData('notificationMethod', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="browser">ブラウザ通知</option>
                            <option value="email">メール通知</option>
                            <option value="both">ブラウザ + メール</option>
                        </select>
                    </div>
                </div>

                {/* メモ */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        メモ
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => updateFormData('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="このアラートについてのメモ（任意）"
                    />
                </div>

                {/* エラーメッセージ */}
                {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{errors.submit}</p>
                    </div>
                )}

                {/* アクションボタン */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '保存中...' : isEditing ? '更新' : '作成'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}