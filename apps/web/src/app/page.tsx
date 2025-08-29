import { sanityServerWithCache } from "@/lib/sanityServer";
import { calculateEffectiveCostPerDay, formatCostJPY } from "@/lib/cost";

// ISR Configuration - Revalidate every 30 minutes (1800 seconds)
export const revalidate = 1800;

interface Product {
  name: string;
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  slug: {
    current: string;
  };
}

async function getProducts(): Promise<Product[]> {
  const query = `*[_type == "product"] | order(priceJPY asc)[0..4]{ 
    name, 
    priceJPY, 
    servingsPerContainer, 
    servingsPerDay,
    slug
  }`;

  try {
    const products = await sanityServerWithCache.fetchProducts(query);
    return products || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">サプティア</h1>
      <p className="text-gray-600 mb-8">
        安全 × 価格 × 説明可能性のサプリ意思決定エンジン
      </p>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">お手頃価格の商品</h2>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    容量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    1日摂取量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    実効コスト/日
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => {
                  let effectiveCostPerDay = 0;
                  let costError = false;

                  try {
                    effectiveCostPerDay = calculateEffectiveCostPerDay({
                      priceJPY: product.priceJPY,
                      servingsPerContainer: product.servingsPerContainer,
                      servingsPerDay: product.servingsPerDay,
                    });
                  } catch (error) {
                    costError = true;
                  }

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <a
                          href={`/products/${product.slug?.current || "unknown"}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {product.name}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCostJPY(product.priceJPY)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.servingsPerContainer}回分
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.servingsPerDay}回/日
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {costError ? (
                          <span className="text-red-500">計算不可</span>
                        ) : (
                          <span className="font-semibold text-green-600">
                            {formatCostJPY(effectiveCostPerDay)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            商品データを読み込み中...
          </div>
        )}
      </div>

      <div className="mt-8">
        <a
          href="/compare"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          商品比較
        </a>
      </div>
    </div>
  );
}
