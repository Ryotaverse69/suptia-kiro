import { defineField, defineType } from 'sanity';

const HEALTH_GOAL_OPTIONS = [
  { title: '疲労回復', value: '疲労回復' },
  { title: '美容・スキンケア', value: '美容・スキンケア' },
  { title: '免疫ケア', value: '免疫ケア' },
  { title: '睡眠サポート', value: '睡眠サポート' },
  { title: '筋力アップ', value: '筋力アップ' },
  { title: '集中力', value: '集中力' },
  { title: '心血管サポート', value: '心血管サポート' },
  { title: '体重管理', value: '体重管理' },
];

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
      type: 'reference',
      to: [{ type: 'brand' }],
      validation: Rule => Rule.required(),
      description: '商品のブランド情報（ブランドドキュメントへの参照）',
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
      title: '参考価格 (円)',
      type: 'number',
      validation: Rule => Rule.min(0),
      description:
        '旧データ用の参考価格。新しい価格情報は価格リストに登録してください。',
    }),
    defineField({
      name: 'prices',
      title: '価格リスト',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'priceEntry',
          fields: [
            defineField({
              name: 'store',
              title: 'ストア名',
              type: 'string',
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'storeUrl',
              title: '購入URL',
              type: 'url',
            }),
            defineField({
              name: 'price',
              title: '価格',
              type: 'number',
              validation: Rule => Rule.required().min(0),
            }),
            defineField({
              name: 'currency',
              title: '通貨',
              type: 'string',
              options: {
                list: [
                  { title: '日本円 (JPY)', value: 'JPY' },
                  { title: '米ドル (USD)', value: 'USD' },
                ],
              },
              initialValue: 'JPY',
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'inStock',
              title: '在庫あり',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'onSale',
              title: 'セール対象',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'salePrice',
              title: 'セール価格',
              type: 'number',
              validation: Rule => Rule.min(0),
            }),
            defineField({
              name: 'lastUpdated',
              title: '最終更新日時',
              type: 'datetime',
            }),
          ],
          preview: {
            select: {
              store: 'store',
              price: 'price',
              currency: 'currency',
            },
            prepare({ store, price, currency }) {
              return {
                title: store || '未設定のストア',
                subtitle:
                  price != null
                    ? `${currency ?? 'JPY'} ${price.toLocaleString()}`
                    : '価格未設定',
              };
            },
          },
        },
      ],
      description: '各ECサイトの価格情報（複数登録可）',
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
      name: 'targetGoals',
      title: '想定する健康目標',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: HEALTH_GOAL_OPTIONS,
      },
      validation: Rule => Rule.unique(),
    }),
    defineField({
      name: 'primaryEffect',
      title: '代表的な効果',
      type: 'string',
    }),
    defineField({
      name: 'rating',
      title: '平均評価',
      type: 'number',
      validation: Rule => Rule.min(0).max(5),
      description: '外部レビューサイト等から算出した平均評価 (0.0 - 5.0)',
    }),
    defineField({
      name: 'reviewCount',
      title: 'レビュー件数',
      type: 'number',
      validation: Rule => Rule.min(0),
    }),
    defineField({
      name: 'evidenceLevel',
      title: 'エビデンスレベル',
      type: 'string',
      options: {
        list: [
          { title: 'A - 高品質な証拠', value: 'A' },
          { title: 'B - 中程度の証拠', value: 'B' },
          { title: 'C - 限定的な証拠', value: 'C' },
        ],
      },
    }),
    defineField({
      name: 'safetyRating',
      title: '安全性指標',
      type: 'string',
      options: {
        list: [
          { title: '高', value: 'high' },
          { title: '中', value: 'medium' },
          { title: '注意', value: 'low' },
        ],
      },
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
      brandName: 'brand->name',
      price: 'priceJPY',
      rating: 'rating',
      media: 'images.0',
    },
    prepare({ title, brandName, price, rating, media }) {
      const priceText =
        price != null ? `¥${price.toLocaleString()}` : '価格未設定';
      const ratingText = rating != null ? ` / 評価 ${rating.toFixed(1)}` : '';
      return {
        title,
        subtitle: `${brandName ?? 'ブランド未設定'} - ${priceText}${ratingText}`,
        media,
      };
    },
  },
});
