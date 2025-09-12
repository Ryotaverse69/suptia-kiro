"use client";

import { useMemo, useState } from 'react';
import { SearchFilters, type FilterState } from '@/components/search/SearchFilters';
import { ResultCard, type ResultProduct } from '@/components/search/ResultCard';
import { CompareTray } from '@/components/search/CompareTray';

export default function SearchPageClient({ initialProducts, aiConditions }: { initialProducts: ResultProduct[]; aiConditions?: string[] }) {
  const [filters, setFilters] = useState<FilterState>({ purposes: [], priceRange: [0, 10000] });
  const [view, setView] = useState<'card' | 'list'>('card');
  const [sort, setSort] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [compare, setCompare] = useState<ResultProduct[]>([]);

  const products = useMemo(() => {
    let data = [...initialProducts];
    // Filter by price
    data = data.filter(p => p.priceJPY >= filters.priceRange[0] && p.priceJPY <= filters.priceRange[1]);
    // Filter by purposes (simple includes on mainIngredients)
    if (filters.purposes.length > 0) {
      data = data.filter(p => {
        const tags = (p.mainIngredients || []).join(',');
        return filters.purposes.some(tag => tags.includes(tag));
      });
    }
    // Sort
    data.sort((a, b) => (sort === 'price_asc' ? a.priceJPY - b.priceJPY : b.priceJPY - a.priceJPY));
    return data;
  }, [initialProducts, filters, sort]);

  const toggleCompare = (id: string) => {
    const exists = compare.find(p => p.id === id);
    if (exists) {
      setCompare(compare.filter(p => p.id !== id));
    } else if (compare.length < 4) {
      const prod = initialProducts.find(p => p.id === id);
      if (prod) setCompare([...compare, prod]);
    }
  };

  return (
    <div className='max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8'>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Left: Filters */}
        <div className='lg:col-span-1'>
          <SearchFilters value={filters} onChange={setFilters} aiSelectedConditions={aiConditions}
          />
        </div>

        {/* Right: Results */}
        <div className='lg:col-span-3'>
          <div className='flex items-center justify-between mb-6'>
            <p className='text-gray-600'>{products.length}件の商品が見つかりました</p>
            <div className='flex items-center gap-3'>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as any)}
                className='border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white'
              >
                <option value='price_asc'>価格の安い順</option>
                <option value='price_desc'>価格の高い順</option>
              </select>
              <div className='flex border border-gray-300 rounded-lg overflow-hidden'>
                <button
                  onClick={() => setView('card')}
                  className={`px-3 py-2 ${view === 'card' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  カード
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-2 ${view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  リスト
                </button>
              </div>
            </div>
          </div>

          <div className={view === 'card' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {products.map(p => (
              <ResultCard
                key={p.id}
                product={p}
                onAddToCompare={toggleCompare}
                isInCompare={!!compare.find(c => c.id === p.id)}
              />)
            )}
          </div>
        </div>
      </div>

      <CompareTray
        items={compare.map(c => ({ id: c.id, name: c.name }))}
        onRemove={id => setCompare(compare.filter(c => c.id !== id))}
      />
    </div>
  );
}
