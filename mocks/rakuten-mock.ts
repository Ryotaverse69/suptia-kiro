/**
 * Rakuten API Mock Data
 * 楽天APIのモックデータとモック関数
 */

import type { RakutenProduct, RakutenSearchParams } from '../apps/web/src/lib/pricing/rakuten-connector';

export const mockRakutenProducts: RakutenProduct[] = [
  {
    itemCode: 'supplement-shop:vitamin-d-1000',
    itemName: 'ビタミンD 1000IU 90粒',
    itemPrice: 1980,
    postageFlag: 0,
    itemUrl: 'https://item.rakuten.co.jp/supplement-shop/vitamin-d-1000/',
    mediumImageUrls: ['https://tshop.r10s.jp/supplement-shop/cabinet/vitamin-d.jpg'],
    availability: 1,
    reviewCount: 245,
    reviewAverage: 4.3,
    shopName: 'サプリメントショップ',
    genreId: '509777',
    gtin: '4901234567890',
    jan: '4901234567890',
  },
  {
    itemCode: 'health-store:omega3-epa-dha',
    itemName: 'オメガ3 EPA・DHA 180粒',
    itemPrice: 2980,
    postageFlag: 1,
    itemUrl: 'https://item.rakuten.co.jp/health-store/omega3-epa-dha/',
    mediumImageUrls: ['https://tshop.r10s.jp/health-store/cabinet/omega3.jpg'],
    availability: 1,
    reviewCount: 156,
    reviewAverage: 4.1,
    shopName: 'ヘルスストア',
    genreId: '509777',
    gtin: '4901234567891',
    jan: '4901234567891',
  },
  {
    itemCode: 'vitamin-world:multivitamin-30',
    itemName: 'マルチビタミン 30日分',
    itemPrice: 1580,
    postageFlag: 0,
    itemUrl: 'https://item.rakuten.co.jp/vitamin-world/multivitamin-30/',
    mediumImageUrls: ['https://tshop.r10s.jp/vitamin-world/cabinet/multi.jpg'],
    availability: 0,
    reviewCount: 89,
    reviewAverage: 3.8,
    shopName: 'ビタミンワールド',
    genreId: '509777',
    gtin: '4901234567892',
    jan: '4901234567892',
  },
  {
    itemCode: 'protein-lab:whey-protein-1kg',
    itemName: 'ホエイプロテイン 1kg',
    itemPrice: 3980,
    postageFlag: 1,
    itemUrl: 'https://item.rakuten.co.jp/protein-lab/whey-protein-1kg/',
    mediumImageUrls: ['https://tshop.r10s.jp/protein-lab/cabinet/whey.jpg'],
    availability: 1,
    reviewCount: 312,
    reviewAverage: 4.5,
    shopName: 'プロテインラボ',
    genreId: '509778',
    gtin: '4901234567893',
    jan: '4901234567893',
  },
];

export class MockRakutenConnector {
  private products = mockRakutenProducts;
  private delay = 100; // モック応答遅延

  async searchProducts(params: RakutenSearchParams): Promise<RakutenProduct[]> {
    await this.mockDelay();

    let results = [...this.products];

    // キーワード検索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      results = results.filter(product => 
        product.itemName.toLowerCase().includes(keyword) ||
        product.itemCode.toLowerCase().includes(keyword) ||
        product.gtin === keyword ||
        product.jan === keyword
      );
    }

    // ジャンルフィルタ
    if (params.genreId) {
      results = results.filter(product => product.genreId === params.genreId);
    }

    // 価格フィルタ
    if (params.minPrice) {
      results = results.filter(product => product.itemPrice >= params.minPrice!);
    }
    if (params.maxPrice) {
      results = results.filter(product => product.itemPrice <= params.maxPrice!);
    }

    // ソート
    if (params.sort) {
      switch (params.sort) {
        case '+itemPrice':
          results.sort((a, b) => a.itemPrice - b.itemPrice);
          break;
        case '-itemPrice':
          results.sort((a, b) => b.itemPrice - a.itemPrice);
          break;
        case '+reviewCount':
          results.sort((a, b) => a.reviewCount - b.reviewCount);
          break;
        case '-reviewCount':
          results.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
      }
    }

    // ページネーション
    const hits = params.hits || 30;
    const page = params.page || 1;
    const start = (page - 1) * hits;
    const end = start + hits;

    return results.slice(start, end);
  }

  async getProductByCode(itemCode: string): Promise<RakutenProduct | null> {
    await this.mockDelay();
    return this.products.find(product => product.itemCode === itemCode) || null;
  }

  async checkStock(itemCode: string): Promise<boolean> {
    await this.mockDelay();
    const product = await this.getProductByCode(itemCode);
    return product?.availability === 1 || false;
  }

  async searchByGTIN(gtin: string): Promise<RakutenProduct[]> {
    await this.mockDelay();
    return this.products.filter(product => product.gtin === gtin || product.jan === gtin);
  }

  private async mockDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  // テスト用のヘルパーメソッド
  addMockProduct(product: RakutenProduct): void {
    this.products.push(product);
  }

  clearMockProducts(): void {
    this.products = [];
  }

  resetMockProducts(): void {
    this.products = [...mockRakutenProducts];
  }

  setMockDelay(ms: number): void {
    this.delay = ms;
  }
}

/**
 * エラーシミュレーション用のモック
 */
export class MockRakutenConnectorWithErrors extends MockRakutenConnector {
  private shouldThrowError = false;
  private errorMessage = 'Mock API Error';

  setError(shouldThrow: boolean, message = 'Mock API Error'): void {
    this.shouldThrowError = shouldThrow;
    this.errorMessage = message;
  }

  async searchProducts(params: RakutenSearchParams): Promise<RakutenProduct[]> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }
    return super.searchProducts(params);
  }

  async getProductByCode(itemCode: string): Promise<RakutenProduct | null> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }
    return super.getProductByCode(itemCode);
  }
}

/**
 * 開発環境用のモックコネクタファクトリ
 */
export function createMockRakutenConnector(withErrors = false): MockRakutenConnector {
  return withErrors ? new MockRakutenConnectorWithErrors() : new MockRakutenConnector();
}