module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/compare',
        'http://localhost:3000/products/vitamin-c'
      ],
      startServerCommand: 'cd apps/web && npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
    },
    assert: {
      assertions: {
        // 要件8.6: パフォーマンス >= 90 (警告レベル)
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // 要件8.6: ベストプラクティス >= 90 (警告レベル)
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // セキュリティヘッダーの確認
        'csp-xss': ['warn', { minScore: 0.8 }],
        'is-on-https': ['error', { minScore: 1 }],
        
        // アクセシビリティの詳細チェック
        'color-contrast': ['error', { minScore: 1 }],
        'heading-order': ['warn', { minScore: 0.9 }],
        'aria-allowed-attr': ['error', { minScore: 1 }],
        'aria-required-attr': ['error', { minScore: 1 }],
        
        // SEOの詳細チェック
        'meta-description': ['warn', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'canonical': ['warn', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};