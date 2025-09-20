import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { HeroSearch } from '../search/HeroSearch';
import { LocaleProvider } from '@/contexts/LocaleContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/ingredient-data', async original => {
  const actual = await original();
  return {
    ...actual,
  };
});

const mockFetch = vi.fn(async () => ({
  ok: true,
  json: async () => ({
    suggestions: [
      { id: 'goal-immune', type: 'goal', label: '免疫ケア', score: 200 },
      {
        id: 'ingredient-vitamin-c',
        type: 'ingredient',
        label: 'ビタミンC',
        score: 150,
      },
    ],
  }),
})) as unknown as typeof fetch;

beforeEach(() => {
  vi.restoreAllMocks();
  (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HeroSearch', () => {
  it('renders headline and search form', () => {
    render(
      <LocaleProvider>
        <HeroSearch />
      </LocaleProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('hero-copy-subheadline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
  });

  it('renders goal links with proper href', () => {
    render(
      <LocaleProvider>
        <HeroSearch />
      </LocaleProvider>
    );

    const goalLink = screen
      .getAllByRole('link')
      .find(link => link.getAttribute('href')?.startsWith('/search?goal='));
    expect(goalLink).toBeDefined();
  });
});
