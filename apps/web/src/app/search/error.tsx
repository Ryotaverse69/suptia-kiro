'use client';

import Link from 'next/link';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center'>
      <div className='rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]'>
        <h1 className='text-2xl font-semibold text-slate-900'>
          検索結果の取得に失敗しました
        </h1>
        <p className='mt-3 text-sm text-slate-600'>
          ネットワークの不安定や一時的なエラーが原因かもしれません。少し時間をおいて再度お試しください。
        </p>
        <div className='mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
          <button
            type='button'
            onClick={reset}
            className='rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700'
          >
            検索を再試行
          </button>
          <Link
            href='/'
            className='rounded-full border border-primary-200 px-5 py-2 text-sm font-semibold text-primary-600 transition hover:border-primary-300 hover:text-primary-700'
          >
            ホームに戻る
          </Link>
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && error?.message ? (
        <p className='text-xs text-slate-500'>詳細: {error.message}</p>
      ) : null}
    </div>
  );
}
