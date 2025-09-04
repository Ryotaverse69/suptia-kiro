export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="card p-8">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-8xl mb-4">🔍</div>
            <div className="text-6xl font-bold gradient-text mb-2">404</div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ページが見つかりません
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            お探しのページは存在しないか、移動された可能性があります。
            URLをご確認いただくか、以下のリンクからお探しください。
          </p>

          <div className="space-y-4">
            <a
              href="/"
              className="btn-primary w-full block"
            >
              🏠 ホームに戻る
            </a>

            <a
              href="/compare"
              className="btn-secondary w-full block"
            >
              📊 商品比較を見る
            </a>

            <a
              href="/products"
              className="btn-secondary w-full block"
            >
              📦 商品一覧を見る
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              お探しの情報が見つからない場合は、
              <a href="/contact" className="text-primary-600 hover:text-primary-800 underline ml-1">
                お問い合わせ
              </a>
              ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}