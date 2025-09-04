import { render, screen, fireEvent } from '@testing-library/react';
import { PriceComparison } from '../PriceComparison';

describe('PriceComparison', () => {
    const mockProps = {
        productName: 'テスト商品',
        basePrice: 1000,
        servingsPerContainer: 30,
        servingsPerDay: 1,
    };

    it('価格比較テーブルが正しくレンダリングされる', () => {
        render(<PriceComparison {...mockProps} />);

        expect(screen.getByText('価格比較')).toBeInTheDocument();
        expect(screen.getByText('販売者')).toBeInTheDocument();
        expect(screen.getByText('商品価格')).toBeInTheDocument();
        expect(screen.getByText('送料')).toBeInTheDocument();
        expect(screen.getByText('総額')).toBeInTheDocument();
    });

    it('ソート機能が動作する', () => {
        render(<PriceComparison {...mockProps} />);

        const sortSelect = screen.getByDisplayValue('総額順');
        fireEvent.change(sortSelect, { target: { value: 'price' } });

        expect(screen.getByDisplayValue('商品価格順')).toBeInTheDocument();
    });

    it('販売者情報が表示される', () => {
        render(<PriceComparison {...mockProps} />);

        // デモデータの販売者が表示されることを確認
        expect(screen.getByText('Amazon')).toBeInTheDocument();
        expect(screen.getByText('楽天市場')).toBeInTheDocument();
    });

    it('価格情報が正しく表示される', () => {
        render(<PriceComparison {...mockProps} />);

        // 価格が表示されることを確認（具体的な値はランダムなので存在確認のみ）
        expect(screen.getAllByText(/¥/).length).toBeGreaterThan(0);
    });

    it('在庫状況が表示される', () => {
        render(<PriceComparison {...mockProps} />);

        // 在庫ありまたは在庫切れが表示されることを確認
        const stockElements = screen.getAllByText(/在庫/);
        expect(stockElements.length).toBeGreaterThan(0);
    });

    it('評価が表示される', () => {
        render(<PriceComparison {...mockProps} />);

        // 星マークが表示されることを確認
        expect(screen.getAllByText('★').length).toBeGreaterThan(0);
    });

    it('購入ボタンが表示される', () => {
        render(<PriceComparison {...mockProps} />);

        const purchaseButtons = screen.getAllByText(/購入|在庫切れ/);
        expect(purchaseButtons.length).toBeGreaterThan(0);
    });

    it('価格比較サマリーが表示される', () => {
        render(<PriceComparison {...mockProps} />);

        expect(screen.getByText('最安値')).toBeInTheDocument();
        expect(screen.getByText('平均価格')).toBeInTheDocument();
        expect(screen.getByText('価格差')).toBeInTheDocument();
    });

    it('注意事項が表示される', () => {
        render(<PriceComparison {...mockProps} />);

        expect(screen.getByText(/価格は変動する可能性があります/)).toBeInTheDocument();
    });

    it('カスタム販売者データが使用される', () => {
        const customSellers = [
            {
                name: 'カスタム販売者',
                price: 800,
                url: 'https://example.com',
                shipping: 0,
                inStock: true,
                rating: 4.5,
                reviewCount: 100
            }
        ];

        render(<PriceComparison {...mockProps} sellers={customSellers} />);

        expect(screen.getByText('カスタム販売者')).toBeInTheDocument();
        expect(screen.getByText('¥800')).toBeInTheDocument();
    });

    it('送料無料が正しく表示される', () => {
        const customSellers = [
            {
                name: 'テスト販売者',
                price: 1000,
                url: 'https://example.com',
                shipping: 0,
                inStock: true,
                rating: 4.0,
                reviewCount: 50
            }
        ];

        render(<PriceComparison {...mockProps} sellers={customSellers} />);

        expect(screen.getByText('無料')).toBeInTheDocument();
    });

    it('最安値マークが表示される', () => {
        render(<PriceComparison {...mockProps} />);

        // 総額順でソートされた場合、最初の行に最安値マークが表示される
        expect(screen.getByText('最安値')).toBeInTheDocument();
    });

    it('カスタムクラス名が適用される', () => {
        const { container } = render(
            <PriceComparison {...mockProps} className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });
});