"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              システムエラー
            </h2>
            <p className="text-gray-600 mb-6">
              システムレベルのエラーが発生しました。しばらく時間をおいてから再度お試しください。
            </p>
            <button
              onClick={reset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
