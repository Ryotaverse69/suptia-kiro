'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type EvidenceLevel = 'A' | 'B' | 'C';

export interface IngredientGuideItem {
  id: string;
  name: string;
  summary: string;
  tlDr?: string;
  evidenceLevel: EvidenceLevel;
  safety: '高' | '中' | '要注意';
  effect: string;
  representativeProducts: string[];
}

interface IngredientGuideProps {
  ingredients: IngredientGuideItem[];
  heading?: string;
  subheading?: string;
  className?: string;
}

function evidenceBadge(level: EvidenceLevel) {
  switch (level) {
    case 'A':
      return { label: 'エビデンス A', variant: 'high' as const };
    case 'B':
      return { label: 'エビデンス B', variant: 'medium' as const };
    default:
      return { label: 'エビデンス C', variant: 'low' as const };
  }
}

function safetyBadge(value: IngredientGuideItem['safety']) {
  switch (value) {
    case '高':
      return { label: '安全性 高', variant: 'success' as const };
    case '中':
      return { label: '安全性 中', variant: 'warning' as const };
    default:
      return { label: '安全性 注意', variant: 'danger' as const };
  }
}

export function IngredientGuideSection({
  ingredients,
  heading = '成分ガイド',
  subheading = 'Evidence-based Ingredient Insights',
  className,
}: IngredientGuideProps) {
  const router = useRouter();

  return (
    <section
      id='ingredient-guide'
      className={cn('relative py-20', className)}
      aria-labelledby='ingredient-guide-heading'
    >
      <div
        className='absolute inset-0 bg-gradient-to-b from-white/80 via-background-subtle to-white'
        aria-hidden='true'
      />
      <div className='container relative flex w-full flex-col gap-12'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <span className='text-xs font-semibold uppercase tracking-[0.32em] text-secondary-500'>
            Ingredient Intelligence
          </span>
          <div className='space-y-2'>
            <h2
              id='ingredient-guide-heading'
              className='text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl'
            >
              {heading}
            </h2>
            <p className='text-sm text-text-muted md:text-base'>
              効果・安全性・エビデンスをひと目で。興味のある成分をクリックして、比較検索にジャンプ。
            </p>
          </div>
        </div>

        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {ingredients.map(ingredient => {
            const evidence = evidenceBadge(ingredient.evidenceLevel);
            const safety = safetyBadge(ingredient.safety);
            return (
              <Card
                key={ingredient.id}
                variant='ingredient'
                hover='glow'
                padding='lg'
                className='group flex h-full flex-col gap-4 border-border/60 bg-white/90 backdrop-blur-sm'
              >
                <button
                  type='button'
                  onClick={() =>
                    router.push(
                      `/search?q=${encodeURIComponent(ingredient.name)}`
                    )
                  }
                  className='flex h-full flex-col gap-4 text-left focus-visible:outline-none'
                >
                  <div className='flex flex-col gap-2'>
                    <h3 className='text-lg font-semibold tracking-tight text-slate-900'>
                      {ingredient.name}
                    </h3>
                    <p className='line-clamp-2 text-sm text-text-muted'>
                      {ingredient.summary}
                    </p>
                    {ingredient.tlDr ? (
                      <p className='text-xs font-medium text-primary-600'>
                        TL;DR: {ingredient.tlDr}
                      </p>
                    ) : null}
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='effect' size='sm'>
                      効果 {ingredient.effect}
                    </Badge>
                    <Badge variant={safety.variant} size='sm'>
                      {safety.label}
                    </Badge>
                    <Badge variant='info' size='sm'>
                      {evidence.label}
                    </Badge>
                  </div>

                  {ingredient.representativeProducts.length > 0 ? (
                    <div className='mt-auto flex flex-col gap-2 rounded-2xl bg-background-surface/80 p-3 text-xs text-text-muted transition-all duration-150 ease-apple group-hover:bg-background-surface'>
                      <span className='font-semibold text-text-subtle'>
                        代表的なプロダクト
                      </span>
                      <ul className='space-y-1'>
                        {ingredient.representativeProducts
                          .slice(0, 3)
                          .map(product => (
                            <li
                              key={product}
                              className='flex items-center gap-2'
                            >
                              <span aria-hidden='true'>•</span>
                              <span className='truncate'>{product}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </button>
              </Card>
            );
          })}
        </div>

        <div className='flex items-center justify-center'>
          <Button
            asChild
            variant='ghost'
            size='lg'
            className='rounded-full border border-border/60 px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-text-muted hover:border-secondary-300 hover:text-secondary-600'
          >
            <a href='/ingredients'>成分辞典を見る</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default IngredientGuideSection;
