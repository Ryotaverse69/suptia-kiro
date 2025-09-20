import { defineField, defineType } from 'sanity';

export const ingredient = defineType({
  name: 'ingredient',
  title: '成分',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '成分名',
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
      name: 'category',
      title: 'カテゴリー',
      type: 'string',
      options: {
        list: [
          { title: 'ビタミン', value: 'vitamin' },
          { title: 'ミネラル', value: 'mineral' },
          { title: 'ハーブ', value: 'herb' },
          { title: 'アミノ酸', value: 'amino' },
          { title: 'その他', value: 'other' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'synonyms',
      title: '別名・同義語',
      type: 'array',
      of: [{ type: 'string' }],
      description: '検索で使用される別名や英語名など',
    }),
    defineField({
      name: 'mechanisms',
      title: '作用機序',
      type: 'array',
      of: [{ type: 'string' }],
      description: '体内での主な作用メカニズム',
    }),
    defineField({
      name: 'benefits',
      title: '主なメリット',
      type: 'array',
      of: [{ type: 'string' }],
      description: '期待される効果や得られるメリット',
    }),
    defineField({
      name: 'sideEffects',
      title: '副作用・リスク',
      type: 'array',
      of: [{ type: 'string' }],
      description: '一般的に報告されている副作用や注意事項',
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
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'safetyNotes',
      title: '安全性に関する注意',
      type: 'array',
      of: [{ type: 'string' }],
      description: '副作用、相互作用、注意事項など',
    }),
    defineField({
      name: 'tags',
      title: 'タグ',
      type: 'array',
      of: [{ type: 'string' }],
      description: '健康目標や効果に関するタグ',
    }),
    defineField({
      name: 'popularityScore',
      title: '人気スコア',
      type: 'number',
      description: '検索や売上を元にした人気度メトリクス',
      validation: Rule => Rule.min(0),
    }),
    defineField({
      name: 'description',
      title: '説明',
      type: 'text',
      description: '成分の概要説明',
    }),
    defineField({
      name: 'recommendedDosage',
      title: '推奨摂取量',
      type: 'object',
      fields: [
        {
          name: 'amount',
          title: '量',
          type: 'number',
        },
        {
          name: 'unit',
          title: '単位',
          type: 'string',
          options: {
            list: ['mg', 'g', 'mcg', 'IU'],
          },
        },
        {
          name: 'frequency',
          title: '頻度',
          type: 'string',
          description: '例: 1日1回、食後など',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      evidenceLevel: 'evidenceLevel',
    },
    prepare({ title, subtitle, evidenceLevel }) {
      return {
        title,
        subtitle: `${subtitle} (エビデンス: ${evidenceLevel})`,
      };
    },
  },
});
