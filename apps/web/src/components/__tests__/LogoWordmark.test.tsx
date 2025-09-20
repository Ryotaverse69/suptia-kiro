import { render, screen } from '@testing-library/react';
import { LogoWordmark } from '../layout/LogoWordmark';

describe('LogoWordmark', () => {
  it('renders bilingual brand lockup', () => {
    render(<LogoWordmark />);

    expect(screen.getByLabelText('サプティア | Suptia')).toBeInTheDocument();
    expect(screen.getByText('サプティア')).toBeInTheDocument();
    expect(screen.getByText('Suptia')).toBeInTheDocument();
  });

  it('can hide the english tagline', () => {
    render(<LogoWordmark showEnglish={false} />);

    expect(
      screen.queryByText('Precision Supplement Intelligence')
    ).not.toBeInTheDocument();
  });

  it('applies size variants', () => {
    const { rerender } = render(<LogoWordmark size='sm' />);
    const label = screen.getByLabelText('サプティア | Suptia');
    expect(label.className).toContain('gap-1');

    rerender(<LogoWordmark size='lg' />);
    expect(label.className).toContain('gap-2');
  });
});
