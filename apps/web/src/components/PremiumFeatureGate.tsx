'use client';

import { ReactNode } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { hasFeature, checkLimit, getMembershipStatus, type MembershipTier } from '../lib/membership';

interface PremiumFeatureGateProps {
    featureId?: string;
    limitType?: 'priceAlerts' | 'diagnosisHistory' | 'favoriteProducts' | 'comparisons';
    currentCount?: number;
    requiredTier?: MembershipTier;
    children: ReactNode;
    fallback?: ReactNode;
    onUpgrade?: () => void;
}

/**
 * プレミアム機能のアクセス制御コンポーネント
 */
export function PremiumFeatureGate({
    featureId,
    limitType,
    currentCount = 0,
    requiredTier,
    children,
    fallback,
    onUpgrade,
}: PremiumFeatureGateProps) {
    const membershipStatus = getMembershipStatus();

    // 機能チェック
    const hasRequiredFeature = featureId ? hasFeature(featureId) : true;

    // 制限チェック
    const limitCheck = limitType ? checkLimit(limitType, currentCount) : { allowed: true, limit: -1, remaining: -1 };

    // ティアチェック
    const hasRequiredTier = requiredTier ?
        getTierLevel(membershipStatus.tier) >= getTierLevel(requiredTier) : true;

    // アクセス許可の判定
    const hasAccess = hasRequiredFeature && limitCheck.allowed && hasRequiredTier;

    if (hasAccess) {
        return <>{children}</>;
    }

    // カスタムフォールバックがある場合はそれを使用
    if (fallback) {
        return <>{fallback}</>;
    }

    // デフォルトのアップグレード促進UI
    return (
        <Card className="p-6 text-center">
            <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getUpgradeTitle(featureId, limitType, requiredTier)}
                </h3>

                <p className="text-gray-600 mb-4">
                    {getUpgradeMessage(featureId, limitType, requiredTier, limitCheck)}
                </p>

                {/* 現在のプラン表示 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">現在のプラン:</span>
                    <Badge variant={getTierBadgeVariant(membershipStatus.tier)}>
                        {membershipStatus.tierName}
                    </Badge>
                </div>

                {/* 制限情報 */}
                {limitType && limitCheck.limit !== -1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="text-sm text-yellow-800">
                            <strong>制限に達しました</strong>
                            <br />
                            {getLimitMessage(limitType, limitCheck.limit, currentCount)}
                        </div>
                    </div>
                )}

                {/* 推奨プラン */}
                {requiredTier && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="text-sm text-blue-800">
                            <strong>推奨プラン:</strong> {getRequiredTierName(requiredTier)}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={onUpgrade}>
                    プランをアップグレード
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mypage'}>
                    マイページで確認
                </Button>
            </div>
        </Card>
    );
}

// ヘルパー関数
function getTierLevel(tier: MembershipTier): number {
    const levels = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    return levels[tier] || 0;
}

function getTierBadgeVariant(tier: MembershipTier): 'low' | 'medium' | 'high' | 'danger' {
    switch (tier) {
        case 'free': return 'low';
        case 'basic': return 'medium';
        case 'premium': return 'high';
        case 'enterprise': return 'danger';
        default: return 'low';
    }
}

function getRequiredTierName(tier: MembershipTier): string {
    const names = {
        free: '無料プラン',
        basic: 'ベーシックプラン',
        premium: 'プレミアムプラン',
        enterprise: 'エンタープライズプラン',
    };
    return names[tier] || tier;
}

function getUpgradeTitle(featureId?: string, limitType?: string, requiredTier?: MembershipTier): string {
    if (featureId) {
        const featureNames: Record<string, string> = {
            'advanced-analysis': '高度な分析機能',
            'priority-support': '優先サポート',
            'export-data': 'データエクスポート',
            'api-access': 'API アクセス',
            'custom-reports': 'カスタムレポート',
            'dedicated-support': '専任サポート',
        };
        return `${featureNames[featureId] || '特別機能'}をご利用いただくには`;
    }

    if (limitType) {
        const limitNames: Record<string, string> = {
            priceAlerts: '価格アラート',
            diagnosisHistory: '診断履歴',
            favoriteProducts: 'お気に入り',
            comparisons: '比較機能',
        };
        return `${limitNames[limitType]}の制限に達しました`;
    }

    if (requiredTier) {
        return `${getRequiredTierName(requiredTier)}が必要です`;
    }

    return 'プレミアム機能をご利用いただくには';
}

function getUpgradeMessage(
    featureId?: string,
    limitType?: string,
    requiredTier?: MembershipTier,
    limitCheck?: { limit: number; remaining: number }
): string {
    if (featureId) {
        return 'この機能をご利用いただくには、プランのアップグレードが必要です。';
    }

    if (limitType && limitCheck) {
        return `現在のプランでは${limitCheck.limit}件まで利用可能です。より多くご利用いただくには、プランのアップグレードをご検討ください。`;
    }

    if (requiredTier) {
        return `この機能は${getRequiredTierName(requiredTier)}以上でご利用いただけます。`;
    }

    return 'プランをアップグレードして、すべての機能をお楽しみください。';
}

function getLimitMessage(limitType: string, limit: number, current: number): string {
    const limitNames: Record<string, string> = {
        priceAlerts: '価格アラート',
        diagnosisHistory: '診断履歴の保存',
        favoriteProducts: 'お気に入り商品',
        comparisons: '商品比較',
    };

    return `${limitNames[limitType]}は${limit}件まで利用可能です（現在: ${current}件）`;
}

/**
 * 機能制限チェック用のフック風関数
 */
export function useFeatureAccess(featureId: string) {
    return {
        hasAccess: hasFeature(featureId),
        membershipStatus: getMembershipStatus(),
    };
}

/**
 * 制限チェック用のフック風関数
 */
export function useLimitCheck(limitType: 'priceAlerts' | 'diagnosisHistory' | 'favoriteProducts' | 'comparisons', currentCount: number) {
    return checkLimit(limitType, currentCount);
}