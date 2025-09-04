export function SkipLinks() {
  return (
    <div className='sr-only focus:not-sr-only'>
      <a
        href='#main-content'
        className='absolute top-0 left-0 z-50 bg-primary-600 text-white px-4 py-2 rounded-br-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
      >
        メインコンテンツにスキップ
      </a>
      <a
        href='#navigation'
        className='absolute top-0 left-32 z-50 bg-primary-600 text-white px-4 py-2 rounded-br-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
      >
        ナビゲーションにスキップ
      </a>
    </div>
  );
}
