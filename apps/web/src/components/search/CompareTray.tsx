'use client';

import { useRouter } from 'next/navigation';

export interface CompareItem {
  id: string;
  name: string;
}

export function CompareTray({
  items,
  onRemove,
  max = 4,
}: {
  items: CompareItem[];
  onRemove: (id: string) => void;
  max?: number;
}) {
  const router = useRouter();
  if (!items || items.length === 0) return null;

  return (
    <div
      className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40'
      role='region'
      aria-label='比較リスト'
      aria-live='polite'
    >
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-gray-600'>
            比較中: {items.length}/{max}件
          </span>
          <div className='flex gap-2'>
            {items.map(it => (
              <div
                key={it.id}
                className='flex items-center gap-2 border rounded-lg px-2 py-1'
              >
                <span className='text-sm text-gray-700'>{it.name}</span>
                <button
                  onClick={() => onRemove(it.id)}
                  className='text-gray-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'
                  aria-label={`${it.name} を比較から削除`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            params.set('ids', items.map(item => item.id).join(','));
            router.push(`/compare?${params.toString()}`);
          }}
          className='px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'
          aria-label='比較ページで詳細を見る'
        >
          比較する
        </button>
      </div>
    </div>
  );
}
