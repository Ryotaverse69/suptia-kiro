/**
 * カテゴリデータ管理ライブラリ
 * トリバゴクローン用のカテゴリ情報を取得・管理
 */

import { sanity } from './sanity.client';

export interface Category {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  description?: string;
  image?: {
    asset: {
      _ref: string;
      url?: string;
    };
    alt?: string;
  };
  averagePrice: number;
  productCount: number;
  displayOrder: number;
  isPopular: boolean;
  priceHistory?: PricePoint[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface PricePoint {
  month: string;
  averagePrice: number;
}

/**
 * 全カテゴリを取得（表示順序でソート）
 */
export async function getAllCategories(): Promise<Category[]> {
  const query = `
    *[_type == "category"] | order(displayOrder asc) {
      _id,
      name,
      slug,
      description,
      image {
        asset-> {
          _ref,
          url
        },
        alt
      },
      averagePrice,
      productCount,
      displayOrder,
      isPopular,
      priceHistory,
      seoTitle,
      seoDescription
    }
  `;

  return await sanity.fetch(query);
}

/**
 * 人気カテゴリのみを取得（ホームページ用）
 */
export async function getPopularCategories(): Promise<Category[]> {
  const query = `
    *[_type == "category" && isPopular == true] | order(displayOrder asc) {
      _id,
      name,
      slug,
      description,
      image {
        asset-> {
          _ref,
          url
        },
        alt
      },
      averagePrice,
      productCount,
      displayOrder,
      isPopular,
      priceHistory,
      seoTitle,
      seoDescription
    }
  `;

  return await sanity.fetch(query);
}

/**
 * スラッグでカテゴリを取得
 */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const query = `
    *[_type == "category" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      description,
      image {
        asset-> {
          _ref,
          url
        },
        alt
      },
      averagePrice,
      productCount,
      displayOrder,
      isPopular,
      priceHistory,
      seoTitle,
      seoDescription
    }
  `;

  return await sanity.fetch(query, { slug });
}

/**
 * カテゴリの価格推移データを取得
 */
export async function getCategoryPriceHistory(
  categoryId: string
): Promise<PricePoint[]> {
  const query = `
    *[_type == "category" && _id == $categoryId][0].priceHistory
  `;

  const priceHistory = await sanity.fetch(query, { categoryId });
  return priceHistory || [];
}

/**
 * カテゴリ統計情報を取得
 */
export async function getCategoryStats() {
  const query = `
    {
      "totalCategories": count(*[_type == "category"]),
      "popularCategories": count(*[_type == "category" && isPopular == true]),
      "totalProducts": sum(*[_type == "category"].productCount),
      "averagePrice": avg(*[_type == "category"].averagePrice)
    }
  `;

  return await sanity.fetch(query);
}

/**
 * トリバゴ風のカテゴリカード表示用データを取得
 */
export async function getCategoriesForCards(): Promise<
  Array<{
    name: string;
    slug: string;
    productCount: number;
    averagePrice: number;
    imageUrl?: string;
    url: string;
  }>
> {
  const categories = await getPopularCategories();

  return categories.map(category => ({
    name: category.name,
    slug: category.slug.current,
    productCount: category.productCount,
    averagePrice: category.averagePrice,
    imageUrl: category.image?.asset?.url,
    url: `/search?q=${encodeURIComponent(category.name)}`,
  }));
}

/**
 * 価格チャート用のカテゴリデータを取得
 */
export async function getCategoriesForPriceChart(): Promise<
  Array<{
    name: string;
    slug: string;
    priceHistory: PricePoint[];
  }>
> {
  const categories = await getPopularCategories();

  return categories
    .filter(
      category => category.priceHistory && category.priceHistory.length > 0
    )
    .map(category => ({
      name: category.name,
      slug: category.slug.current,
      priceHistory: category.priceHistory || [],
    }));
}

/**
 * SEO用のカテゴリメタデータを取得
 */
export async function getCategorySEOData(slug: string) {
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return null;
  }

  return {
    title:
      category.seoTitle || `${category.name} サプリメント価格比較 - サプティア`,
    description:
      category.seoDescription ||
      `${category.productCount}商品の${category.name}サプリメントを価格比較。最安値で${category.name}を購入できます。`,
    keywords: [
      category.name,
      'サプリメント',
      '価格比較',
      '最安値',
      'サプティア',
    ].join(', '),
  };
}
