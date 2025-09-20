import { defineField, defineType } from 'sanity';

export const ingredientDetail = defineType({
  name: 'ingredientDetail',
  title: '成分詳細',
  type: 'document',
  fields: [
    defineField({
      name: 'ingredient',
      title: '対象成分',
      type: 'reference',
      to: [{ type: 'ingredient' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'overview',
      title: '概要',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required().min(160).max(280),
      description: '160〜280文字程度の概要説明',
    }),
    defineField({
      name: 'tldr',
      title: 'TL;DR',
      type: 'string',
      validation: Rule => Rule.required().min(40).max(140),
      description: '80〜120文字程度の要約',
    }),
    defineField({
      name: 'benefits',
      title: '期待される効果',
      type: 'array',
      of: [{ type: 'string' }],
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'safetyNotes',
      title: '安全性メモ',
      type: 'array',
      of: [{ type: 'string' }],
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'evidenceSummary',
      title: 'エビデンスサマリー',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'evidenceEntry',
          fields: [
            defineField({
              name: 'title',
              title: 'タイトル',
              type: 'string',
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'level',
              title: 'エビデンスレベル',
              type: 'string',
              options: {
                list: [
                  { title: 'A - 高品質な証拠', value: 'A' },
                  { title: 'B - 中程度の証拠', value: 'B' },
                  { title: 'C - 限定的な証拠', value: 'C' },
                ],
              },
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: '説明',
              type: 'text',
              rows: 3,
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'recommendedDosage',
      title: '推奨摂取量',
      type: 'object',
      fields: [
        defineField({
          name: 'amount',
          title: '量',
          type: 'number',
        }),
        defineField({
          name: 'unit',
          title: '単位',
          type: 'string',
          options: {
            list: [
              { title: 'mg', value: 'mg' },
              { title: 'g', value: 'g' },
              { title: 'mcg', value: 'mcg' },
              { title: 'IU', value: 'IU' },
            ],
          },
        }),
        defineField({
          name: 'frequency',
          title: '頻度',
          type: 'string',
          description: '例: 1日2回 / 就寝前など',
        }),
      ],
    }),
    defineField({
      name: 'representativeProducts',
      title: '代表的な商品',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'product' }],
        },
      ],
      validation: Rule => Rule.max(5),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEOタイトル',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO説明文',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'ingredient.name',
      subtitle: 'tldr',
    },
  },
});
