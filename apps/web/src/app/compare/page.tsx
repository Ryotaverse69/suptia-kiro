// ISR Configuration - Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export default function ComparePage() {
  return (
    <div>
      <h1>商品比較</h1>
      <p>サプリメントの成分量と価格を正確に比較できます</p>
      <a href="/">ホームに戻る</a>
    </div>
  );
}
