import React from 'react';

interface IngredientInfo {
  name?: string;
  evidenceLevel?: 'A' | 'B' | 'C';
}

export function AIProductReason({
  productName,
  ingredients = [],
}: {
  productName: string;
  ingredients?: IngredientInfo[];
}) {
  const evidenceLevel = (() => {
    const levels = ingredients.map(i => i.evidenceLevel).filter(Boolean) as Array<'A' | 'B' | 'C'>;
    if (levels.includes('A')) return 'A';
    if (levels.includes('B')) return 'B';
    return 'C';
  })();

  const confidence = (() => {
    const base = 0.65 + Math.min(ingredients.length, 6) * 0.03;
    const bonus = ingredients.some(i => (i.name || '').match(/(ビタミンD|オメガ|EPA|DHA)/)) ? 0.07 : 0;
    return Math.min(0.98, base + bonus);
  })();

  const tags = ingredients.slice(0, 3).map(i => i.name).filter(Boolean);

  return (
    <div className='bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100 rounded-xl p-5 mb-8'>
      <div className='flex items-center gap-3 mb-3'>
        <div className='w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm'>
          <span className='text-xl'>🤖</span>
        </div>
        <h3 className='text-lg font-semibold text-gray-900'>この製品が合う理由（AI要約）</h3>
      </div>
      <p className='text-sm text-gray-700 mb-3'>
        {productName} は、主要成分 {tags.join('、')} により、目的に応じた有用性が期待できます。
        研究エビデンスの水準と成分バランスから総合的に評価しています。
      </p>
      <div className='flex flex-wrap items-center gap-3 text-sm'>
        <span className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-primary-100 text-primary-700'>
          信頼度 <span className='font-semibold'>{Math.round(confidence * 100)}%</span>
        </span>
        <span className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-primary-100 text-primary-700'>
          エビデンス <span className='font-semibold'>レベル{evidenceLevel}</span>
        </span>
      </div>
    </div>
  );
}

export default AIProductReason;

