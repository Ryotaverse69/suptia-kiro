export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Main spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>

          {/* Floating dots */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-secondary-400 rounded-full animate-bounce"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          読み込み中...
        </h2>
        <p className="text-gray-600">
          最適なサプリメント情報を準備しています
        </p>

        {/* Progress bar */}
        <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mt-6">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
}