"use client";

import { useTranslation } from '@/contexts/LocaleContext';

export default function AIRecommendationSection() {
  const { t } = useTranslation();

  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto text-center mb-8'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3 animate-fade-in'>
            <span className='gradient-text'>AI Recommendations</span>
          </h2>
          <p className='text-gray-700'>
            {/* 簡易な説明文（仮文言） */}
            あなたの目的や体質に基づいて、最適なサプリを提案します。
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <a
              key={i}
              href={`/products?recommended=${i}`}
              className='glass-effect rounded-xl p-6 shadow-soft hover:shadow-strong transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 apple-hover'
            >
              <div className='text-sm text-primary-600 font-semibold mb-2'>
                あなた向け
              </div>
              <div className='h-32 w-full bg-gray-100 rounded-xl mb-4' aria-hidden='true' />
              <div className='text-lg font-bold text-gray-900 mb-1'>
                推奨プロダクト {i}
              </div>
              <div className='text-gray-600 text-sm'>
                高エビデンス / 良コスパ / 高い実用性
              </div>
            </a>
          ))}
        </div>

        <div className='text-center mt-10'>
          <a
            href='/diagnosis'
            className='inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl shadow-soft hover:shadow-medium transition-all ease-apple'
          >
            🧭 診断してAIの提案を見る
          </a>
        </div>
      </div>
    </section>
  );
}

