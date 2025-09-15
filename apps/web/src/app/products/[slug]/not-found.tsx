export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        商品が見つかりません
      </h1>
      <p className="text-gray-600 mb-8">
        お探しの商品は存在しないか、削除された可能性があります。
      </p>
      <a
        href="/"
        className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
      >
        ホームに戻る
      </a>
    </div>
  );
}
