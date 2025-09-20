import { render, screen } from '@testing-library/react';
import { Badge, EvidenceBadge, ScoreBadge } from '../Badge';

describe('Badge', () => {
  it('デフォルトのバッジが正しくレンダリングされる', () => {
    render(<Badge>テストバッジ</Badge>);

    const badge = screen.getByText('テストバッジ');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-background-surface');
  });

  it('プライマリバリアントが正しく適用される', () => {
    render(<Badge variant='primary'>プライマリバッジ</Badge>);

    const badge = screen.getByText('プライマリバッジ');
    expect(badge).toHaveClass('bg-primary-50');
  });

  it('成功バリアントが正しく適用される', () => {
    render(<Badge variant='success'>成功バッジ</Badge>);

    const badge = screen.getByText('成功バッジ');
    expect(badge).toHaveClass('bg-emerald-500');
  });
});

describe('EvidenceBadge', () => {
  it('エビデンスAバッジが正しくレンダリングされる', () => {
    render(<EvidenceBadge level='A' />);

    const badge = screen.getByText('エビデンス A');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gradient-to-r');
    expect(badge).toHaveClass('from-emerald-500');
  });

  it('エビデンスBバッジが正しくレンダリングされる', () => {
    render(<EvidenceBadge level='B' />);

    const badge = screen.getByText('エビデンス B');
    expect(badge).toHaveClass('from-amber-500');
  });

  it('エビデンスCバッジが正しくレンダリングされる', () => {
    render(<EvidenceBadge level='C' />);

    const badge = screen.getByText('エビデンス C');
    expect(badge).toHaveClass('from-rose-500');
  });
});

describe('ScoreBadge', () => {
  it('高スコア（80以上）で成功バリアントが適用される', () => {
    render(<ScoreBadge score={85} />);

    const badge = screen.getByText('スコア 85');
    expect(badge).toHaveClass('bg-emerald-500');
  });

  it('中スコア（60-79）で警告バリアントが適用される', () => {
    render(<ScoreBadge score={70} />);

    const badge = screen.getByText('スコア 70');
    expect(badge).toHaveClass('bg-amber-500');
  });

  it('低スコア（60未満）でエラーバリアントが適用される', () => {
    render(<ScoreBadge score={45} />);

    const badge = screen.getByText('スコア 45');
    expect(badge).toHaveClass('bg-rose-500');
  });
});
