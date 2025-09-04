/**
 * お気に入り管理ライブラリ
 * ローカルストレージを使用してお気に入り商品を管理
 */

export interface FavoriteProduct {
  id: string;
  name: string;
  addedAt: string;
  category?: string;
  brand?: string;
  price?: number;
  currency?: string;
}

export interface FavoriteCategory {
  id: string;
  name: string;
  productIds: string[];
}

const FAVORITES_KEY = 'suptia-favorites';
const FAVORITE_DETAILS_KEY = 'suptia-favorite-details';
const FAVORITE_CATEGORIES_KEY = 'suptia-favorite-categories';

/**
 * お気に入り商品IDの配列を取得
 */
export function getFavoriteIds(): string[] {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('お気に入りIDの取得に失敗しました:', error);
    return [];
  }
}

/**
 * お気に入り商品の詳細情報を取得
 */
export function getFavoriteDetails(): Record<string, FavoriteProduct> {
  try {
    const details = localStorage.getItem(FAVORITE_DETAILS_KEY);
    return details ? JSON.parse(details) : {};
  } catch (error) {
    console.error('お気に入り詳細の取得に失敗しました:', error);
    return {};
  }
}

/**
 * お気に入り商品一覧を取得（詳細情報付き）
 */
export function getFavoriteProducts(): FavoriteProduct[] {
  const favoriteIds = getFavoriteIds();
  const favoriteDetails = getFavoriteDetails();
  
  return favoriteIds
    .map(id => favoriteDetails[id])
    .filter(Boolean)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

/**
 * 商品がお気に入りに登録されているかチェック
 */
export function isFavorite(productId: string): boolean {
  const favoriteIds = getFavoriteIds();
  return favoriteIds.includes(productId);
}

/**
 * お気に入りに商品を追加
 */
export function addToFavorites(product: Omit<FavoriteProduct, 'addedAt'>): void {
  try {
    const favoriteIds = getFavoriteIds();
    const favoriteDetails = getFavoriteDetails();
    
    if (!favoriteIds.includes(product.id)) {
      // IDリストに追加
      const updatedIds = [...favoriteIds, product.id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedIds));
      
      // 詳細情報を追加
      const updatedDetails = {
        ...favoriteDetails,
        [product.id]: {
          ...product,
          addedAt: new Date().toISOString(),
        },
      };
      localStorage.setItem(FAVORITE_DETAILS_KEY, JSON.stringify(updatedDetails));
    }
  } catch (error) {
    console.error('お気に入りへの追加に失敗しました:', error);
    throw error;
  }
}

/**
 * お気に入りから商品を削除
 */
export function removeFromFavorites(productId: string): void {
  try {
    const favoriteIds = getFavoriteIds();
    const favoriteDetails = getFavoriteDetails();
    
    // IDリストから削除
    const updatedIds = favoriteIds.filter(id => id !== productId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedIds));
    
    // 詳細情報から削除
    const updatedDetails = { ...favoriteDetails };
    delete updatedDetails[productId];
    localStorage.setItem(FAVORITE_DETAILS_KEY, JSON.stringify(updatedDetails));
    
    // カテゴリからも削除
    const categories = getFavoriteCategories();
    const updatedCategories = categories.map(category => ({
      ...category,
      productIds: category.productIds.filter(id => id !== productId),
    }));
    saveFavoriteCategories(updatedCategories);
  } catch (error) {
    console.error('お気に入りからの削除に失敗しました:', error);
    throw error;
  }
}

/**
 * お気に入りカテゴリ一覧を取得
 */
export function getFavoriteCategories(): FavoriteCategory[] {
  try {
    const categories = localStorage.getItem(FAVORITE_CATEGORIES_KEY);
    return categories ? JSON.parse(categories) : [];
  } catch (error) {
    console.error('お気に入りカテゴリの取得に失敗しました:', error);
    return [];
  }
}

/**
 * お気に入りカテゴリを保存
 */
export function saveFavoriteCategories(categories: FavoriteCategory[]): void {
  try {
    localStorage.setItem(FAVORITE_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('お気に入りカテゴリの保存に失敗しました:', error);
    throw error;
  }
}

/**
 * 新しいお気に入りカテゴリを作成
 */
export function createFavoriteCategory(name: string): FavoriteCategory {
  const categories = getFavoriteCategories();
  const newCategory: FavoriteCategory = {
    id: `category-${Date.now()}`,
    name,
    productIds: [],
  };
  
  const updatedCategories = [...categories, newCategory];
  saveFavoriteCategories(updatedCategories);
  
  return newCategory;
}

/**
 * お気に入りカテゴリを削除
 */
export function deleteFavoriteCategory(categoryId: string): void {
  const categories = getFavoriteCategories();
  const updatedCategories = categories.filter(category => category.id !== categoryId);
  saveFavoriteCategories(updatedCategories);
}

/**
 * 商品をカテゴリに追加
 */
export function addProductToCategory(productId: string, categoryId: string): void {
  const categories = getFavoriteCategories();
  const updatedCategories = categories.map(category => {
    if (category.id === categoryId && !category.productIds.includes(productId)) {
      return {
        ...category,
        productIds: [...category.productIds, productId],
      };
    }
    return category;
  });
  saveFavoriteCategories(updatedCategories);
}

/**
 * 商品をカテゴリから削除
 */
export function removeProductFromCategory(productId: string, categoryId: string): void {
  const categories = getFavoriteCategories();
  const updatedCategories = categories.map(category => {
    if (category.id === categoryId) {
      return {
        ...category,
        productIds: category.productIds.filter(id => id !== productId),
      };
    }
    return category;
  });
  saveFavoriteCategories(updatedCategories);
}

/**
 * カテゴリ別にお気に入り商品を取得
 */
export function getFavoriteProductsByCategory(categoryId: string): FavoriteProduct[] {
  const categories = getFavoriteCategories();
  const category = categories.find(cat => cat.id === categoryId);
  
  if (!category) return [];
  
  const favoriteDetails = getFavoriteDetails();
  return category.productIds
    .map(id => favoriteDetails[id])
    .filter(Boolean)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

/**
 * カテゴリに属していないお気に入り商品を取得
 */
export function getUncategorizedFavorites(): FavoriteProduct[] {
  const allFavorites = getFavoriteProducts();
  const categories = getFavoriteCategories();
  const categorizedProductIds = new Set(
    categories.flatMap(category => category.productIds)
  );
  
  return allFavorites.filter(product => !categorizedProductIds.has(product.id));
}

/**
 * お気に入りデータをクリア（開発・テスト用）
 */
export function clearFavorites(): void {
  try {
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(FAVORITE_DETAILS_KEY);
    localStorage.removeItem(FAVORITE_CATEGORIES_KEY);
  } catch (error) {
    console.error('お気に入りデータのクリアに失敗しました:', error);
    throw error;
  }
}