import { sanity } from "@/lib/sanity.client";
import Link from "next/link";

interface ProductListItem {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: { current: string };
}

async function getProducts(): Promise<ProductListItem[]> {
  const query = `*[_type == "product"] | order(_createdAt desc)[0..20]{
    name,
    priceJPY,
    servingsPerContainer,
    servingsPerDay,
    slug
  }`;
  try {
    const products = await sanity.fetch(query);
    return products || [];
  } catch (e) {
    console.error("Failed to fetch product list:", e);
    return [];
  }
}

export default async function ProductsIndexPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">商品一覧</h1>
        <p className="text-gray-600 mt-2">最新の商品を一覧表示します。</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">表示できる商品がありません</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Link key={p.slug.current} href={`/products/${p.slug.current}`} className="card p-6 hover:shadow-medium">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{p.name}</h2>
                <span className="text-primary-600 font-bold">¥{p.priceJPY?.toLocaleString?.() ?? p.priceJPY}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="mr-3">{p.servingsPerContainer}回分</span>
                <span>1日{p.servingsPerDay}回</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link href="/" className="btn-secondary">ホームに戻る</Link>
      </div>
    </div>
  );
}

