/**
 * Yahoo! Shopping API Connector
 * Yahoo!ショッピングAPIとの統合を提供
 */

export interface YahooProduct {
  code: string;
  name: string;
  price: number;
  shipping: {
    code: number; // 0: 送料別, 1: 送料込み
    price?: number;
  };
  url: string;
  image: {
    medium: string;
  };
  inStock: boolean;
  review: {
    count: number;
    rate: number;
  };
  seller: {
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  gtin?: string;
  jan?: string;
}

export interface YahooSearchParams {
  query: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "score" | "price" | "-price" | "review" | "-review";
  results?: number;
  start?: number;
}

export interface YahooApiResponse {
  totalResultsAvailable: number;
  totalResultsReturned: number;
  firstResultPosition: number;
  Result: {
    Hit: YahooProduct[];
  };
}

export interface YahooConnectorConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export class YahooConnector {
  private config: Required<YahooConnectorConfig>;
  private accessToken?: string;
  private tokenExpiry?: number;
  private rateLimitDelay = 1000; // 1秒間隔でリクエスト制限

  constructor(config: YahooConnectorConfig) {
    this.config = {
      baseUrl: "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch",
      timeout: 10000,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * 商品検索
   */
  async searchProducts(params: YahooSearchParams): Promise<YahooProduct[]> {
    await this.ensureAccessToken();

    const searchParams = new URLSearchParams({
      appid: this.config.clientId,
      query: params.query,
      results: (params.results || 20).toString(),
      start: (params.start || 1).toString(),
    });

    if (params.categoryId) {
      searchParams.append("category_id", params.categoryId);
    }
    if (params.minPrice) {
      searchParams.append("price_from", params.minPrice.toString());
    }
    if (params.maxPrice) {
      searchParams.append("price_to", params.maxPrice.toString());
    }
    if (params.sort) {
      searchParams.append("sort", params.sort);
    }

    const url = `${this.config.baseUrl}?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithRetry(url);
      const data: YahooApiResponse = await response.json();

      return data.Result?.Hit || [];
    } catch (error) {
      console.error("Yahoo Shopping API search error:", error);
      throw new Error(
        `Yahoo!ショッピングAPI検索エラー: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 商品詳細取得
   */
  async getProductDetails(code: string): Promise<YahooProduct | null> {
    const products = await this.searchProducts({ query: code });
    return products.find((product) => product.code === code) || null;
  }

  /**
   * 送料計算
   */
  async getShippingCost(code: string, prefecture: string): Promise<number> {
    const product = await this.getProductDetails(code);

    if (!product) {
      throw new Error("商品が見つかりません");
    }

    // 送料込みの場合は0を返す
    if (product.shipping.code === 1) {
      return 0;
    }

    // 送料別の場合は設定された送料を返す（実際のAPIでは都道府県別計算が必要）
    return product.shipping.price || 500; // デフォルト送料
  }

  /**
   * GTIN/JANで商品検索
   */
  async searchByGTIN(gtin: string): Promise<YahooProduct[]> {
    return this.searchProducts({ query: gtin });
  }

  /**
   * カテゴリ一覧取得
   */
  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    // Yahoo!ショッピングの主要カテゴリ（実際のAPIでは動的取得）
    return [
      { id: "2498", name: "ダイエット、健康" },
      { id: "24980", name: "サプリメント" },
      { id: "24981", name: "ビタミン" },
      { id: "24982", name: "ミネラル" },
      { id: "24983", name: "プロテイン" },
    ];
  }

  /**
   * アクセストークン確保
   */
  private async ensureAccessToken(): Promise<void> {
    const now = Date.now();

    // トークンが有効な場合はそのまま使用
    if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry) {
      return;
    }

    // Yahoo!ショッピングAPIはアプリIDのみで認証（OAuth不要）
    // 実際の実装では必要に応じてOAuth 2.0フローを実装
    this.accessToken = this.config.clientId;
    this.tokenExpiry = now + 3600 * 1000; // 1時間有効
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
          Accept: "application/json",
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
  getConfig(): YahooConnectorConfig {
    return { ...this.config };
  }
}

/**
 * デフォルトのYahoo!コネクタインスタンス
 */
export function createYahooConnector(
  config?: Partial<YahooConnectorConfig>,
): YahooConnector {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET environment variables are required",
    );
  }

  return new YahooConnector({
    clientId,
    clientSecret,
    ...config,
  });
}
