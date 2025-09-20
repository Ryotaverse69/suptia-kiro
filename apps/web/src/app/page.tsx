export default function HomePage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-4xl font-bold mb-6'>サプティア</h1>
      <h2 className='text-2xl font-bold mb-4'>
        サプリメント比較プラットフォーム
      </h2>
      <p className='text-gray-600 mb-8'>
        科学的根拠に基づくサプリメント比較サービスです。現在メンテナンス中です。
      </p>
      <div className='bg-blue-50 p-6 rounded-lg'>
        <h3 className='text-lg font-semibold mb-2'>🔧 メンテナンス中</h3>
        <p className='text-gray-700'>
          より良いサービスを提供するため、現在システムの改善を行っています。
          しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}
