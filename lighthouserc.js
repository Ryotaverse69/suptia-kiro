module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/compare'],
      // Build and start Next.js on the root script that proxies to apps/web
      startServerCommand: 'npm run build && npm run start',
      // Match Next.js startup output line with Local URL
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 90000,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        // Core Web Vitals thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // ms
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        // FID has been replaced by INP in field data; use MP-FID as a proxy in LH
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
      },
      // Page-specific overrides
      assertionMatrix: [
        {
          matchingUrlPattern: '/compare',
          assertions: {
            'largest-contentful-paint': ['warn', { maxNumericValue: 3300 }],
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.2 }],
          },
        },
      ],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
