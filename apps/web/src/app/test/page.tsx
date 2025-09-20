export default function TestPage() {
  return (
    <div>
      <h1>テストページ</h1>
      <p>このページが表示されれば、基本的なNext.jsの動作は正常です。</p>
      <p>環境変数:</p>
      <ul>
        <li>
          NEXT_PUBLIC_SANITY_PROJECT_ID:{' '}
          {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '未設定'}
        </li>
        <li>
          NEXT_PUBLIC_SANITY_DATASET:{' '}
          {process.env.NEXT_PUBLIC_SANITY_DATASET || '未設定'}
        </li>
        <li>NODE_ENV: {process.env.NODE_ENV}</li>
        <li>VERCEL_ENV: {process.env.VERCEL_ENV || '未設定'}</li>
      </ul>
    </div>
  );
}
