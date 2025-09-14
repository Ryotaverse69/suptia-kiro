import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../Card';

describe('Card', () => {
  it('デフォルトのカードが正しくレンダリングされる', () => {
    render(
      <Card data-testid='test-card'>
        <CardContent>テストコンテンツ</CardContent>
      </Card>
    );

    const card = screen.getByTestId('test-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('shadow-soft');
  });

  it('エレベーテッドバリアントが正しく適用される', () => {
    render(
      <Card variant='elevated' data-testid='elevated-card'>
        <CardContent>エレベーテッドカード</CardContent>
      </Card>
    );

    const card = screen.getByTestId('elevated-card');
    expect(card).toHaveClass('shadow-medium');
  });

  it('ホバー効果が正しく適用される', () => {
    render(
      <Card hover='scale' data-testid='hover-card'>
        <CardContent>ホバーカード</CardContent>
      </Card>
    );

    const card = screen.getByTestId('hover-card');
    expect(card).toHaveClass('hover:scale-[1.02]');
  });

  it('CardHeaderとCardTitleが正しくレンダリングされる', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>テストタイトル</CardTitle>
          <CardDescription>テスト説明</CardDescription>
        </CardHeader>
      </Card>
    );

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByText('テスト説明')).toBeInTheDocument();
  });
});
