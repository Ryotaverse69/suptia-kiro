import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchForm } from '../search/SearchForm';
import { LocaleProvider } from '@/contexts/LocaleContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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

describe('SearchForm', () => {
  it('submits with typed query', async () => {
    const handleSubmit = vi.fn();
    render(
      <LocaleProvider>
        <SearchForm onSubmit={handleSubmit} />
      </LocaleProvider>
    );

    const input = screen.getByPlaceholderText('商品名・成分・目的を入力');
    fireEvent.change(input, { target: { value: 'ビタミンD' } });

    const button = screen.getByRole('button', { name: '検索' });
    fireEvent.click(button);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'ビタミンD' })
    );
  });

  it('shows suggestions after debounce', async () => {
    render(
      <LocaleProvider>
        <SearchForm />
      </LocaleProvider>
    );

    fireEvent.focus(screen.getByPlaceholderText('商品名・成分・目的を入力'));
    fireEvent.change(screen.getByPlaceholderText('商品名・成分・目的を入力'), {
      target: { value: 'ビタミン' },
    });

    const suggestionButtons = await screen.findAllByRole('button');
    expect(
      suggestionButtons.some(button =>
        /ビタミンC/.test(button.textContent ?? '')
      )
    ).toBe(true);
  });
});
