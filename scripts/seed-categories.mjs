#!/usr/bin/env node

/**
 * トリバゴクローン用カテゴリデータの初期投入スクリプト
 * 
 * 実行方法:
 * node scripts/seed-categories.mjs
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

const client = createClient({
  projectId: 'fny3jdcg',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // 書き込み権限が必要
  apiVersion: '2024-01-01',
});

// トリバゴクローン用の初期カテゴリデータ
const categories = [
  {
    _type: 'category',
    name: 'ビタミンD',
    slug: { _type: 'slug', current: 'vitamin-d' },
    description: '骨の健康維持や免疫機能をサポートするビタミンD商品',
    averagePrice: 2980,
    productCount: 1234,
    displayOrder: 1,
    isPopular: true,
    priceHistory: [
      { month: '2024-01', averagePrice: 3200 },
      { month: '2024-02', averagePrice: 3100 },
      { month: '2024-03', averagePrice: 3050 },
      { month: '2024-04', averagePrice: 2980 },
      { month: '2024-05', averagePrice: 2900 },
      { month: '2024-06', averagePrice: 2850 },
      { month: '2024-07', averagePrice: 2800 },
      { month: '2024-08', averagePrice: 2750 },
      { month: '2024-09', averagePrice: 2700 },
      { month: '2024-10', averagePrice: 2680 },
      { month: '2024-11', averagePrice: 2650 },
      { month: '2024-12', averagePrice: 2620 },
    ],
    seoTitle: 'ビタミンD サプリメント価格比較 - サプティア',
    seoDescription: '1,234商品のビタミンDサプリメントを価格比較。最安値でビタミンDを購入できます。',
  },
  {
    _type: 'category',
    name: 'プロテイン',
    slug: { _type: 'slug', current: 'protein' },
    description: '筋肉の成長と回復をサポートするプロテイン商品',
    averagePrice: 4580,
    productCount: 2156,
    displayOrder: 2,
    isPopular: true,
    priceHistory: [
      { month: '2024-01', averagePrice: 4800 },
      { month: '2024-02', averagePrice: 4750 },
      { month: '2024-03', averagePrice: 4700 },
      { month: '2024-04', averagePrice: 4650 },
      { month: '2024-05', averagePrice: 4600 },
      { month: '2024-06', averagePrice: 4580 },
      { month: '2024-07', averagePrice: 4560 },
      { month: '2024-08', averagePrice: 4540 },
      { month: '2024-09', averagePrice: 4520 },
      { month: '2024-10', averagePrice: 4500 },
      { month: '2024-11', averagePrice: 4480 },
      { month: '2024-12', averagePrice: 4460 },
    ],
    seoTitle: 'プロテイン サプリメント価格比較 - サプティア',
    seoDescription: '2,156商品のプロテインサプリメントを価格比較。最安値でプロテインを購入できます。',
  },
  {
    _type: 'category',
    name: 'マルチビタミン',
    slug: { _type: 'slug', current: 'multivitamin' },
    description: '複数のビタミンをバランス良く配合したマルチビタミン商品',
    averagePrice: 3450,
    productCount: 987,
    displayOrder: 3,
    isPopular: true,
    priceHistory: [
      { month: '2024-01', averagePrice: 3600 },
      { month: '2024-02', averagePrice: 3580 },
      { month: '2024-03', averagePrice: 3560 },
      { month: '2024-04', averagePrice: 3540 },
      { month: '2024-05', averagePrice: 3520 },
      { month: '2024-06', averagePrice: 3500 },
      { month: '2024-07', averagePrice: 3480 },
      { month: '2024-08', averagePrice: 3460 },
      { month: '2024-09', averagePrice: 3450 },
      { month: '2024-10', averagePrice: 3440 },
      { month: '2024-11', averagePrice: 3430 },
      { month: '2024-12', averagePrice: 3420 },
    ],
    seoTitle: 'マルチビタミン サプリメント価格比較 - サプティア',
    seoDescription: '987商品のマルチビタミンサプリメントを価格比較。最安値でマルチビタミンを購入できます。',
  },
  {
    _type: 'category',
    name: 'オメガ3',
    slug: { _type: 'slug', current: 'omega-3' },
    description: '心血管の健康をサポートするオメガ3脂肪酸商品',
    averagePrice: 3780,
    productCount: 756,
    displayOrder: 4,
    isPopular: true,
    priceHistory: [
      { month: '2024-01', averagePrice: 3950 },
      { month: '2024-02', averagePrice: 3920 },
      { month: '2024-03', averagePrice: 3890 },
      { month: '2024-04', averagePrice: 3860 },
      { month: '2024-05', averagePrice: 3830 },
      { month: '2024-06', averagePrice: 3800 },
      { month: '2024-07', averagePrice: 3780 },
      { month: '2024-08', averagePrice: 3760 },
      { month: '2024-09', averagePrice: 3740 },
      { month: '2024-10', averagePrice: 3720 },
      { month: '2024-11', averagePrice: 3700 },
      { month: '2024-12', averagePrice: 3680 },
    ],
    seoTitle: 'オメガ3 サプリメント価格比較 - サプティア',
    seoDescription: '756商品のオメガ3サプリメントを価格比較。最安値でオメガ3を購入できます。',
  },
  {
    _type: 'category',
    name: 'コラーゲン',
    slug: { _type: 'slug', current: 'collagen' },
    description: '美容と関節の健康をサポートするコラーゲン商品',
    averagePrice: 4200,
    productCount: 643,
    displayOrder: 5,
    isPopular: true,
    priceHistory: [
      { month: '2024-01', averagePrice: 4400 },
      { month: '2024-02', averagePrice: 4380 },
      { month: '2024-03', averagePrice: 4360 },
      { month: '2024-04', averagePrice: 4340 },
      { month: '2024-05', averagePrice: 4320 },
      { month: '2024-06', averagePrice: 4300 },
      { month: '2024-07', averagePrice: 4280 },
      { month: '2024-08', averagePrice: 4260 },
      { month: '2024-09', averagePrice: 4240 },
      { month: '2024-10', averagePrice: 4220 },
      { month: '2024-11', averagePrice: 4200 },
      { month: '2024-12', averagePrice: 4180 },
    ],
    seoTitle: 'コラーゲン サプリメント価格比較 - サプティア',
    seoDescription: '643商品のコラーゲンサプリメントを価格比較。最安値でコラーゲンを購入できます。',
  },
  {
    _type: 'category',
    name: '鉄分',
    slug: { _type: 'slug', current: 'iron' },
    description: '貧血予防と酸素運搬をサポートする鉄分商品',
    averagePrice: 2650,
    productCount: 432,
    displayOrder: 6,
    isPopular: true,
    priceHistory: [
      { month: '2024-01', averagePrice: 2800 },
      { month: '2024-02', averagePrice: 2780 },
      { month: '2024-03', averagePrice: 2760 },
      { month: '2024-04', averagePrice: 2740 },
      { month: '2024-05', averagePrice: 2720 },
      { month: '2024-06', averagePrice: 2700 },
      { month: '2024-07', averagePrice: 2680 },
      { month: '2024-08', averagePrice: 2670 },
      { month: '2024-09', averagePrice: 2660 },
      { month: '2024-10', averagePrice: 2650 },
      { month: '2024-11', averagePrice: 2640 },
      { month: '2024-12', averagePrice: 2630 },
    ],
    seoTitle: '鉄分 サプリメント価格比較 - サプティア',
    seoDescription: '432商品の鉄分サプリメントを価格比較。最安値で鉄分を購入できます。',
  },
];

async function seedCategories() {
  console.log('🚀 カテゴリデータの投入を開始します...');

  try {
    // 既存のカテゴリを確認
    const existingCategories = await client.fetch('*[_type == "category"]');
    console.log(`📊 既存カテゴリ数: ${existingCategories.length}`);

    // 各カテゴリを作成または更新
    for (const category of categories) {
      const existing = existingCategories.find(
        (c) => c.slug?.current === category.slug.current
      );

      if (existing) {
        console.log(`🔄 カテゴリを更新: ${category.name}`);
        await client
          .patch(existing._id)
          .set({
            ...category,
            _id: existing._id,
            _rev: existing._rev,
          })
          .commit();
      } else {
        console.log(`✨ カテゴリを新規作成: ${category.name}`);
        await client.create(category);
      }
    }

    console.log('✅ カテゴリデータの投入が完了しました！');
    console.log('\n📋 投入されたカテゴリ:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.productCount}商品, 平均¥${cat.averagePrice.toLocaleString()})`);
    });

    console.log('\n🎯 次のステップ:');
    console.log('1. Sanity Studioでカテゴリデータを確認');
    console.log('2. 各カテゴリに画像をアップロード');
    console.log('3. 商品データにカテゴリを関連付け');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (process.argv[1].endsWith('seed-categories.mjs')) {
  seedCategories();
}

export { seedCategories, categories };