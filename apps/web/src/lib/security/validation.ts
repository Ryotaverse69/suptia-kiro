import { z } from "zod";

/**
 * 共通の検証ルール
 */
const commonValidation = {
  // 日本語文字を含む文字列（1-100文字）
  japaneseName: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9\s\-_]+$/u,
    ),

  // 英数字のみ（1-50文字）
  alphanumeric: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\-_]+$/),

  // URL（HTTPS必須）
  httpsUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), {
      message: "HTTPS URLが必要です",
    }),

  // 価格（正の数値、最大10桁）
  price: z.number().positive().max(9999999999),

  // 評価スコア（0-5の範囲）
  rating: z.number().min(0).max(5),

  // ページネーション
  page: z.number().int().min(1).max(1000),
  limit: z.number().int().min(1).max(100),
};

/**
 * 商品検索APIの入力検証
 */
export const ProductSearchSchema = z
  .object({
    query: z.string().min(1).max(100).trim(),
    category: commonValidation.alphanumeric.optional(),
    minPrice: commonValidation.price.optional(),
    maxPrice: commonValidation.price.optional(),
    page: commonValidation.page.default(1),
    limit: commonValidation.limit.default(20),
    sortBy: z
      .enum(["price", "rating", "name", "relevance"])
      .default("relevance"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .refine(
    (data) => {
      // 最小価格が最大価格より小さいことを確認
      if (data.minPrice && data.maxPrice) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: "最小価格は最大価格以下である必要があります",
      path: ["minPrice"],
    },
  );

/**
 * 商品詳細取得APIの入力検証
 */
export const ProductDetailSchema = z.object({
  productId: commonValidation.alphanumeric,
  includeReviews: z.boolean().default(false),
  includePricing: z.boolean().default(true),
});

/**
 * 診断フォームの入力検証
 */
export const DiagnosisFormSchema = z.object({
  age: z.number().int().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  exerciseFrequency: z
    .enum(["none", "light", "moderate", "intense"])
    .optional(),
  stressLevel: z.enum(["low", "moderate", "high"]).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  dietType: z
    .enum(["balanced", "vegetarian", "vegan", "low_carb", "other"])
    .optional(),
  goals: z
    .array(
      z.object({
        category: z.enum([
          "energy",
          "immunity",
          "cognitive",
          "fitness",
          "beauty",
          "general_health",
        ]),
        priority: z.enum(["low", "medium", "high"]),
      }),
    )
    .max(10)
    .optional(),
  preferences: z
    .object({
      formType: z
        .enum(["tablet", "capsule", "powder", "liquid", "gummy"])
        .optional(),
      priceRange: z.enum(["budget", "mid_range", "premium"]).optional(),
      brandPreference: z.array(commonValidation.alphanumeric).max(5).optional(),
    })
    .optional(),
});

/**
 * 価格比較APIの入力検証
 */
export const PriceComparisonSchema = z.object({
  productIds: z.array(commonValidation.alphanumeric).min(1).max(10),
  sources: z
    .array(z.enum(["rakuten", "yahoo"]))
    .min(1)
    .default(["rakuten", "yahoo"]),
  includeShipping: z.boolean().default(true),
  prefecture: z.string().min(2).max(10).optional(), // 送料計算用
});

/**
 * レビュー投稿の入力検証
 */
export const ReviewSubmissionSchema = z
  .object({
    productId: commonValidation.alphanumeric,
    rating: commonValidation.rating,
    title: z.string().min(1).max(100).trim(),
    content: z.string().min(10).max(2000).trim(),
    verified: z.boolean().default(false),
    // 薬機法準拠のため、医療効果に関する表現をチェック
  })
  .refine(
    (data) => {
      // 禁止表現のチェック
      const prohibitedTerms = [
        "治る",
        "治療",
        "病気",
        "症状",
        "効果",
        "改善",
        "治癒",
        "cure",
        "treat",
        "disease",
        "symptom",
        "medical",
        "therapy",
      ];

      const text = (data.title + " " + data.content).toLowerCase();
      const hasProhibitedTerms = prohibitedTerms.some((term) =>
        text.includes(term),
      );

      return !hasProhibitedTerms;
    },
    {
      message: "医療効果に関する表現は使用できません",
      path: ["content"],
    },
  );

/**
 * お問い合わせフォームの入力検証
 */
export const ContactFormSchema = z.object({
  name: commonValidation.japaneseName,
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200).trim(),
  message: z.string().min(10).max(5000).trim(),
  category: z
    .enum(["general", "product", "technical", "business"])
    .default("general"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

/**
 * API共通レスポンスの型定義
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z
    .object({
      timestamp: z.string(),
      requestId: z.string().optional(),
      rateLimit: z
        .object({
          limit: z.number(),
          remaining: z.number(),
          resetTime: z.number(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * 入力検証エラーのフォーマット
 */
export function formatValidationError(error: z.ZodError): {
  code: string;
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  return {
    code: "VALIDATION_ERROR",
    message: "入力データが無効です",
    details: (error.issues || []).map((err) => ({
      field: err.path?.join(".") || "unknown",
      message: err.message || "不明なエラー",
    })),
  };
}

/**
 * 安全な入力検証ヘルパー
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; error: ReturnType<typeof formatValidationError> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatValidationError(error) };
    }
    throw error;
  }
}

/**
 * サニタイゼーション関数
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * SQLインジェクション対策（基本的なエスケープ）
 */
export function escapeSql(input: string): string {
  return input.replace(/'/g, "''").replace(/;/g, "");
}

/**
 * XSS対策のためのCSRFトークン検証
 */
export function validateCsrfToken(
  token: string,
  expectedToken: string,
): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // タイミング攻撃を防ぐため、固定時間での比較
  let result = 0;
  const minLength = Math.min(token.length, expectedToken.length);

  for (let i = 0; i < minLength; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  result |= token.length ^ expectedToken.length;

  return result === 0;
}
