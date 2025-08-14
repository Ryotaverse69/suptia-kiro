/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://suptia.com',
  generateRobotsText: true,
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  
  // Exclude admin and API routes
  exclude: [
    '/admin/*',
    '/api/*',
    '/studio/*',
    '/_next/*',
    '/404',
    '/500'
  ],
  
  // Additional paths to include
  additionalPaths: async (config) => {
    // You can fetch dynamic routes here
    // For now, we'll include static routes
    return [
      await config.transform(config, '/'),
      await config.transform(config, '/compare'),
    ];
  },
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/studio/', '/_next/'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://suptia.com'}/sitemap.xml`,
    ],
  },
  
  transform: async (config, path) => {
    // Custom transform function
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === '/' ? 1.0 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
