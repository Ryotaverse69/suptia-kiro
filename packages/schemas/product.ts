import { defineField, defineType } from 'sanity';

export const product = defineType({
  name: 'product',
  title: '商品',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '商品名',
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
      name: 'brand',
      title: 'ブランド',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'カテゴリ',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: Rule => Rule.required(),
      description: '商品が属するカテゴリ',
    }),
    defineField({
      name: 'ingredients',
      title: '成分構成',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'ingredient',
              title: '成分',
              type: 'reference',
              to: [{ type: 'ingredient' }],
              validation: Rule => Rule.required(),
            },
            {
              name: 'amountMgPerServing',
              title: '1回分あたりの含有量 (mg)',
              type: 'number',
              validation: Rule => Rule.required().min(0),
            },
          ],
          preview: {
            select: {
              ingredientName: 'ingredient.name',
              amount: 'amountMgPerServing',
            },
            prepare({ ingredientName, amount }) {
              return {
                title: ingredientName || '成分未選択',
                subtitle: `${amount}mg`,
              };
            },
          },
        },
      ],
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'servingsPerDay',
      title: '1日あたりの摂取回数',
      type: 'number',
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'servingsPerContainer',
      title: '1容器あたりの回数',
      type: 'number',
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'priceJPY',
      title: '価格 (円)',
      type: 'number',
      validation: Rule => Rule.required().min(0),
    }),
    defineField({
      name: 'urls',
      title: '購入リンク',
      type: 'object',
      fields: [
        {
          name: 'amazon',
          title: 'Amazon',
          type: 'url',
        },
        {
          name: 'rakuten',
          title: '楽天',
          type: 'url',
        },
        {
          name: 'iherb',
          title: 'iHerb',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'images',
      title: '商品画像',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
    defineField({
      name: 'warnings',
      title: '注意事項',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'アレルギー情報、相互作用など',
    }),
    defineField({
      name: 'description',
      title: '商品説明',
      type: 'text',
    }),
    defineField({
      name: 'form',
      title: '剤形',
      type: 'string',
      options: {
        list: [
          { title: 'カプセル', value: 'capsule' },
          { title: 'タブレット', value: 'tablet' },
          { title: 'ソフトジェル', value: 'softgel' },
          { title: 'パウダー', value: 'powder' },
          { title: 'リキッド', value: 'liquid' },
          { title: 'グミ', value: 'gummy' },
        ],
      },
    }),
    defineField({
      name: 'thirdPartyTested',
      title: '第三者機関検査済み',
      type: 'boolean',
      description: '品質検査の有無',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      brand: 'brand',
      price: 'priceJPY',
      media: 'images.0',
    },
    prepare({ title, brand, price, media }) {
      return {
        title,
        subtitle: `${brand} - ¥${price?.toLocaleString()}`,
        media,
      };
    },
  },
});
