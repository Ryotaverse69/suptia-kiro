#!/usr/bin/env node

/**
 * スコアリングエンジンのデモスクリプト
 * 実際の商品データでスコア計算をテストする
 */

import { score, DEFAULT_WEIGHTS } from './scoring.js';

// デモ用商品データ
const demoProducts = [
  {
    name: 'プレミアムビタミンC',
    brand: 'HealthPro',
    ingredients: [
      {
        ingredient: {
          name: 'ビタミンC（アスコルビン酸）',
          evidenceLevel: 'A',
          safetyNotes: [],
          category: 'vitamin'
        },
        amountMgPerServing: 1000
      }
    ],
    servingsPerDay: 1,
    servingsPerContainer: 90,
    priceJPY: 2980,
    form: 'capsule',
    warnings: [],
    thirdPartyTested: true
  },
  {
    name: 'マルチビタミン＆ミネラル',
    brand: 'NutriMax',
    ingredients: [
      {
        ingredient: {
          name: 'ビタミンD3',
          evidenceLevel: 'A',
          safetyNotes: ['高用量摂取時の注意'],
          category: 'vitamin'
        },
        amountMgPerServing: 0.025
      },
      {
        ingredient: {
          name: 'マグネシウム',
          evidenceLevel: 'B',
          safetyNotes: [],
          category: 'mineral'
        },
        amountMgPerServing: 200
      },
      {
        ingredient: {
          name: 'ハーブエキス',
          evidenceLevel: 'C',
          safetyNotes: ['アレルギー反応の可能性', '薬物相互作用'],
          category: 'herb'
        },
        amountMgPerServing: 50
      }
    ],
    servingsPerDay: 2,
    servingsPerContainer: 60,
    priceJPY: 4500,
    form: 'tablet',
    warnings: ['妊娠中・授乳中は使用しない', '薬を服用中の方は医師に相談'],
    thirdPartyTested: false
  },
  {
    name: 'エコノミーサプリ',
    brand: 'BasicHealth',
    ingredients: [
      {
        ingredient: {
          name: '合成ビタミン',
          evidenceLevel: 'C',
          safetyNotes: ['胃腸症状'],
          category: 'vitamin'
        },
        amountMgPerServing: 500
      }
    ],
    servingsPerDay: 3,
    servingsPerContainer: 30,
    priceJPY: 980,
    form: 'powder',
    warnings: ['品質にばらつきがある可能性'],
    thirdPartyTested: false
  }
];

console.log('🧮 商品スコアリングエンジン デモ');
console.log('=' .repeat(50));

demoProducts.forEach((product, index) => {
  console.log(`\n📦 商品 ${index + 1}: ${product.name} (${product.brand})`);
  console.log('-'.repeat(40));
  
  try {
    const result = score(product);
    
    // 総合スコア表示
    console.log(`🏆 総合スコア: ${result.total}/100`);
    
    // 個別スコア表示
    console.log('\n📊 個別スコア:');
    console.log(`  エビデンス (${(result.weights.evidence * 100).toFixed(0)}%): ${result.components.evidence}/100`);
    console.log(`  安全性     (${(result.weights.safety * 100).toFixed(0)}%): ${result.components.safety}/100`);
    console.log(`  コスト     (${(result.weights.cost * 100).toFixed(0)}%): ${result.components.cost}/100`);
    console.log(`  実用性     (${(result.weights.practicality * 100).toFixed(0)}%): ${result.components.practicality}/100`);
    
    // データ完全性
    console.log(`\n✅ データ完全性: ${result.isComplete ? '完全' : '不完全'}`);
    if (!result.isComplete) {
      console.log(`⚠️  不足データ: ${result.missingData.join(', ')}`);
    }
    
    // 詳細情報（エビデンススコアの例）
    console.log('\n🔍 エビデンススコア詳細:');
    result.breakdown.evidence.factors.forEach(factor => {
      console.log(`  ${factor.name}: ${factor.value.toFixed(1)} (${factor.description})`);
    });
    
    // 安全性スコア詳細
    console.log('\n🛡️  安全性スコア詳細:');
    result.breakdown.safety.factors.forEach(factor => {
      console.log(`  ${factor.name}: ${factor.value.toFixed(1)} (${factor.description})`);
    });
    
  } catch (error) {
    console.error(`❌ エラー: ${error.message}`);
  }
});

// 重み設定のテスト
console.log('\n\n🎛️  カスタム重み設定のテスト');
console.log('=' .repeat(50));

const customWeights = {
  evidence: 0.5,   // エビデンス重視
  safety: 0.3,     // 安全性重視
  cost: 0.1,       // コスト軽視
  practicality: 0.1 // 実用性軽視
};

const testProduct = demoProducts[1]; // マルチビタミン
console.log(`\n📦 テスト商品: ${testProduct.name}`);

console.log('\n🔄 デフォルト重み vs カスタム重み:');
const defaultResult = score(testProduct, DEFAULT_WEIGHTS);
const customResult = score(testProduct, customWeights);

console.log(`デフォルト重み: ${defaultResult.total}/100`);
console.log(`カスタム重み:   ${customResult.total}/100`);
console.log(`差分: ${(customResult.total - defaultResult.total).toFixed(1)}ポイント`);

console.log('\n✨ デモ完了！');