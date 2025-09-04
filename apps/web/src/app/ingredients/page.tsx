import { Metadata } from 'next';
import IngredientsPageClient from './IngredientsPageClient';
import { generateSEO } from '@/lib/seo-config';

export const metadata = generateSEO({
    title: '成分ガイド - 科学的根拠に基づいたサプリメント成分情報',
    description: 'ビタミン・ミネラル・ハーブ・アミノ酸などの成分について、科学的根拠に基づいた詳細情報を提供。安全性と効果を理解してサプリメントを選択できます。',
    url: 'https://suptia.com/ingredients',
    keywords: ['成分', 'ビタミン', 'ミネラル', 'ハーブ', 'アミノ酸', '科学的根拠', '安全性', '効果'],
});

export default function IngredientsPage() {
    return <IngredientsPageClient />;
}