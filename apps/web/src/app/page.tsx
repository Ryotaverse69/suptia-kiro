export default function HomePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">サプティア</h1>
            <p className="text-gray-600 mb-8">
                安全 × 価格 × 説明可能性のサプリ意思決定エンジン
            </p>
            <div className="text-center py-8">
                <p>アプリケーションが正常にデプロイされました。</p>
            </div>
        </div>
    );
}

export const revalidate = 1800;
