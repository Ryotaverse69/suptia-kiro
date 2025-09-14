import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppleSearchBar, AISuggestion } from '../AppleSearchBar';

const mockSuggestions: AISuggestion[] = [
  {
    id: '1',
    text: '疲労回復に効果的なビタミンB群',
    intent: 'purpose',
    confidence: 0.92,
  },
  {
    id: '2',
    text: '美容効果の高いコラーゲンサプリ',
    intent: 'purpose',
    confidence: 0.88,
  },
];

describe('AppleSearchBar', () => {
  it('renders search input with correct placeholder', () => {
    render(<AppleSearchBar onSearch={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<AppleSearchBar onSearch={vi.fn()} />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    expect(searchButton).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', async () => {
    const mockOnSearch = vi.fn();
    render(<AppleSearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    const searchButton = screen.getByRole('button', { name: '検索' });

    fireEvent.change(searchInput, { target: { value: 'ビタミンD' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('ビタミンD');
    });
  });

  it('shows AI suggestions when input is focused', async () => {
    render(
      <AppleSearchBar onSearch={vi.fn()} aiSuggestions={mockSuggestions} />
    );

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('AIサジェスト')).toBeInTheDocument();
      expect(
        screen.getByText('疲労回復に効果的なビタミンB群')
      ).toBeInTheDocument();
      expect(
        screen.getByText('美容効果の高いコラーゲンサプリ')
      ).toBeInTheDocument();
    });
  });

  it('calls onSearch when suggestion is clicked', async () => {
    const mockOnSearch = vi.fn();
    render(
      <AppleSearchBar onSearch={mockOnSearch} aiSuggestions={mockSuggestions} />
    );

    const searchInput = screen.getByPlaceholderText(
      'サプリメントを検索（例：ビタミンD、疲労回復、美容）'
    );
    fireEvent.focus(searchInput);

    await waitFor(() => {
      const suggestion = screen.getByText('疲労回復に効果的なビタミンB群');
      fireEvent.click(suggestion);
    });

    expect(mockOnSearch).toHaveBeenCalledWith('疲労回復に効果的なビタミンB群');
  });

  it('supports controlled component pattern', () => {
    const mockOnChange = vi.fn();
    render(
      <AppleSearchBar
        onSearch={vi.fn()}
        value='test value'
        onChange={mockOnChange}
      />
    );

    const searchInput = screen.getByDisplayValue('test value');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'new value' } });
    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('has proper accessibility attributes', () => {
    render(
      <AppleSearchBar onSearch={vi.fn()} aiSuggestions={mockSuggestions} />
    );

    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toHaveAttribute('aria-label', 'サプリメント検索');
    expect(searchInput).toHaveAttribute('aria-expanded', 'false');
    expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('disables search button when input is empty', () => {
    render(<AppleSearchBar onSearch={vi.fn()} />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    expect(searchButton).toBeDisabled();
  });

  it('enables search button when input has value', () => {
    render(<AppleSearchBar onSearch={vi.fn()} value='test' />);

    const searchButton = screen.getByRole('button', { name: '検索' });
    expect(searchButton).not.toBeDisabled();
  });
});
