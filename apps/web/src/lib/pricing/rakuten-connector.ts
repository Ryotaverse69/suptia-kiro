/**
 * Rakuten Ichiba API Connector
 * 楽天市場APIとの統合を提供
 */

export interface RakutenProduct {
  itemCode: string;
  itemName: string;
  itemPrice: number;
  postageFlag: 0 | 1; // 0: 送料別, 1: 送料込み
  itemUrl: string;
  mediumImageUrls: string[];
  availability: 1 | 0; // 1: 在庫あり, 0: 在庫なし
  reviewCount: number;
  reviewAverage: number;
  shopName: string;
  genreId: string;
  gtin?: string;
  jan?: string;
}

export interface RakutenSearchParams {
  keyword: string;
  genreId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?:
    | "standard"
    | "+itemPrice"
    | "-itemPrice"
    | "+reviewCount"
    | "-reviewCount";
  hits?: number;
  page?: number;
}

export interface RakutenApiResponse {
  Items: Array<{
    Item: RakutenProduct;
  }>;
  count: number;
  page: number;
  first: number;
  last: number;
  hits: number;
  carrier: number;
  pageCount: number;
}

export interface RakutenConnectorConfig {
  applicationId: string;
  affiliateId?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export class RakutenConnector {
  private config: Required<RakutenConnectorConfig>;
  private rateLimitDelay = 1000; // 1秒間隔でリクエスト制限

  constructor(config: RakutenConnectorConfig) {
    this.config = {
      applicationId: config.applicationId,
      affiliateId: config.affiliateId || "",
      baseUrl:
        config.baseUrl ||
        "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601",
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
    };
  }

  /**
   * 商品検索
   */
  async searchProducts(params: RakutenSearchParams): Promise<RakutenProduct[]> {
    const searchParams = new URLSearchParams({
      applicationId: this.config.applicationId,
      keyword: params.keyword,
      format: "json",
      hits: (params.hits || 30).toString(),
      page: (params.page || 1).toString(),
    });

    if (params.genreId) {
      searchParams.append("genreId", params.genreId);
    }
    if (params.minPrice) {
      searchParams.append("minPrice", params.minPrice.toString());
    }
    if (params.maxPrice) {
      searchParams.append("maxPrice", params.maxPrice.toString());
    }
    if (params.sort) {
      searchParams.append("sort", params.sort);
    }
    if (this.config.affiliateId) {
      searchParams.append("affiliateId", this.config.affiliateId);
    }

    const url = `${this.config.baseUrl}?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithRetry(url);
      const data: RakutenApiResponse = await response.json();

      return data.Items?.map((item) => item.Item) || [];
    } catch (error) {
      console.error("Rakuten API search error:", error);
      throw new Error(
        `楽天API検索エラー: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 商品コードで商品取得
   */
  async getProductByCode(itemCode: string): Promise<RakutenProduct | null> {
    const products = await this.searchProducts({ keyword: itemCode });
    return products.find((product) => product.itemCode === itemCode) || null;
  }

  /**
   * 在庫確認
   */
  async checkStock(itemCode: string): Promise<boolean> {
    const product = await this.getProductByCode(itemCode);
    return product?.availability === 1 || false;
  }

  /**
   * GTIN/JANで商品検索
   */
  async searchByGTIN(gtin: string): Promise<RakutenProduct[]> {
    return this.searchProducts({ keyword: gtin });
  }

  /**
   * リトライ機能付きfetch
   */
  private async fetchWithRetry(url: string, attempt = 1): Promise<Response> {
    try {
      // レート制限対応
      if (attempt > 1) {
        await this.delay(this.rateLimitDelay * attempt);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Suptia/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 && attempt <= this.config.retryAttempts) {
          // レート制限の場合はリトライ
          return this.fetchWithRetry(url, attempt + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt <= this.config.retryAttempts && error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("リクエストタイムアウト");
        }
        // ネットワークエラーの場合はリトライ
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * 遅延処理
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 設定取得
   */
  getConfig(): RakutenConnectorConfig {
    return { ...this.config };
  }
}

/**
 * デフォルトの楽天コネクタインスタンス
 */
export function createRakutenConnector(
  config?: Partial<RakutenConnectorConfig>,
): RakutenConnector {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;

  if (!applicationId) {
    throw new Error("RAKUTEN_APPLICATION_ID environment variable is required");
  }

  return new RakutenConnector({
    applicationId,
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID,
    ...config,
  });
}
