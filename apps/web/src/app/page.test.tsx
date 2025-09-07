import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { LocaleProvider } from '@/contexts/LocaleContext';

// Mock Next.js app router hooks used in LocaleProvider
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Sanity client
vi.mock('@/lib/sanity.client', () => ({
  sanity: {
    fetch: vi.fn().mockResolvedValue([
      {
        name: 'Test Product',
        priceJPY: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
        slug: { current: 'test-product' },
      },
    ]),
  },
}));

// Mock environment variables
beforeEach(() => {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
  process.env.NEXT_PUBLIC_SANITY_DATASET = 'test';
});

describe('Home Page', () => {
  const renderWithLocale = async () => {
    const HomeComponent = await Home();
    return render(<LocaleProvider>{HomeComponent}</LocaleProvider>);
  };

  it('renders the main heading', async () => {
    await renderWithLocale();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('サプティア');
  });

  it('renders the tagline', async () => {
    await renderWithLocale();
    const tagline = screen.getByText(
      'あなたに最も合うサプリを最も安い価格で。'
    );
    expect(tagline).toBeInTheDocument();
  });

  it('renders the compare link', async () => {
    await renderWithLocale();
    const compareLink = screen
      .getAllByRole('link')
      .find(a => a.getAttribute('href') === '/compare');
    expect(compareLink).toBeTruthy();
  });

  it('renders product table when products are available', async () => {
    await renderWithLocale();

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });
});
