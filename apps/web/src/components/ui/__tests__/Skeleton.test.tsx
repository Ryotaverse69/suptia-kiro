import { render, screen } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders card variant with role status', () => {
    render(<Skeleton data-testid='card-skeleton' />);

    const skeleton = screen.getByTestId('card-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveClass('rounded-2xl');
  });

  it('renders list variant with given line count', () => {
    render(<Skeleton variant='list' lines={3} />);

    const rows = screen.getAllByRole('status')[0].querySelectorAll('div');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders filter variant with bordered container', () => {
    render(<Skeleton variant='filter' data-testid='filter-skeleton' />);

    const skeleton = screen.getByTestId('filter-skeleton');
    expect(skeleton).toHaveClass('border');
    expect(skeleton).toHaveClass('shadow-soft');
  });
});
