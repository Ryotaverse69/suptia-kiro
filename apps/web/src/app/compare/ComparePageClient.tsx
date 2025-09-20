'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  ComparisonTable,
  type ComparisonProduct,
} from '@/components/compare/ComparisonTable';

interface ComparePageClientProps {
  initialProducts: ComparisonProduct[];
}

export function ComparePageClient({ initialProducts }: ComparePageClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRemove = (id: string) => {
    const nextProducts = products.filter(product => product.id !== id);
    setProducts(nextProducts);

    const params = new URLSearchParams(searchParams.toString());
    const remainingIds = nextProducts.map(product => product.id);

    if (remainingIds.length > 0) {
      params.set('ids', remainingIds.join(','));
    } else {
      params.delete('ids');
    }

    const query = params.toString();
    router.replace(`/compare${query ? `?${query}` : ''}`);
  };

  if (!products || products.length === 0) {
    return (
      <div className='rounded-[16px] border border-[#e0e0e0] bg-white p-8 text-center shadow-trivago-card'>
        <p className='text-sm text-neutral-600'>
          比較対象が未選択です。検索ページから商品を追加してください。
        </p>
      </div>
    );
  }

  return <ComparisonTable products={products} onRemove={handleRemove} />;
}
