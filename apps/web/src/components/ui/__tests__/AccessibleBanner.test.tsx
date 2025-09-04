import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccessibleBanner } from '../AccessibleBanner';

describe('AccessibleBanner', () => {
  it('renders with role status and title', () => {
    render(<AccessibleBanner status="warning" title="注意">内容</AccessibleBanner>);
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain('注意');
    expect(banner.textContent).toContain('内容');
  });
});

