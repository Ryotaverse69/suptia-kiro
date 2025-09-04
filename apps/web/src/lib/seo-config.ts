/**
 * SEO設定とメタデータ管理
 * 本番環境対応のSEO最適化
 */

import { Metadata } from 'next';
import { env } from './env-validation';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

/**
 * デフォルトSEO設定
 */
export const defaultSEO: SEOConfig = {
  title: 'サプティア - あなたに最も合うサプリを最も安い価格で',
  description: 'AIが分析する科学的根拠に基づいたサプリメント比較サイト。成分・価格・安全性を総合評価し、あなたに最適なサプリメントを見つけます。',
  keywords: [
    'サプリメント',
    '比較',
    'AI分析',
    '価格比較',
    '成分分析',
    '安全性',
    'エビデンス',
    'ビタミン',
    'ミネラル',
    '健康',
    '栄養',
    'サプティア'
  ],
  image: `${env.site.url}/images/og-image.jpg`,
  url: env.site.url,
  type: 'website',
};

/**
 * ページ別SEO設定を生成
 */
export function generateSEO(config: Partial<SEOConfig> = {}): Metadata {
  const seo = { ...defaultSEO, ...config };
  
  const title = seo.title;
  const description = seo.description;
  const url = seo.url || env.site.url;
  const image = seo.image || `${env.site.url}/images/og-image.jpg`;
  
  return {
    title,
    description,
    keywords: seo.keywords?.join(', '),
    
    // Open Graph
    openGraph: {
      title,
      description,
      url,
      siteName: 'サプティア',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ja_JP',
      type: (seo.type === 'product' ? 'website' : seo.type) || 'website',
      ...(seo.publishedTime && { publishedTime: seo.publishedTime }),
      ...(seo.modifiedTime && { modifiedTime: seo.modifiedTime }),
      ...(seo.author && { authors: [seo.author] }),
      ...(seo.section && { section: seo.section }),
      ...(seo.tags && { tags: seo.tags }),
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@suptia_official',
      site: '@suptia_official',
    },
    
    // 追加のメタタグ
    other: {
      'application-name': 'サプティア',
      'apple-mobile-web-app-title': 'サプティア',
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'theme-color': '#3b82f6',
      'color-scheme': 'light',
    },
    
    // Canonical URL
    alternates: {
      canonical: url,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_SITE_VERIFICATION,
    },
  };
}

/**
 * 商品ページ用SEO設定
 */
export function generateProductSEO(product: {
  name: string;
  description?: string;
  brand?: string;
  price?: number;
  image?: string;
  slug: string;
}): Metadata {
  const title = `${product.name} - ${product.brand || 'サプリメント'} | サプティア`;
  const description = product.description || 
    `${product.name}の詳細情報、成分分析、価格比較をサプティアで確認。科学的根拠に基づいた評価で最適なサプリメントを選択できます。`;
  
  return generateSEO({
    title,
    description,
    url: `${env.site.url}/products/${product.slug}`,
    image: product.image,
    type: 'product',
    keywords: [
      product.name,
      product.brand || '',
      'サプリメント',
      '成分分析',
      '価格比較',
      'レビュー',
      '効果',
      '安全性'
    ].filter(Boolean),
  });
}

/**
 * 記事ページ用SEO設定
 */
export function generateArticleSEO(article: {
  title: string;
  description?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  image?: string;
  slug: string;
}): Metadata {
  return generateSEO({
    title: `${article.title} | サプティア`,
    description: article.description,
    url: `${env.site.url}/articles/${article.slug}`,
    image: article.image,
    type: 'article',
    publishedTime: article.publishedTime,
    modifiedTime: article.modifiedTime,
    author: article.author,
    tags: article.tags,
    keywords: [
      ...(article.tags || []),
      'サプリメント',
      '健康',
      '栄養',
      'エビデンス',
      '科学的根拠'
    ],
  });
}

/**
 * 構造化データの生成
 */
export function generateStructuredData(type: 'website' | 'product' | 'article', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type === 'website' ? 'WebSite' : type === 'product' ? 'Product' : 'Article',
  };
  
  switch (type) {
    case 'website':
      return {
        ...baseData,
        name: 'サプティア',
        description: defaultSEO.description,
        url: env.site.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${env.site.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
      
    case 'product':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        brand: {
          '@type': 'Brand',
          name: data.brand,
        },
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'JPY',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: data.rating && {
          '@type': 'AggregateRating',
          ratingValue: data.rating.average,
          reviewCount: data.rating.count,
        },
      };
      
    case 'article':
      return {
        ...baseData,
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Person',
          name: data.author || 'サプティア編集部',
        },
        publisher: {
          '@type': 'Organization',
          name: 'サプティア',
          logo: {
            '@type': 'ImageObject',
            url: `${env.site.url}/images/logo.png`,
          },
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data.url,
        },
      };
      
    default:
      return baseData;
  }
}

/**
 * パンくずリストの構造化データ
 */
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQ構造化データ
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}