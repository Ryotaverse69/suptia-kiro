"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type FilterState = {
  purposes: string[]; // 疲労回復, 美容, 免疫
  priceRange: [number, number];
};

export function SearchFilters({
  value,
  onChange,
  aiSelectedConditions = ['疲労回復', '¥2000以下'],
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  aiSelectedConditions?: string[];
}) {
  const [open, setOpen] = useState({ purpose: true, price: true });

  const togglePurpose = (p: string) => {
    const exists = value.purposes.includes(p);
    const next = {
      ...value,
      purposes: exists
        ? value.purposes.filter(v => v !== p)
        : [...value.purposes, p],
    };
    onChange(next);
  };

  const setPrice = (idx: 0 | 1, val: number) => {
    const nextRange: [number, number] = [...value.priceRange] as any;
    nextRange[idx] = Math.max(0, Math.min(10000, val));
    if (nextRange[0] > nextRange[1]) nextRange[0] = nextRange[1];
    onChange({ ...value, priceRange: nextRange });
  };

  const clearAll = () => onChange({ purposes: [], priceRange: [0, 10000] });

  return (
    <aside className='sticky top-24 space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-900'>フィルター</h3>
        <button
          onClick={clearAll}
          className='text-xs text-gray-600 hover:text-gray-900 underline'
        >
          条件クリア
        </button>
      </div>

      {/* AIが選んだ条件 */}
      {aiSelectedConditions?.length > 0 && (
        <div>
          <div className='text-xs text-gray-500 mb-2'>AIが選んだ条件</div>
          <div className='flex flex-wrap gap-2'>
            {aiSelectedConditions.map((c, i) => (
              <button
                key={i}
                className='px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors'
                onClick={() => {
                  if (c === '疲労回復') togglePurpose('疲労回復');
                  if (c.includes('¥')) setPrice(1, 2000);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 目的 */}
      <div className='border border-gray-200 rounded-xl'>
        <button
          className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium'
          onClick={() => setOpen(s => ({ ...s, purpose: !s.purpose }))}
        >
          <span>目的</span>
          <span className='text-gray-500'>{open.purpose ? '−' : '+'}</span>
        </button>
        {open.purpose && (
          <div className='px-4 pb-3 space-y-2'>
            {['疲労回復', '美容', '免疫'].map(p => (
              <label key={p} className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={value.purposes.includes(p)}
                  onChange={() => togglePurpose(p)}
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-gray-700'>{p}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 価格帯 */}
      <div className='border border-gray-200 rounded-xl'>
        <button
          className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium'
          onClick={() => setOpen(s => ({ ...s, price: !s.price }))}
        >
          <span>価格帯</span>
          <span className='text-gray-500'>{open.price ? '−' : '+'}</span>
        </button>
        {open.price && (
          <div className='px-4 pb-4'>
            <div className='flex items-center gap-2 text-sm'>
              <input
                type='number'
                value={value.priceRange[0]}
                onChange={e => setPrice(0, Number(e.target.value) || 0)}
                min={0}
                max={10000}
                className='w-24 border rounded-lg px-2 py-1'
              />
              <span className='text-gray-500'>〜</span>
              <input
                type='number'
                value={value.priceRange[1]}
                onChange={e => setPrice(1, Number(e.target.value) || 0)}
                min={0}
                max={10000}
                className='w-24 border rounded-lg px-2 py-1'
              />
              <span className='text-gray-500'>円</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

