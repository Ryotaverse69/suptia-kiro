import { defineField, defineType } from 'sanity';

export const category = defineType({
  name: 'category',
  title: 'カテゴリ',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'カテゴリ名',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '説明',
      type: 'text',
      description: 'カテゴリの詳細説明',
    }),
    defineField({
      name: 'image',
      title: 'カテゴリ画像',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required(),
      description: '258px × 258px推奨（トリバゴ準拠）',
    }),
    defineField({
      name: 'averagePrice',
      title: '平均価格 (円)',
      type: 'number',
      validation: Rule => Rule.required().min(0),
      description: 'このカテゴリの商品の平均価格',
    }),
    defineField({
      name: 'productCount',
      title: '商品数',
      type: 'number',
      validation: Rule => Rule.required().min(0),
      description: 'このカテゴリに属する商品の総数',
    }),
    defineField({
      name: 'displayOrder',
      title: '表示順序',
      type: 'number',
      validation: Rule => Rule.required().min(0),
      description: 'ホームページでの表示順序（小さい数字が先に表示）',
    }),
    defineField({
      name: 'isPopular',
      title: '人気カテゴリ',
      type: 'boolean',
      initialValue: false,
      description: 'ホームページの人気検索セクションに表示するか',
    }),
    defineField({
      name: 'priceHistory',
      title: '価格推移データ',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'pricePoint',
          title: '価格ポイント',
          fields: [
            {
              name: 'month',
              title: '月',
              type: 'string',
              validation: Rule => Rule.required(),
              description: 'YYYY-MM形式（例: 2024-01）',
            },
            {
              name: 'averagePrice',
              title: '平均価格',
              type: 'number',
              validation: Rule => Rule.required().min(0),
            },
          ],
          preview: {
            select: {
              month: 'month',
              price: 'averagePrice',
            },
            prepare({ month, price }) {
              return {
                title: month,
                subtitle: `¥${price?.toLocaleString()}`,
              };
            },
          },
        },
      ],
      description: '価格チャート用の月別平均価格データ',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEOタイトル',
      type: 'string',
      description: '検索エンジン用のタイトル（未設定時はカテゴリ名を使用）',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO説明文',
      type: 'text',
      description: '検索エンジン用の説明文',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      productCount: 'productCount',
      averagePrice: 'averagePrice',
      media: 'image',
      isPopular: 'isPopular',
    },
    prepare({ title, productCount, averagePrice, media, isPopular }) {
      return {
        title: `${title}${isPopular ? ' ⭐' : ''}`,
        subtitle: `${productCount}商品 - 平均¥${averagePrice?.toLocaleString()}`,
        media,
      };
    },
  },
});
