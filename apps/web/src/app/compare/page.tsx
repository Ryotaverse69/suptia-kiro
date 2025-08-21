"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Product,
  SortField,
  SortDirection,
} from "../../components/compare/types";
import { sortProducts } from "../../lib/compare/sort-utils";
import {
  usePerformanceMonitor,
  logPerformanceMetrics,
} from "../../lib/performance/monitor";

// Dynamic imports for code splitting
const ProductCompareTable = dynamic(
  () =>
    import("../../components/compare/ProductCompareTable").then((mod) => ({
      default: mod.ProductCompareTable,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-gray-500">比較テーブルを読み込み中...</div>
      </div>
    ),
    ssr: false, // Client-side only for better performance
  },
);

const CompareItemListJsonLd = dynamic(
  () =>
    import("../../components/seo/CompareItemListJsonLd").then((mod) => ({
      default: mod.CompareItemListJsonLd,
    })),
  {
    loading: () => null,
    ssr: true, // SEO component should be server-side rendered
  },
);

// Mock data for demonstration - in real app this would come from API/props
const mockProducts: Product[] = [
  {
    id: "1",
    name: "ビタミンD3 サプリメント",
    price: 2980,
    totalScore: 85,
    scoreBreakdown: { safety: 90, efficacy: 80, quality: 85 },
    warnings: [
      {
        id: "w1",
        type: "warning",
        category: "dosage",
        message: "推奨摂取量を超える可能性があります",
        severity: 5,
        productId: "1",
      },
    ],
    imageUrl: "/products/vitamin-d3.jpg",
    url: "/products/vitamin-d3-supplement",
  },
  {
    id: "2",
    name: "オメガ3 フィッシュオイル",
    price: 3500,
    totalScore: 92,
    scoreBreakdown: { safety: 95, efficacy: 90, quality: 90 },
    warnings: [],
    imageUrl: "/products/omega3.jpg",
    url: "/products/omega3-fish-oil",
  },
  {
    id: "3",
    name: "マルチビタミン",
    price: 1980,
    totalScore: 78,
    scoreBreakdown: { safety: 85, efficacy: 70, quality: 80 },
    warnings: [
      {
        id: "w2",
        type: "critical",
        category: "interaction",
        message: "他の薬剤との相互作用の可能性",
        severity: 8,
        productId: "3",
      },
    ],
    imageUrl: "/products/multivitamin.jpg",
    url: "/products/multivitamin",
  },
];

const MAX_PRODUCTS = 3;

export default function ComparePage() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "score",
    direction: "desc",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Performance monitoring
  const { metrics, compliance, disconnect } = usePerformanceMonitor(
    process.env.NODE_ENV === "development",
  );

  useEffect(() => {
    // Set current URL for JSON-LD
    setCurrentUrl(window.location.href);

    // Load products from URL params or localStorage in real implementation
    // For now, use mock data (simulate loading 2 products initially)
    setSelectedProducts(mockProducts.slice(0, 2));

    // Log performance metrics in development
    const timer = setTimeout(() => {
      logPerformanceMetrics(metrics);
    }, 3000);

    return () => {
      clearTimeout(timer);
      disconnect?.();
    };
  }, [metrics, disconnect]);

  // Handle product removal with table updates
  const handleProductRemove = useCallback((productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    setErrorMessage(""); // Clear any error messages when removing products
  }, []);

  // Handle adding products with limit enforcement
  const handleProductAdd = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      if (prev.length >= MAX_PRODUCTS) {
        setErrorMessage(
          `最大${MAX_PRODUCTS}製品まで比較できます。他の製品を削除してから追加してください。`,
        );
        return prev;
      }

      if (prev.find((p) => p.id === product.id)) {
        setErrorMessage("この製品は既に比較リストに含まれています。");
        return prev;
      }

      setErrorMessage("");
      return [...prev, product];
    });
  }, []);

  // Handle sorting with state management
  const handleSort = useCallback(
    (field: SortField, direction: SortDirection) => {
      setSortConfig({ field, direction });
    },
    [],
  );

  // Clear all products
  const handleClearAll = useCallback(() => {
    setSelectedProducts([]);
    setErrorMessage("");
  }, []);

  // Get sorted products
  const sortedProducts = sortProducts(selectedProducts, sortConfig);

  // Dynamic layout classes based on product count
  const getLayoutClasses = () => {
    const count = selectedProducts.length;
    if (count === 0) return "";
    if (count === 1) return "max-w-2xl mx-auto";
    if (count === 2) return "max-w-4xl mx-auto";
    return "max-w-6xl mx-auto"; // 3 products
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD structured data for SEO */}
      {selectedProducts.length > 0 && (
        <CompareItemListJsonLd
          products={sortedProducts}
          pageUrl={currentUrl}
          title={`製品比較: ${sortedProducts.map((p) => p.name).join(" vs ")}`}
          description={`${sortedProducts.length}製品のサプリメント比較。価格、成分、安全性を詳細に比較検討できます。`}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            製品比較
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            サプリメントの成分量と価格を正確に比較できます
          </p>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-6 max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setErrorMessage("")}
                    className="inline-flex text-red-400 hover:text-red-600"
                  >
                    <span className="sr-only">エラーメッセージを閉じる</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedProducts.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                比較する製品を選択してください
              </h2>
              <p className="text-gray-500 mb-6">
                最大{MAX_PRODUCTS}製品まで選択して詳細比較ができます
              </p>
              <div className="space-y-3">
                <a
                  href="/"
                  className="inline-block w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  製品を探す
                </a>
                {/* Demo: Add sample products button */}
                <div className="text-center">
                  <button
                    onClick={() =>
                      setSelectedProducts(mockProducts.slice(0, 2))
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    サンプル製品で試す
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Comparison Content */
          <div className={`space-y-6 ${getLayoutClasses()}`}>
            {/* Product Count and Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{selectedProducts.length}</span>
                  製品を比較中
                  <span className="text-gray-400 ml-1">
                    (最大{MAX_PRODUCTS}製品)
                  </span>
                </p>
                {selectedProducts.length < MAX_PRODUCTS && (
                  <button
                    onClick={() => {
                      // Demo: Add another product if available
                      const availableProduct = mockProducts.find(
                        (p) => !selectedProducts.some((sp) => sp.id === p.id),
                      );
                      if (availableProduct) {
                        handleProductAdd(availableProduct);
                      }
                    }}
                    className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors"
                  >
                    + 製品を追加
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  すべてクリア
                </button>
              </div>
            </div>

            {/* Individual Product Removal Cards (Mobile-friendly) */}
            <div className="block sm:hidden space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                選択中の製品:
              </h3>
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ¥{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleProductRemove(product.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label={`${product.name}を比較から削除`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Suspense
                fallback={
                  <div className="animate-pulse bg-gray-200 rounded-lg h-96 flex items-center justify-center">
                    <div className="text-gray-500">
                      比較テーブルを読み込み中...
                    </div>
                  </div>
                }
              >
                <ProductCompareTable
                  products={sortedProducts}
                  sortBy={sortConfig.field}
                  sortDirection={sortConfig.direction}
                  onSort={handleSort}
                  maxProducts={MAX_PRODUCTS}
                  onProductRemove={handleProductRemove}
                />
              </Suspense>
            </div>

            {/* Additional Actions */}
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/"
                  className="inline-block text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  他の製品も見る
                </a>
                <span className="hidden sm:inline text-gray-300">|</span>
                <button
                  onClick={() => window.print()}
                  className="text-gray-600 hover:text-gray-800 underline font-medium"
                >
                  比較結果を印刷
                </button>
              </div>

              {/* Responsive note */}
              <p className="text-xs text-gray-500 max-w-2xl mx-auto">
                モバイルでは横スクロールで全ての比較項目を確認できます。
                デスクトップでは並べ替え機能とキーボードナビゲーションが利用できます。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
