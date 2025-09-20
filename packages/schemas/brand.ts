import { defineField, defineType } from 'sanity';

export const brand = defineType({
  name: 'brand',
  title: 'ブランド',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'ブランド名',
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
      name: 'logo',
      title: 'ロゴ',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'description',
      title: '説明',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'website',
      title: '公式サイトURL',
      type: 'url',
    }),
    defineField({
      name: 'country',
      title: '拠点国',
      type: 'string',
      options: {
        list: [
          { title: '日本', value: 'JP' },
          { title: 'アメリカ', value: 'US' },
          { title: 'カナダ', value: 'CA' },
          { title: 'ドイツ', value: 'DE' },
          { title: 'イギリス', value: 'GB' },
          { title: 'その他', value: 'OTHER' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      country: 'country',
      media: 'logo',
    },
    prepare({ title, country, media }) {
      return {
        title,
        subtitle: country ? `拠点国: ${country}` : undefined,
        media,
      };
    },
  },
});
