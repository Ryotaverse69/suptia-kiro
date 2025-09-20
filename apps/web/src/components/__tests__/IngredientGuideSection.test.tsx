import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { IngredientGuideSection } from '../sections/IngredientGuide';
import { LocaleProvider } from '@/contexts/LocaleContext';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('IngredientGuideSection', () => {
  beforeEach(() => {
    push.mockClear();
  });

  const ingredients = [
    {
      id: 'vitamin-c',
      name: 'ビタミンC',
      summary: '抗酸化作用と免疫サポートに優れる成分。',
      tlDr: '免疫機能と美容をサポート',
      evidenceLevel: 'A' as const,
      safety: '高' as const,
      effect: '免疫・美容',
      representativeProducts: ['Nature Made ビタミンC', 'DHC ビタミンC'],
    },
  ];

  it('renders ingredient information with indicators', () => {
    render(
      <LocaleProvider>
        <IngredientGuideSection ingredients={ingredients} />
      </LocaleProvider>
    );

    expect(screen.getByText('ビタミンC')).toBeInTheDocument();
    expect(screen.getByText('エビデンス A')).toBeInTheDocument();
    expect(screen.getByText('安全性 高')).toBeInTheDocument();
  });

  it('redirects to search when clicking an ingredient', () => {
    render(
      <LocaleProvider>
        <IngredientGuideSection ingredients={ingredients} />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByText('ビタミンC'));

    expect(push).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('ビタミンC'))
    );
  });
});
