/**
 * 本番環境対応の環境変数バリデーション
 * 必要な環境変数が設定されていることを確認し、適切なエラーハンドリングを行う
 */

interface EnvConfig {
  // Sanity設定
  sanity: {
    projectId: string;
    dataset: string;
    apiVersion: string;
    token?: string;
    studioUrl?: string;
  };
  
  // サイト設定
  site: {
    url: string;
    name: string;
    description: string;
  };
  
  // 機能フラグ
  features: {
    analytics: boolean;
    monitoring: boolean;
    preview: boolean;
  };
  
  // セキュリティ設定
  security: {
    corsOrigins: string[];
    rateLimitEnabled: boolean;
  };
}

/**
 * 環境変数を検証し、型安全な設定オブジェクトを返す
 */
export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];
  
  // 必須環境変数の検証
  const requiredVars = {
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };
  
  // 必須変数のチェック
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
    
    // プレースホルダー値のチェック
    if (value === 'your-project-id' || value === 'your-dataset-name' || value === 'https://example.com') {
      errors.push(`Environment variable ${key} has placeholder value: ${value}`);
    }
  });
  
  // 本番環境での追加検証
  if (process.env.NODE_ENV === 'production') {
    // 本番環境では必須のトークン
    if (!process.env.SANITY_API_TOKEN) {
      errors.push('Missing SANITY_API_TOKEN in production environment');
    }
    
    // 本番環境でのサイトURL検証
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl && !siteUrl.startsWith('https://')) {
      errors.push('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
    }
    
    // カスタムドメインの検証
    if (siteUrl && !siteUrl.includes('suptia.com')) {
      errors.push('NEXT_PUBLIC_SITE_URL should use the custom domain suptia.com in production');
    }
  }
  
  // エラーがある場合は例外を投げる
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    } else {
      console.warn('⚠️ Environment validation warnings:');
      errors.forEach(error => console.warn(`  - ${error}`));
    }
  }
  
  // 設定オブジェクトを構築
  const config: EnvConfig = {
    sanity: {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: process.env.SANITY_API_VERSION || '2023-05-03',
      token: process.env.SANITY_API_TOKEN,
      studioUrl: process.env.SANITY_STUDIO_URL || 'http://localhost:3333',
    },
    
    site: {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://suptia.com',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'サプティア',
      description: 'あなたに最も合うサプリを最も安い価格で。',
    },
    
    features: {
      analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      monitoring: process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true',
      preview: process.env.NODE_ENV !== 'production',
    },
    
    security: {
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
      rateLimitEnabled: process.env.ENABLE_RATE_LIMIT === 'true',
    },
  };
  
  // 開発環境での設定ログ
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment configuration loaded:');
    console.log(`   Site URL: ${config.site.url}`);
    console.log(`   Sanity Project: ${config.sanity.projectId}/${config.sanity.dataset}`);
    console.log(`   Features: Analytics=${config.features.analytics}, Monitoring=${config.features.monitoring}`);
  }
  
  return config;
}

/**
 * グローバル設定オブジェクト
 */
export const env = validateEnvironment();

/**
 * 環境変数の型安全なアクセサー
 */
export const getEnvVar = (key: keyof typeof process.env, fallback?: string): string => {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || fallback || '';
};

/**
 * 本番環境かどうかを判定
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * 開発環境かどうかを判定
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * プレビュー環境かどうかを判定
 */
export const isPreview = process.env.VERCEL_ENV === 'preview';

/**
 * Vercel環境かどうかを判定
 */
export const isVercel = Boolean(process.env.VERCEL);

/**
 * 環境情報の取得
 */
export const getEnvironmentInfo = () => ({
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  vercelUrl: process.env.VERCEL_URL,
  isProduction,
  isDevelopment,
  isPreview,
  isVercel,
});