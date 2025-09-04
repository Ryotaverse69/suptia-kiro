import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';

describe('Card', () => {
    it('デフォルトのカードをレンダリングする', () => {
        render(
            <Card data-testid="test-card">
                <div>カードコンテンツ</div>
            </Card>
        );
        const card = screen.getByTestId('test-card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('bg-white', 'shadow-sm', 'border', 'border-gray-100');
    });

    it('elevatedバリアントを正しく適用する', () => {
        render(
            <Card variant="elevated" data-testid="elevated-card">
                <div>エレベートカード</div>
            </Card>
        );
        const card = screen.getByTestId('elevated-card');
        expect(card).toHaveClass('shadow-lg');
    });

    it('outlinedバリアントを正しく適用する', () => {
        render(
            <Card variant="outlined" data-testid="outlined-card">
                <div>アウトラインカード</div>
            </Card>
        );
        const card = screen.getByTestId('outlined-card');
        expect(card).toHaveClass('border-2', 'border-gray-200', 'shadow-none');
    });

    it('ホバー効果を正しく適用する', () => {
        render(
            <Card hover data-testid="hover-card">
                <div>ホバーカード</div>
            </Card>
        );
        const card = screen.getByTestId('hover-card');
        expect(card).toHaveClass('hover:shadow-lg', 'hover:scale-105', 'cursor-pointer');
    });

    it('カスタムクラス名を適用する', () => {
        render(
            <Card className="custom-card" data-testid="custom-card">
                <div>カスタムカード</div>
            </Card>
        );
        const card = screen.getByTestId('custom-card');
        expect(card).toHaveClass('custom-card');
    });
});

describe('CardHeader', () => {
    it('カードヘッダーをレンダリングする', () => {
        render(
            <CardHeader data-testid="card-header">
                <h2>ヘッダータイトル</h2>
            </CardHeader>
        );
        const header = screen.getByTestId('card-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('p-6', 'pb-4');
    });
});

describe('CardContent', () => {
    it('カードコンテンツをレンダリングする', () => {
        render(
            <CardContent data-testid="card-content">
                <p>コンテンツテキスト</p>
            </CardContent>
        );
        const content = screen.getByTestId('card-content');
        expect(content).toBeInTheDocument();
        expect(content).toHaveClass('p-6', 'pt-0');
    });
});

describe('CardFooter', () => {
    it('カードフッターをレンダリングする', () => {
        render(
            <CardFooter data-testid="card-footer">
                <button>アクションボタン</button>
            </CardFooter>
        );
        const footer = screen.getByTestId('card-footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass('p-6', 'pt-4');
    });
});

describe('Card組み合わせ', () => {
    it('完全なカード構造をレンダリングする', () => {
        render(
            <Card data-testid="full-card">
                <CardHeader>
                    <h2>商品タイトル</h2>
                </CardHeader>
                <CardContent>
                    <p>商品説明</p>
                </CardContent>
                <CardFooter>
                    <button>詳細を見る</button>
                </CardFooter>
            </Card>
        );

        expect(screen.getByTestId('full-card')).toBeInTheDocument();
        expect(screen.getByText('商品タイトル')).toBeInTheDocument();
        expect(screen.getByText('商品説明')).toBeInTheDocument();
        expect(screen.getByText('詳細を見る')).toBeInTheDocument();
    });
});