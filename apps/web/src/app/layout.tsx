import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "サプティア | サプリメント比較プラットフォーム",
  description:
    "科学的なデータと洗練されたUIでサプリメントを比較。成分情報・価格・エビデンスを1つの画面で素早く確認できます。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
