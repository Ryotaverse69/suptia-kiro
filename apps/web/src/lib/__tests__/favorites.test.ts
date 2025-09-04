import {
  getFavoriteIds,
  getFavoriteDetails,
  getFavoriteProducts,
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  getFavoriteCategories,
  createFavoriteCategory,
  deleteFavoriteCategory,
  addProductToCategory,
  removeProductFromCategory,
  getFavoriteProductsByCategory,
  getUncategorizedFavorites,
  clearFavorites,
  type FavoriteProduct,
} from '../favorites';

// LocalStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('favorites', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('基本的なお気に入り操作', () => {
    const testProduct: Omit<FavoriteProduct, 'addedAt'> = {
      id: 'product-1',
      name: 'テストサプリメント',
      category: 'ビタミン',
      brand: 'テストブランド',
      price: 1000,
      currency: 'JPY',
    };

    test('初期状態では空の配列を返す', () => {
      expect(getFavoriteIds()).toEqual([]);
      expect(getFavoriteProducts()).toEqual([]);
    });

    test('商品をお気に入りに追加できる', () => {
      addToFavorites(testProduct);
      
      expect(getFavoriteIds()).toContain('product-1');
      expect(isFavorite('product-1')).toBe(true);
      
      const products = getFavoriteProducts();
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('product-1');
      expect(products[0].name).toBe('テストサプリメント');
      expect(products[0].addedAt).toBeDefined();
    });

    test('同じ商品を重複して追加しない', () => {
      addToFavorites(testProduct);
      addToFavorites(testProduct);
      
      expect(getFavoriteIds()).toHaveLength(1);
      expect(getFavoriteProducts()).toHaveLength(1);
    });

    test('商品をお気に入りから削除できる', () => {
      addToFavorites(testProduct);
      expect(isFavorite('product-1')).toBe(true);
      
      removeFromFavorites('product-1');
      expect(isFavorite('product-1')).toBe(false);
      expect(getFavoriteProducts()).toHaveLength(0);
    });

    test('存在しない商品の削除でエラーが発生しない', () => {
      expect(() => removeFromFavorites('non-existent')).not.toThrow();
    });
  });

  describe('カテゴリ管理', () => {
    beforeEach(() => {
      // テスト用商品を追加
      addToFavorites({
        id: 'product-1',
        name: 'ビタミンC',
        category: 'ビタミン',
      });
      addToFavorites({
        id: 'product-2',
        name: 'マグネシウム',
        category: 'ミネラル',
      });
    });

    test('カテゴリを作成できる', () => {
      const category = createFavoriteCategory('健康維持');
      
      expect(category.name).toBe('健康維持');
      expect(category.id).toBeDefined();
      expect(category.productIds).toEqual([]);
      
      const categories = getFavoriteCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('健康維持');
    });

    test('カテゴリを削除できる', () => {
      const category = createFavoriteCategory('テストカテゴリ');
      expect(getFavoriteCategories()).toHaveLength(1);
      
      deleteFavoriteCategory(category.id);
      expect(getFavoriteCategories()).toHaveLength(0);
    });

    test('商品をカテゴリに追加できる', () => {
      const category = createFavoriteCategory('健康維持');
      addProductToCategory('product-1', category.id);
      
      const updatedCategories = getFavoriteCategories();
      expect(updatedCategories[0].productIds).toContain('product-1');
      
      const categoryProducts = getFavoriteProductsByCategory(category.id);
      expect(categoryProducts).toHaveLength(1);
      expect(categoryProducts[0].id).toBe('product-1');
    });

    test('商品をカテゴリから削除できる', () => {
      const category = createFavoriteCategory('健康維持');
      addProductToCategory('product-1', category.id);
      addProductToCategory('product-2', category.id);
      
      expect(getFavoriteProductsByCategory(category.id)).toHaveLength(2);
      
      removeProductFromCategory('product-1', category.id);
      const categoryProducts = getFavoriteProductsByCategory(category.id);
      expect(categoryProducts).toHaveLength(1);
      expect(categoryProducts[0].id).toBe('product-2');
    });

    test('未分類の商品を取得できる', () => {
      const category = createFavoriteCategory('健康維持');
      addProductToCategory('product-1', category.id);
      
      const uncategorized = getUncategorizedFavorites();
      expect(uncategorized).toHaveLength(1);
      expect(uncategorized[0].id).toBe('product-2');
    });

    test('同じ商品を重複してカテゴリに追加しない', () => {
      const category = createFavoriteCategory('健康維持');
      addProductToCategory('product-1', category.id);
      addProductToCategory('product-1', category.id);
      
      const updatedCategories = getFavoriteCategories();
      expect(updatedCategories[0].productIds).toHaveLength(1);
    });
  });

  describe('データの永続化', () => {
    test('お気に入りデータがローカルストレージに保存される', () => {
      const testProduct: Omit<FavoriteProduct, 'addedAt'> = {
        id: 'product-1',
        name: 'テストサプリメント',
      };
      
      addToFavorites(testProduct);
      
      const storedIds = JSON.parse(localStorageMock.getItem('suptia-favorites') || '[]');
      const storedDetails = JSON.parse(localStorageMock.getItem('suptia-favorite-details') || '{}');
      
      expect(storedIds).toContain('product-1');
      expect(storedDetails['product-1']).toBeDefined();
      expect(storedDetails['product-1'].name).toBe('テストサプリメント');
    });

    test('カテゴリデータがローカルストレージに保存される', () => {
      createFavoriteCategory('テストカテゴリ');
      
      const storedCategories = JSON.parse(localStorageMock.getItem('suptia-favorite-categories') || '[]');
      expect(storedCategories).toHaveLength(1);
      expect(storedCategories[0].name).toBe('テストカテゴリ');
    });

    test('データをクリアできる', () => {
      addToFavorites({ id: 'product-1', name: 'テスト' });
      createFavoriteCategory('テストカテゴリ');
      
      expect(getFavoriteProducts()).toHaveLength(1);
      expect(getFavoriteCategories()).toHaveLength(1);
      
      clearFavorites();
      
      expect(getFavoriteProducts()).toHaveLength(0);
      expect(getFavoriteCategories()).toHaveLength(0);
    });
  });

  describe('エラーハンドリング', () => {
    test('不正なJSONデータでもエラーが発生しない', () => {
      localStorageMock.setItem('suptia-favorites', 'invalid json');
      
      expect(() => getFavoriteIds()).not.toThrow();
      expect(getFavoriteIds()).toEqual([]);
    });

    test('存在しないカテゴリの商品取得で空配列を返す', () => {
      const products = getFavoriteProductsByCategory('non-existent');
      expect(products).toEqual([]);
    });

    test('LocalStorageが利用できない場合のエラーハンドリング', () => {
      // LocalStorageのsetItemでエラーを発生させる
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      expect(() => {
        addToFavorites({ id: 'product-1', name: 'テスト' });
      }).toThrow();

      // 元に戻す
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('商品の並び順', () => {
    test('お気に入り商品が追加日時の降順で並ぶ', async () => {
      // 時間差で商品を追加
      addToFavorites({ id: 'product-1', name: '商品1' });
      
      // 少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      addToFavorites({ id: 'product-2', name: '商品2' });
      
      const products = getFavoriteProducts();
      expect(products[0].id).toBe('product-2'); // 後から追加された商品が先頭
      expect(products[1].id).toBe('product-1');
    });
  });
});