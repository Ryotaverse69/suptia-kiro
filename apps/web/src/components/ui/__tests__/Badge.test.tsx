import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
    it('デフォルトのinfoバッジをレンダリングする', () => {
        render(<Badge>デフォルトバッジ</Badge>);
        const badge = screen.getByText('デフォルトバッジ');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });

    it('highバリアントを正しく適用する', () => {
        render(<Badge variant="high">高スコア</Badge>);
        const badge = screen.getByText('高スコア');
        expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('mediumバリアントを正しく適用する', () => {
        render(<Badge variant="medium">中スコア</Badge>);
        const badge = screen.getByText('中スコア');
        expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('lowバリアントを正しく適用する', () => {
        render(<Badge variant="low">低スコア</Badge>);
        const badge = screen.getByText('低スコア');
        expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('dangerバリアントを正しく適用する', () => {
        render(<Badge variant="danger">危険</Badge>);
        const badge = screen.getByText('危険');
        expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('successバリアントを正しく適用する', () => {
        render(<Badge variant="success">成功</Badge>);
        const badge = screen.getByText('成功');
        expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('小さいサイズを正しく適用する', () => {
        render(<Badge size="sm">小バッジ</Badge>);
        const badge = screen.getByText('小バッジ');
        expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('中サイズを正しく適用する', () => {
        render(<Badge size="md">中バッジ</Badge>);
        const badge = screen.getByText('中バッジ');
        expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('大きいサイズを正しく適用する', () => {
        render(<Badge size="lg">大バッジ</Badge>);
        const badge = screen.getByText('大バッジ');
        expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('カスタムクラス名を適用する', () => {
        render(<Badge className="custom-badge">カスタムバッジ</Badge>);
        const badge = screen.getByText('カスタムバッジ');
        expect(badge).toHaveClass('custom-badge');
    });

    it('基本的なスタイルを常に適用する', () => {
        render(<Badge>基本バッジ</Badge>);
        const badge = screen.getByText('基本バッジ');
        expect(badge).toHaveClass(
            'inline-flex',
            'items-center',
            'font-medium',
            'rounded-full',
            'border'
        );
    });

    it('HTMLプロパティを正しく渡す', () => {
        render(<Badge data-testid="test-badge" title="テストタイトル">テストバッジ</Badge>);
        const badge = screen.getByTestId('test-badge');
        expect(badge).toHaveAttribute('title', 'テストタイトル');
    });
});