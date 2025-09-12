"use client";

import ClientPrice from '@/components/ClientPrice';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface ResultProduct {
  id: string;
  name: string;
  brand?: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  mainIngredients?: string[];
}

export function ResultCard({
  product,
  onAddToCompare,
  isInCompare,
}: {
  product: ResultProduct;
  onAddToCompare: (id: string) => void;
  isInCompare?: boolean;
}) {
  return (
    <div className='bg-white rounded-xl p-6 shadow-soft hover:shadow-strong transition-all hover:-translate-y-0.5 border border-gray-100'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='font-semibold text-gray-900'>{product.name}</h3>
        {product.brand && (
          <span className='text-xs text-gray-500'>{product.brand}</span>
        )}
      </div>
      {product.mainIngredients && product.mainIngredients.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-3'>
          {product.mainIngredients.slice(0, 3).map(ing => (
            <span
              key={ing}
              className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'
            >
              {ing}
            </span>
          ))}
        </div>
      )}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='text-xl font-bold text-primary-600'>
            <ClientPrice amount={product.priceJPY} />
          </div>
          <div className='text-xs text-gray-500'>
            {product.servingsPerContainer}回分 / 1日{product.servingsPerDay}回
          </div>
        </div>
        <button
          onClick={() => onAddToCompare(product.id)}
          className={cn(
            'px-3 py-2 rounded-lg text-sm border transition-colors',
            isInCompare
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          {isInCompare ? '比較中' : '比較に追加'}
        </button>
      </div>
      <Link
        href={`/products/${encodeURIComponent(product.id)}`}
        className='inline-flex items-center text-sm text-primary-700 hover:underline'
      >
        詳細を見る
        <span aria-hidden='true' className='ml-1'>→</span>
      </Link>
    </div>
  );
}
