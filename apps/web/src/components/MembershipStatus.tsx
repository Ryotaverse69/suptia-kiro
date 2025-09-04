'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
    getMembershipStatus,
    getPlanComparison,
    upgradePlan,
    type MembershipTier,
} from '../lib/membership';

interface MembershipStatusProps {
    onUpgrade?: (tier: MembershipTier) => void;
    onManageBilling?: () => void;
}

/**
 * 有料会員ステータス表示コンポーネント
 */
export function MembershipStatus({ onUpgrade, onManageBilling }: MembershipStatusProps) {
    const [status, setStatus] = useState(getMembershipStatus());
    const [showPlans, setShowPlans] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setStatus(getMembershipStatus());
    }, []);

    const handleUpgrade = async (tier: MembershipTier, interval: 'monthly' | 'yearly' = 'monthly') => {
        setIsLoading(true);
        try {
            upgradePlan(tier, interval);
            setStatus(getMembershipStatus());
            setShowPlans(false);
            onUpgrade?.(tier);
        } catch (error) {
            console.error('プランのアップグレードに失敗しました:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTierColor = (tier: MembershipTier): string => {
        switch (tier) {
            case 'free': return 'text-gray-600 bg-gray-50';
            case 'basic': return 'text-blue-600 bg-blue-50';
            case 'premium': return 'text-purple-600 bg-purple-50';
            case 'enterprise': return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getTierBadgeVariant = (tier: MembershipTier): 'low' | 'medium' | 'high' | 'danger' => {
        switch (tier) {
            case 'free': return 'low';
            case 'basic': return 'medium';
            case 'premium': return 'high';
            case 'enterprise': return 'danger';
            default: return 'low';
        }
    };

    const formatUsage = (current: number, limit: number): string => {
        if (limit === -1) return `${current} / 無制限`;
        return `${current} / ${limit}`;
    };

    const getUsagePercentage = (current: number, limit: number): number => {
        if (limit === -1) return 0;
        return Math.min(100, (current / limit) * 100);
    };

    const planComparison = getPlanComparison();

    return (
        <div className="space-y-6">
            {/* 現在のプラン状況 */}
            <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold text-gray-900">会員ステータス</h2>
                            <Badge variant={getTierBadgeVariant(status.tier)}>
                                {status.tierName}
                            </Badge>
                        </div>

                        {status.isActive ? (
                            <div className="space-y-1 text-sm text-gray-600">
                                {status.daysRemaining !== undefined && (
                                    <p>残り {status.daysRemaining} 日</p>
                                )}
                                {status.nextBillingDate && (
                                    <p>次回更新: {new Date(status.nextBillingDate).toLocaleDateString('ja-JP')}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-red-600 text-sm">プランが無効です</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPlans(!showPlans)}
                        >
                            プラン変更
                        </Button>
                        {status.tier !== 'free' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onManageBilling}
                            >
                                請求管理
                            </Button>
                        )}
                    </div>
                </div>

                {/* 利用状況 */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">利用状況</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">価格アラート</span>
                                <span className="font-medium">
                                    {formatUsage(status.usage.priceAlerts.current, status.usage.priceAlerts.limit)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${getUsagePercentage(status.usage.priceAlerts.current, status.usage.priceAlerts.limit)}%`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">診断履歴</span>
                                <span className="font-medium">
                                    {formatUsage(status.usage.diagnosisHistory.current, status.usage.diagnosisHistory.limit)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${getUsagePercentage(status.usage.diagnosisHistory.current, status.usage.diagnosisHistory.limit)}%`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">お気に入り</span>
                                <span className="font-medium">
                                    {formatUsage(status.usage.favoriteProducts.current, status.usage.favoriteProducts.limit)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${getUsagePercentage(status.usage.favoriteProducts.current, status.usage.favoriteProducts.limit)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 利用可能な機能 */}
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">利用可能な機能</h3>
                    <div className="flex flex-wrap gap-2">
                        {status.features.map(feature => (
                            <Badge key={feature.id} variant="info" className={getTierColor(feature.tier)}>
                                {feature.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            </Card>

            {/* プラン比較 */}
            {showPlans && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">プラン比較</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {planComparison.map(({ tier, plan, features, isCurrentPlan }) => (
                            <div
                                key={tier}
                                className={`border rounded-lg p-6 ${isCurrentPlan
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } transition-colors`}
                            >
                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        {plan.name}
                                    </h4>
                                    {isCurrentPlan && (
                                        <Badge variant="high" className="mb-2">
                                            現在のプラン
                                        </Badge>
                                    )}
                                    <div className="text-2xl font-bold text-gray-900">
                                        {plan.price.monthly === 0 ? (
                                            '無料'
                                        ) : (
                                            <>
                                                ¥{plan.price.monthly.toLocaleString()}
                                                <span className="text-sm font-normal text-gray-600">/月</span>
                                            </>
                                        )}
                                    </div>
                                    {plan.price.yearly > 0 && (
                                        <div className="text-sm text-gray-600">
                                            年額: ¥{plan.price.yearly.toLocaleString()}
                                            <span className="text-green-600 ml-1">
                                                (2ヶ月分お得)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 mb-1">制限</div>
                                        <ul className="space-y-1 text-gray-600">
                                            <li>価格アラート: {plan.limits.priceAlerts === -1 ? '無制限' : `${plan.limits.priceAlerts}件`}</li>
                                            <li>診断履歴: {plan.limits.diagnosisHistory === -1 ? '無制限' : `${plan.limits.diagnosisHistory}件`}</li>
                                            <li>お気に入り: {plan.limits.favoriteProducts === -1 ? '無制限' : `${plan.limits.favoriteProducts}件`}</li>
                                        </ul>
                                    </div>

                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 mb-1">機能</div>
                                        <ul className="space-y-1">
                                            {features.map(feature => (
                                                <li key={feature.id} className="text-gray-600 text-xs">
                                                    • {feature.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {!isCurrentPlan && (
                                    <div className="space-y-2">
                                        {plan.price.monthly > 0 && (
                                            <>
                                                <Button
                                                    className="w-full"
                                                    onClick={() => handleUpgrade(tier, 'monthly')}
                                                    disabled={isLoading}
                                                >
                                                    月額プランにする
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => handleUpgrade(tier, 'yearly')}
                                                    disabled={isLoading}
                                                >
                                                    年額プランにする
                                                </Button>
                                            </>
                                        )}
                                        {tier === 'free' && status.tier !== 'free' && (
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => handleUpgrade(tier)}
                                                disabled={isLoading}
                                            >
                                                無料プランに変更
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}