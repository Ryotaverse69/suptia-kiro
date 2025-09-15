import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuggestChips, SuggestChip } from '../SuggestChips';

const mockChips: SuggestChip[] = [
  { id: '1', label: 'ビタミンD', category: 'ingredient', popular: true },
  { id: '2', label: '疲労回復', category: 'purpose', popular: true },
  { id: '3', label: '美容', category: 'purpose', popular: false },
  { id: '4', label: '免疫力', category: 'purpose', popular: false },
  { id: '5', label: 'プロテイン', category: 'ingredient', popular: false },
  { id: '6', label: 'オメガ3', category: 'ingredient', popular: false },
  { id: '7', label: 'ビタミンC', category: 'ingredient', popular: false },
];

describe('SuggestChips', () => {
  it('renders title correctly', () => {
    render(
      <SuggestChips
        chips={mockChips}
        onChipClick={vi.fn()}
        title='テストタイトル'
      />
    );

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
  });

  it('renders chips with correct labels', () => {
    render(<SuggestChips chips={mockChips} onChipClick={vi.fn()} />);

    expect(screen.getByText('ビタミンD')).toBeInTheDocument();
    expect(screen.getByText('疲労回復')).toBeInTheDocument();
    expect(screen.getByText('美容')).toBeInTheDocument();
  });

  it('shows popular indicator for popular chips', () => {
    render(<SuggestChips chips={mockChips} onChipClick={vi.fn()} />);

    const vitaminDChip = screen.getByText('ビタミンD').closest('button');
    expect(vitaminDChip).toHaveTextContent('🔥');

    const beautyChip = screen.getByText('美容').closest('button');
    expect(beautyChip).not.toHaveTextContent('🔥');
  });

  it('calls onChipClick when chip is clicked', () => {
    const mockOnChipClick = vi.fn();
    render(<SuggestChips chips={mockChips} onChipClick={mockOnChipClick} />);

    const vitaminDChip = screen.getByText('ビタミンD');
    fireEvent.click(vitaminDChip);

    expect(mockOnChipClick).toHaveBeenCalledWith(mockChips[0]);
  });

  it('limits visible chips based on maxVisible prop', () => {
    render(
      <SuggestChips chips={mockChips} onChipClick={vi.fn()} maxVisible={3} />
    );

    expect(screen.getByText('ビタミンD')).toBeInTheDocument();
    expect(screen.getByText('疲労回復')).toBeInTheDocument();
    expect(screen.getByText('美容')).toBeInTheDocument();
    expect(screen.queryByText('免疫力')).not.toBeInTheDocument();
  });

  it('shows "show more" button when there are more chips than maxVisible', () => {
    render(
      <SuggestChips chips={mockChips} onChipClick={vi.fn()} maxVisible={3} />
    );

    expect(screen.getByText('他4件を表示')).toBeInTheDocument();
  });

  it('expands to show all chips when "show more" is clicked', () => {
    render(
      <SuggestChips chips={mockChips} onChipClick={vi.fn()} maxVisible={3} />
    );

    const showMoreButton = screen.getByText('他4件を表示');
    fireEvent.click(showMoreButton);

    expect(screen.getByText('免疫力')).toBeInTheDocument();
    expect(screen.getByText('プロテイン')).toBeInTheDocument();
    expect(screen.getByText('表示を減らす')).toBeInTheDocument();
  });

  it('applies correct CSS classes for different categories', () => {
    render(<SuggestChips chips={mockChips} onChipClick={vi.fn()} />);

    const vitaminDChip = screen.getByText('ビタミンD').closest('button');
    expect(vitaminDChip).toHaveClass('bg-primary-100/80', 'text-primary-700');

    const fatigueChip = screen.getByText('疲労回復').closest('button');
    expect(fatigueChip).toHaveClass('bg-green-100/80', 'text-green-700');
  });

  it('has proper accessibility attributes', () => {
    render(<SuggestChips chips={mockChips} onChipClick={vi.fn()} />);

    const vitaminDChip = screen.getByText('ビタミンD').closest('button');
    expect(vitaminDChip).toHaveAttribute('aria-label', 'ビタミンDで検索');
  });

  it('applies hover effects correctly', () => {
    render(<SuggestChips chips={mockChips} onChipClick={vi.fn()} />);

    const vitaminDChip = screen.getByText('ビタミンD').closest('button');
    expect(vitaminDChip).toHaveClass('hover:scale-105', 'active:scale-95');
  });
});
