import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WarningBanner } from '../WarningBanner';

describe('WarningBanner', () => {
  const violations = [
    { originalText: '完治', suggestedText: '改善が期待される', pattern: '完治' },
  ];

  it('renders with role status and dismisses on click', () => {
    const onDismiss = vi.fn();
    render(<WarningBanner violations={violations} onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: '警告を閉じる' });
    fireEvent.click(btn);
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

