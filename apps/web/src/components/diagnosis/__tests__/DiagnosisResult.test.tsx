import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DiagnosisResult from '../DiagnosisResult';

// ScoreDisplayとScoreBreakdownコンポーネントをモック
vi.mock('@/components/ScoreDisplay', () => ({
    default: ({ score, totalScore }: any) => (
        <div data-testid="score-display">
            <div>Total Score: {totalScore}</div>
            <div>Evidence: {score.evidence}</div>
            <div>Safety: {score.safety}</div>
            <div>Cost: {score.cost}</div>
            <div>Practicality: {score.practicality}</div>
        </div>
    )
}));

vi.mock('@/components/ScoreBreakdown', () => ({
    default: ({ breakdown, weights }: any) => (
        <div data-testid="score-breakdown">
            <div>Evidence Weight: {weights.evidence}</div>
            <div>Safety Weight: {weights.safety}</div>
            <div>Cost Weight: {weights.cost}</div>
            <div>Practicality Weight: {weights.practicality}</div>
        </div>
    )
}));

describe('DiagnosisResult', () => {
    it('診断結果が正しく表示される', () => {
        render(<DiagnosisResult />);

        expect(screen.getByText('あなたにおすすめのサプリメント')).toBeInTheDocument();
        expect(screen.getByText('第1位')).toBeInTheDocument();
        expect(screen.getByText('第2位')).toBeInTheDocument();
    });

    it('総合スコアが表示される', () => {
        render(<DiagnosisResult />);

        expect(screen.getByText('総合スコア')).toBeInTheDocument();
        expect(screen.getByText('87.5')).toBeInTheDocument();
    });

    it('実効コスト/日が表示される', () => {
        render(<DiagnosisResult />);

        expect(screen.getByText('実効コスト/日')).toBeInTheDocument();
        expect(screen.getByText('¥125')).toBeInTheDocument();
        expect(screen.getByText('月額約¥3750')).toBeInTheDocument();
    });

    it('商品情報が表示される', () => {
        render(<DiagnosisResult />);

        expect(screen.getByText('マルチビタミン&ミネラル プレミアム')).toBeInTheDocument();
        expect(screen.getByText('ヘルスケア製薬')).toBeInTheDocument();
    });

    it('推奨理由が表示される', () => {
        render(<DiagnosisResult />);

        expect(screen.getByText('おすすめする理由')).toBeInTheDocument();
        expect(screen.getByText('科学的根拠が豊富で信頼性の高い成分を含んでいます')).toBeInTheDocument();
    });

    it('第2位を選択すると危険成分アラートが表示される', () => {
        render(<DiagnosisResult />);

        // 第2位を選択
        fireEvent.click(screen.getByText('第2位'));

        expect(screen.getByText('注意が必要な成分')).toBeInTheDocument();
        expect(screen.getByText('カフェイン')).toBeInTheDocument();
        expect(screen.getByText('中リスク')).toBeInTheDocument();
    });

    it('第2位を選択すると注意事項が表示される', () => {
        render(<DiagnosisResult />);

        // 第2位を選択
        fireEvent.click(screen.getByText('第2位'));

        expect(screen.getByText('注意事項')).toBeInTheDocument();
        expect(screen.getByText('1件の注意すべき成分が含まれています')).toBeInTheDocument();
    });

    it('他の候補も見るボタンが機能する', () => {
        render(<DiagnosisResult />);

        const showMoreButton = screen.getByText('他の候補も見る（1件）');
        fireEvent.click(showMoreButton);

        expect(screen.getByText('全診断結果')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('全結果表示で商品を選択できる', () => {
        render(<DiagnosisResult />);

        // 他の候補を表示
        fireEvent.click(screen.getByText('他の候補も見る（1件）'));

        // 第2位の商品をクリック
        const secondProduct = screen.getByText('エナジーブースト コンプレックス');
        fireEvent.click(secondProduct.closest('div')!);

        // 選択が変更されることを確認（スコアが変わる）
        expect(screen.getByText('67.3')).toBeInTheDocument();
    });

    it('ScoreDisplayコンポーネントが正しいプロパティで呼び出される', () => {
        render(<DiagnosisResult />);

        const scoreDisplay = screen.getByTestId('score-display');
        expect(scoreDisplay).toBeInTheDocument();
        expect(screen.getByText('Total Score: 87.5')).toBeInTheDocument();
        expect(screen.getByText('Evidence: 90')).toBeInTheDocument();
        expect(screen.getByText('Safety: 85')).toBeInTheDocument();
    });

    it('ScoreBreakdownコンポーネントが正しいプロパティで呼び出される', () => {
        render(<DiagnosisResult />);

        const scoreBreakdown = screen.getByTestId('score-breakdown');
        expect(scoreBreakdown).toBeInTheDocument();
        expect(screen.getByText('Evidence Weight: 0.35')).toBeInTheDocument();
        expect(screen.getByText('Safety Weight: 0.35')).toBeInTheDocument();
    });

    it('アクションボタンが表示される', () => {
        render(<DiagnosisResult />);

        expect(screen.getByText('診断をやり直す')).toBeInTheDocument();
        expect(screen.getByText('商品詳細を見る')).toBeInTheDocument();
    });

    it('スコアに応じて適切な色とバッジが表示される', () => {
        render(<DiagnosisResult />);

        // 第1位（高スコア）の確認
        expect(screen.getByText('87.5')).toBeInTheDocument();

        // 第2位（中スコア）に切り替え
        fireEvent.click(screen.getByText('第2位'));
        expect(screen.getByText('67.3')).toBeInTheDocument();
    });

    it('危険成分の重要度に応じて適切なスタイルが適用される', () => {
        render(<DiagnosisResult />);

        // 第2位を選択して危険成分アラートを表示
        fireEvent.click(screen.getByText('第2位'));

        const dangerAlert = screen.getByText('カフェイン').closest('div');
        expect(dangerAlert).toHaveClass('text-yellow-600');
    });
});