import Link from 'next/link';

export function Footer() {
  return (
    <footer className='bg-white border-t border-gray-200/50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Main Footer Content */}
        <div className='py-16'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            {/* サプティアについて */}
            <div>
              <h3 className='text-sm font-medium text-gray-900 mb-4'>
                サプティア
              </h3>
              <ul className='space-y-3'>
                <li>
                  <Link
                    href='/about'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    サプティアとは
                  </Link>
                </li>
                <li>
                  <Link
                    href='/compare'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    製品比較
                  </Link>
                </li>
                <li>
                  <Link
                    href='/ingredients'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    成分ガイド
                  </Link>
                </li>
                <li>
                  <Link
                    href='/mypage/alerts'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    価格アラート
                  </Link>
                </li>
              </ul>
            </div>

            {/* サポート */}
            <div>
              <h3 className='text-sm font-medium text-gray-900 mb-4'>
                サポート
              </h3>
              <ul className='space-y-3'>
                <li>
                  <Link
                    href='/contact'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link
                    href='/help'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    ヘルプ
                  </Link>
                </li>
                <li>
                  <Link
                    href='/faq'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    よくある質問
                  </Link>
                </li>
              </ul>
            </div>

            {/* 法的情報 */}
            <div>
              <h3 className='text-sm font-medium text-gray-900 mb-4'>
                法的情報
              </h3>
              <ul className='space-y-3'>
                <li>
                  <Link
                    href='/legal/privacy'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link
                    href='/legal/terms'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link
                    href='/legal/disclaimer'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    免責事項
                  </Link>
                </li>
              </ul>
            </div>

            {/* 会社情報 */}
            <div>
              <h3 className='text-sm font-medium text-gray-900 mb-4'>
                会社情報
              </h3>
              <ul className='space-y-3'>
                <li>
                  <Link
                    href='/company'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    会社概要
                  </Link>
                </li>
                <li>
                  <Link
                    href='/careers'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    採用情報
                  </Link>
                </li>
                <li>
                  <Link
                    href='/press'
                    className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
                  >
                    プレスリリース
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='border-t border-gray-200/50 py-8'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <div className='flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6'>
              <p className='text-sm text-gray-600'>
                © 2025 サプティア (Suptia). All rights reserved.
              </p>
              <p className='text-xs text-gray-500'>
                本サービスは医療アドバイスを提供するものではありません
              </p>
            </div>

            <div className='flex items-center space-x-6'>
              <Link
                href='/sitemap'
                className='text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200'
              >
                サイトマップ
              </Link>
              <div className='flex items-center space-x-2 text-xs text-gray-500'>
                <span>日本</span>
                <svg
                  className='w-3 h-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
