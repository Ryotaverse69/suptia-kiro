import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('デフォルトのプライマリボタンが正しくレンダリングされる', () => {
    render(<Button>テストボタン</Button>);

    const button = screen.getByRole('button', { name: 'テストボタン' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary-600');
  });

  it('セカンダリバリアントが正しく適用される', () => {
    render(<Button variant='secondary'>セカンダリボタン</Button>);

    const button = screen.getByRole('button', { name: 'セカンダリボタン' });
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-border/60');
  });

  it('サイズバリアントが正しく適用される', () => {
    render(<Button size='lg'>大きなボタン</Button>);

    const button = screen.getByRole('button', { name: '大きなボタン' });
    expect(button).toHaveClass('h-12');
  });

  it('ホバー効果が正しく適用される', () => {
    render(<Button hover='scale'>スケールボタン</Button>);

    const button = screen.getByRole('button', { name: 'スケールボタン' });
    expect(button).toHaveClass('hover:scale-[1.02]');
  });

  it('disabled状態が正しく適用される', () => {
    render(<Button disabled>無効ボタン</Button>);

    const button = screen.getByRole('button', { name: '無効ボタン' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });
});
