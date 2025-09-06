module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/compare'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        // Core Web Vitals thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // FID has been replaced by INP in field data; use MP-FID as a proxy in LH
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
