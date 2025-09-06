import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';

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
  it('renders the main heading', async () => {
    const HomeComponent = await Home();
    render(HomeComponent);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('サプティア');
  });

  it('renders the tagline', async () => {
    const HomeComponent = await Home();
    render(HomeComponent);
    const tagline = screen.getByText(
      'あなたに最も合うサプリを最も安い価格で。'
    );
    expect(tagline).toBeInTheDocument();
  });

  it('renders the compare link', async () => {
    const HomeComponent = await Home();
    render(HomeComponent);
    const compareLink = screen
      .getAllByRole('link')
      .find(a => a.getAttribute('href') === '/compare');
    expect(compareLink).toBeTruthy();
  });

  it('renders product table when products are available', async () => {
    const HomeComponent = await Home();
    render(HomeComponent);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });
});
