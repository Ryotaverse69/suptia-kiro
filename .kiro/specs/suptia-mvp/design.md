# Suptia MVP Design Document

**specVersion**: 2025-08-13

## Overview

Suptiaプロジェクトの横断的なセキュリティ、SEO、LLM/エージェント、アクセシビリティ方針を実装します。Next.jsアプリケーション全体で一貫したセキュリティヘッダー、SEO最適化、アクセシビリティ対応、LLMエージェントの安全な運用を実現する包括的なシステムです。

## Architecture

### Security Layer
```
next.config.js
├── Security Headers Configuration
├── CSP Policy Definition
└── API Route Protection

middleware.ts
├── Request Validation
├── Rate Limiting
└── Security Headers Application

lib/security/
├── validation.ts (Zod schemas)
├── rate-limit.ts (IP-based limiting)
└── sanitize.ts (Content sanitization)
```

### SEO Layer
```
lib/seo/
├── metadata.ts (Dynamic metadata generation)
├── json-ld.ts (Structured data)
├── sitemap.ts (Sitemap generation)
└── canonical.ts (URL cleaning)

app/
├── sitemap.xml/route.ts
├── robots.txt/route.ts
└── layout.tsx (Global SEO setup)
```

### Accessibility Layer
```
components/ui/
├── AccessibleTable.tsx
├── AccessibleBanner.tsx
└── KeyboardNavigation.tsx

lib/a11y/
├── aria-utils.ts
└── keyboard-handlers.ts
```

### LLM/Agent Safety Layer
```
.kiro/steering/
├── security.md (Security guidelines)
└── communication.md (Language guidelines)

lib/agent/
├── content-filter.ts
└── domain-whitelist.ts
```

## Components and Interfaces

### Security Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.sanity.io data:; connect-src 'self' https://*.sanity.io; upgrade-insecure-requests;" 
    // GA4利用時のみ: script-src に https://www.googletagmanager.com を追加
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

// middleware.ts
interface RateLimitConfig {
  windowMs: number; // 600000 (10 minutes)
  maxRequests: number; // 60
  skipSuccessfulRequests: boolean;
  logIpHash: boolean; // IPハッシュをログに記録
  logRoute: boolean; // 経路をログに記録
}

interface SecurityMiddleware {
  validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T;
  checkRateLimit(ip: string): boolean;
  applySanitization(content: string): string;
}
```

### SEO Utilities

```typescript
// lib/seo/json-ld.ts
interface ProductJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'JPY';
    availability: string;
  };
  url: string;
  image?: string;
  description?: string;
}

interface BreadcrumbJsonLd {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

// lib/seo/canonical.ts
interface CanonicalUrlConfig {
  baseUrl: string;
  excludeParams: string[];
}

export function cleanUrl(url: string, config: CanonicalUrlConfig): string;
export function generateCanonical(path: string): string;
```

### Accessibility Components

```typescript
// components/ui/AccessibleTable.tsx
interface AccessibleTableProps {
  caption: string;
  headers: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | 'none';
  }>;
  data: Array<Record<string, any>>;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

// components/ui/AccessibleBanner.tsx
interface AccessibleBannerProps {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  role?: 'alert' | 'status';
}
```

### LLM Agent Safety

```typescript
// lib/agent/content-filter.ts
interface ContentFilter {
  isExternalInstruction(content: string): boolean;
  sanitizeContent(content: string): string;
  validateDomain(url: string): boolean;
}

interface AgentSafetyConfig {
  allowedDomains: string[];
  blockedInstructions: string[];
  requireConfirmation: string[];
}

// lib/agent/domain-whitelist.ts
const ALLOWED_DOMAINS = [
  '*.sanity.io',
  '*.suptia.com',
  'localhost',
  '127.0.0.1'
];

export function isDomainAllowed(domain: string): boolean;
export function validateNetworkAccess(url: string): boolean;
```

## Data Models

### Security Headers Configuration
```typescript
interface SecurityHeadersConfig {
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    fontSrc: string[];
  };
  frameOptions: 'DENY' | 'SAMEORIGIN';
  contentTypeOptions: 'nosniff';
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}
```

### SEO Metadata Schema
```typescript
interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
    images?: string[];
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    images?: string[];
  };
  jsonLd: Array<ProductJsonLd | BreadcrumbJsonLd>;
}
```

### ISR Configuration
```typescript
interface ISRConfig {
  '/products/[slug]': {
    revalidate: 600; // 10 minutes
  };
  '/': {
    revalidate: 3600; // 1 hour
  };
  '/products': {
    revalidate: 1800; // 30 minutes
  };
}
```

## Error Handling

### Security Error Handling
1. **CSP Violations**: ログ記録と適切なフォールバック
2. **Rate Limit Exceeded**: 429ステータスコードと適切なRetry-Afterヘッダー
3. **Input Validation Errors**: 400ステータスコードと詳細なエラーメッセージ
4. **Unauthorized Access**: 401/403ステータスコードと適切なリダイレクト

### SEO Error Handling
1. **Invalid JSON-LD**: 構造化データの検証とフォールバック
2. **Missing Metadata**: デフォルト値の適用
3. **Canonical URL Errors**: 基本URLへのフォールバック

### Agent Safety Error Handling
1. **External Instruction Detection**: 指示の実行拒否とログ記録
2. **Domain Violation**: ネットワークアクセスの拒否
3. **Unauthorized Operations**: 操作の停止と確認要求

## Testing Strategy

### Security Testing
```typescript
describe('Security Headers', () => {
  it('CSPヘッダーが正しく設定される');
  it('X-Frame-Optionsが適切に設定される');
  it('レート制限が正常に動作する');
  it('入力検証が不正データを拒否する');
});

describe('Agent Safety', () => {
  it('外部指示を検出して拒否する');
  it('許可されていないドメインへのアクセスを拒否する');
  it('書き込み操作前に確認を要求する');
});
```

### SEO Testing
```typescript
describe('SEO Optimization', () => {
  it('Product JSON-LDが正しく生成される');
  it('BreadcrumbList JSON-LDが適切に設定される');
  it('canonical URLからトラッキングパラメータが除去される');
  it('sitemap.xmlが正しく生成される');
});
```

### Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('テーブルに適切なcaptionが設定される');
  it('ソート可能なヘッダーにaria-sort属性が設定される');
  it('警告バナーにrole="status"が設定される');
  it('キーボードナビゲーションが正常に動作する');
});
```

## Performance Considerations

### ISR Optimization
- 商品詳細ページ: 10分間隔での再生成
- 一覧ページ: 30分間隔での再生成
- 静的ページ: 1時間間隔での再生成

### Security Performance
- レート制限: メモリベースの簡易実装（Redis移行を将来検討）
- CSP: インライン許可を最小限に抑制
- 入力検証: Zodスキーマの最適化

### SEO Performance
- JSON-LD: 必要最小限のデータのみ含める
- Sitemap: 動的生成とキャッシュ
- Canonical URL: 効率的なパラメータ除去

## Accessibility Considerations

### WCAG 2.1 AA Compliance
- テーブル: caption、scope属性、aria-sort
- フォーム: 適切なラベルとエラーメッセージ
- ナビゲーション: キーボードアクセス、フォーカス管理
- 色彩: 十分なコントラスト比の確保

### Screen Reader Support
- セマンティックHTML構造
- 適切なARIA属性
- 読み上げ順序の最適化

## Security Considerations

### Content Security Policy
- スクリプト実行の制限
- インライン実行の最小化
- 外部リソースの制限

### Input Validation
- すべてのAPI入力のZod検証
- SQLインジェクション防止
- XSS防止のサニタイゼーション

### Agent Safety
- 外部コンテンツの指示実行禁止
- ドメインホワイトリスト制限
- 書き込み操作の事前確認

## Definition of Done (DoD)

### Code Quality
- [ ] すべてのテストが緑色で通過
- [ ] ESLint/Prettierが通過
- [ ] TypeScript型チェックが通過

### Security
- [ ] セキュリティヘッダーが適切に設定
- [ ] 入力検証が実装済み
- [ ] レート制限が動作

### SEO
- [ ] JSON-LD構造化データが検証OK
- [ ] sitemap.xml/robots.txtが生成
- [ ] canonical URLが適切に設定

### Accessibility
- [ ] a11y属性が正しく設定
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダーテスト通過

### Agent Safety
- [ ] LLM steeringルールが遵守
- [ ] 外部指示フィルターが動作
- [ ] ドメインホワイトリストが適用

### Performance
- [ ] Lighthouse Performance >= 90
- [ ] Lighthouse Best Practices >= 90
- [ ] ISRが適切に設定

### CI/CD
- [ ] pnpm auditが通過
- [ ] semgrep(js/ts minimum)が通過
- [ ] Lighthouse CI（perf/bp >= 90、警告扱い）が実行