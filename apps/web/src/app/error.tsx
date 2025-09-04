"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-8">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            エラーが発生しました
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            申し訳ございません。予期しないエラーが発生しました。
            しばらく時間をおいてから再度お試しください。
          </p>

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">開発者情報:</h3>
              <p className="text-sm text-gray-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={reset}
              className="btn-primary w-full"
            >
              🔄 再試行
            </button>

            <a
              href="/"
              className="btn-secondary w-full block"
            >
              🏠 ホームに戻る
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              問題が続く場合は、
              <a href="/contact" className="text-primary-600 hover:text-primary-800 underline">
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