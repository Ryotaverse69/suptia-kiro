import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  FilterSidebar,
  type UiFilters,
} from '@/components/search/FilterSidebar';
import type { SearchFacets } from '@/lib/search';

describe('FilterSidebar', () => {
  const baseFilters: UiFilters = {
    categories: [],
    brands: [],
    goals: [],
    ingredients: [],
    priceMin: 0,
    priceMax: 20000,
    rating: undefined,
    inStockOnly: false,
    onSale: false,
  };

  const baseFacets: SearchFacets = {
    categories: [
      { value: 'ビタミン', count: 10 },
      { value: 'ハーブ', count: 4 },
    ],
    brands: [{ value: 'Nature Made', count: 5 }],
    ingredients: [
      { value: 'ビタミンC', count: 6 },
      { value: 'マグネシウム', count: 3 },
    ],
    goals: [
      { value: '疲労回復', count: 8 },
      { value: '免疫ケア', count: 6 },
    ],
    priceRange: { min: 500, max: 20000 },
  };

  function renderSidebar(
    overrides: Partial<UiFilters> = {},
    opts: { onSelectCondition?: (condition: string) => void } = {}
  ) {
    const filters = { ...baseFilters, ...overrides };
    const onChange = vi.fn();
    const onReset = vi.fn();
    const onSelectCondition = opts.onSelectCondition ?? vi.fn();

    render(
      <FilterSidebar
        filters={filters}
        facets={baseFacets}
        onChange={onChange}
        onReset={onReset}
        suggestedConditions={['免疫ケア']}
        onSelectCondition={onSelectCondition}
      />
    );

    return { onChange, onReset, onSelectCondition, filters };
  }

  it('calls onChange when toggling a goal filter', () => {
    const { onChange, filters } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: '疲労回復' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ...filters,
      goals: ['疲労回復'],
    });
  });

  it('calls onChange when toggling ingredient checkbox', () => {
    const { onChange, filters } = renderSidebar();

    const checkbox = screen.getByRole('button', { name: 'ビタミンC' });
    fireEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith({
      ...filters,
      ingredients: ['ビタミンC'],
    });
  });

  it('applies suggested condition when AI chip is clicked', () => {
    const { onSelectCondition } = renderSidebar(
      {},
      { onSelectCondition: vi.fn() }
    );

    fireEvent.click(screen.getByRole('button', { name: '免疫ケア を適用' }));

    expect(onSelectCondition).toHaveBeenCalledWith('免疫ケア');
  });

  it('invokes onReset when reset button is clicked', () => {
    const { onReset } = renderSidebar();

    fireEvent.click(
      screen.getByRole('button', { name: 'すべてのフィルターを解除' })
    );

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
