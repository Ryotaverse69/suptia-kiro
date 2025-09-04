'use client';

import { useRouter } from 'next/navigation';
import { MembershipStatus } from '../../../components/MembershipStatus';
import { type MembershipTier } from '../../../lib/membership';

export default function PremiumPage() {
    const router = useRouter();

    const handleUpgrade = (tier: MembershipTier) => {
        // 実際の実装では決済処理を行う
        alert(`${tier}プランにアップグレードしました！`);
    };

    const handleManageBilling = () => {
        // 実際の実装では請求管理ページに遷移
        alert('請求管理機能は開発中です');
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

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">プレミアム会員</h1>
                    <p className="text-gray-600">
                        会員プランの管理と特典の確認ができます。
                    </p>
                </div>

                {/* 会員ステータス */}
                <MembershipStatus
                    onUpgrade={handleUpgrade}
                    onManageBilling={handleManageBilling}
                />
            </div>
        </div>
    );
}