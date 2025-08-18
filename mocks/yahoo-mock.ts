/**
 * Yahoo! Shopping API Mock Data
 * Yahoo!ショッピングAPIのモックデータとモック関数
 */

import type { YahooProduct, YahooSearchParams } from '../apps/web/src/lib/pricing/yahoo-connector';

export const mockYahooProducts: YahooProduct[] = [
  {
    code: 'vitamin-d-1000-yahoo',
    name: 'ビタミンD3 1000IU 90カプセル',
    price: 1890,
    shipping: {
      code: 0,
      price: 300,
    },
    url: 'https://shopping.yahoo.co.jp/products/vitamin-d-1000-yahoo',
    image: {
      medium: 'https://shopping.c.yimg.jp/lib/vitamin-d.jpg',
    },
    inStock: true,
    review: {
      count: 198,
      rate: 4.2,
    },
    seller: {
      name: 'Yahoo!サプリストア',
    },
    category: {
      id: '24981',
      name: 'ビタミン',
    },
    gtin: '4901234567890',
    jan: '4901234567890',
  },
  {
    code: 'omega3-premium-yahoo',
    name: 'プレミアムオメガ3 EPA・DHA 120粒',
    price: 3200,
    shipping: {
      code: 1,
    },
    url: 'https://shopping.yahoo.co.jp/products/omega3-premium-yahoo',
    image: {
      medium: 'https://shopping.c.yimg.jp/lib/omega3.jpg',
    },
    inStock: true,
    review: {
      count: 142,
      rate: 4.4,
    },
    seller: {
      name: 'プレミアムヘルス',
    },
    category: {
      id: '24980',
      name: 'サプリメント',
    },
    gtin: '4901234567891',
    jan: '4901234567891',
  },
  {
    code: 'multivitamin-complete-yahoo',
    name: 'コンプリートマルチビタミン 60粒',
    price: 1680,
    shipping: {
      code: 0,
      price: 250,
    },
    url: 'https://shopping.yahoo.co.jp/products/multivitamin-complete-yahoo',
    image: {
      medium: 'https://shopping.c.yimg.jp/lib/multi.jpg',
    },
    inStock: false,
    review: {
      count: 76,
      rate: 3.9,
    },
    seller: {
      name: 'ヘルシーライフ',
    },
    category: {
      id: '24981',
      name: 'ビタミン',
    },
    gtin: '4901234567892',
    jan: '4901234567892',
  },
  {
    code: 'whey-protein-isolate-yahoo',
    name: 'ホエイプロテインアイソレート 1kg',
    price: 4200,
    shipping: {
      code: 1,
    },
    url: 'https://shopping.yahoo.co.jp/products/whey-protein-isolate-yahoo',
    image: {
      medium: 'https://shopping.c.yimg.jp/lib/whey-isolate.jpg',
    },
    inStock: true,
    review: {
      count: 289,
      rate: 4.6,
    },
    seller: {
      name: 'フィットネスプロ',
    },
    category: {
      id: '24983',
      name: 'プロテイン',
    },
    gtin: '4901234567893',
    jan: '4901234567893',
  },
];

export class MockYahooConnector {
  private products = mockYahooProducts;
  private delay = 120; // モック応答遅延

  async searchProducts(params: YahooSearchParams): Promise<YahooProduct[]> {
    await this.mockDelay();

    let results = [...this.products];

    // クエリ検索
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        product.gtin === query ||
        product.jan === query
      );
    }

    // カテゴリフィルタ
    if (params.categoryId) {
      results = results.filter(product => product.category.id === params.categoryId);
    }

    // 価格フィルタ
    if (params.minPrice) {
      results = results.filter(product => product.price >= params.minPrice!);
    }
    if (params.maxPrice) {
      results = results.filter(product => product.price <= params.maxPrice!);
    }

    // ソート
    if (params.sort) {
      switch (params.sort) {
        case 'price':
          results.sort((a, b) => a.price - b.price);
          break;
        case '-price':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'review':
          results.sort((a, b) => a.review.rate - b.review.rate);
          break;
        case '-review':
          results.sort((a, b) => b.review.rate - a.review.rate);
          break;
      }
    }

    // ページネーション
    const results_per_page = params.results || 20;
    const start = params.start || 1;
    const startIndex = start - 1;
    const endIndex = startIndex + results_per_page;

    return results.slice(startIndex, endIndex);
  }

  async getProductDetails(code: string): Promise<YahooProduct | null> {
    await this.mockDelay();
    return this.products.find(product => product.code === code) || null;
  }

  async getShippingCost(code: string, prefecture: string): Promise<number> {
    await this.mockDelay();
    const product = await this.getProductDetails(code);
    
    if (!product) {
      throw new Error('商品が見つかりません');
    }

    // 送料込みの場合は0を返す
    if (product.shipping.code === 1) {
      return 0;
    }

    // 送料別の場合は設定された送料を返す
    return product.shipping.price || 500;
  }

  async searchByGTIN(gtin: string): Promise<YahooProduct[]> {
    await this.mockDelay();
    return this.products.filter(product => product.gtin === gtin || product.jan === gtin);
  }

  async getCategories(): Promise<Array<{id: string; name: string}>> {
    await this.mockDelay();
    return [
      { id: '2498', name: 'ダイエット、健康' },
      { id: '24980', name: 'サプリメント' },
      { id: '24981', name: 'ビタミン' },
      { id: '24982', name: 'ミネラル' },
      { id: '24983', name: 'プロテイン' },
    ];
  }

  private async mockDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  // テスト用のヘルパーメソッド
  addMockProduct(product: YahooProduct): void {
    this.products.push(product);
  }

  clearMockProducts(): void {
    this.products = [];
  }

  resetMockProducts(): void {
    this.products = [...mockYahooProducts];
  }

  setMockDelay(ms: number): void {
    this.delay = ms;
  }
}

/**
 * エラーシミュレーション用のモック
 */
export class MockYahooConnectorWithErrors extends MockYahooConnector {
  private shouldThrowError = false;
  private errorMessage = 'Mock Yahoo API Error';

  setError(shouldThrow: boolean, message = 'Mock Yahoo API Error'): void {
    this.shouldThrowError = shouldThrow;
    this.errorMessage = message;
  }

  async searchProducts(params: YahooSearchParams): Promise<YahooProduct[]> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }
    return super.searchProducts(params);
  }

  async getProductDetails(code: string): Promise<YahooProduct | null> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }
    return super.getProductDetails(code);
  }
}

/**
 * 開発環境用のモックコネクタファクトリ
 */
export function createMockYahooConnector(withErrors = false): MockYahooConnector {
  return withErrors ? new MockYahooConnectorWithErrors() : new MockYahooConnector();
}