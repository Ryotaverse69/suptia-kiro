'use client';

import React from 'react';

function IconSearch() {
  return (
    <svg
      className='w-6 h-6 text-gray-800'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M21 21l-5.2-5.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z'
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className='w-6 h-6 text-gray-800'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M8 7V3m8 4V3M3 9h18M5 12h14M5 16h10M5 20h14'
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      className='w-6 h-6 text-gray-800'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M23 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'
      />
    </svg>
  );
}

export default function TrivagoLikeSearchBar() {
  return (
    <div className='w-full'>
      <div className='rounded-[999px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5 overflow-hidden'>
        <div className='flex items-stretch'>
          {/* left segment */}
          <div className='flex-1 min-w-0 flex items-center gap-3 px-5 py-3'>
            <IconSearch />
            <div className='min-w-0'>
              <div className='text-sm text-gray-500'>目的地</div>
              <div className='font-bold text-gray-900 truncate'>箱根</div>
            </div>
            <button
              aria-label='クリア'
              className='ml-auto text-gray-500 hover:text-gray-700'
            >
              ×
            </button>
          </div>

          {/* divider */}
          <div className='w-px bg-gray-200' />

          {/* middle segment */}
          <div className='flex-1 min-w-0 flex items-center gap-3 px-5 py-3'>
            <IconCalendar />
            <div className='min-w-0'>
              <div className='text-sm text-gray-500'>チェックイン/アウト</div>
              <div className='font-bold text-gray-900 truncate'>
                10月11日 - 10月12日
              </div>
            </div>
          </div>

          {/* divider */}
          <div className='w-px bg-gray-200' />

          {/* right segment */}
          <div className='flex-1 min-w-0 flex items-center gap-3 px-5 py-3'>
            <IconUsers />
            <div className='min-w-0'>
              <div className='text-sm text-gray-500'>滞在人数と部屋数</div>
              <div className='font-bold text-gray-900 truncate'>2人、1部屋</div>
            </div>
          </div>

          {/* search button */}
          <div className='pl-2 pr-3 py-3 flex items-center'>
            <button className='h-12 px-6 rounded-full bg-[#0a66b7] text-white font-bold shadow-[0_1px_6px_rgba(0,0,0,0.08)] hover:brightness-110'>
              検索
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
