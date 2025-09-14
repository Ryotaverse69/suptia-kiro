import { render, screen } from '@testing-library/react';
import SectionHeader from '../SectionHeader';

describe('SectionHeader', () => {
  it('基本的なタイトルを表示する', () => {
    render(<SectionHeader title='人気サプリ比較' />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '人気サプリ比較'
    );
  });

  it('サブタイトルと説明文を表示する', () => {
    render(
      <SectionHeader
        title='人気サプリ比較'
        subtitle='Popular Comparisons'
        description='AIが厳選した、最も人気の高いサプリメントを比較'
      />
    );

    expect(screen.getByText('Popular Comparisons')).toBeInTheDocument();
    expect(
      screen.getByText('AIが厳選した、最も人気の高いサプリメントを比較')
    ).toBeInTheDocument();
  });

  it('左寄せのアライメントが適用される', () => {
    render(<SectionHeader title='人気サプリ比較' align='left' />);

    const container = screen.getByRole('heading', { level: 2 }).parentElement;
    expect(container).toHaveClass('text-left');
  });

  it('右寄せのアライメントが適用される', () => {
    render(<SectionHeader title='人気サプリ比較' align='right' />);

    const container = screen.getByRole('heading', { level: 2 }).parentElement;
    expect(container).toHaveClass('text-right');
  });

  it('中央寄せがデフォルトで適用される', () => {
    render(<SectionHeader title='人気サプリ比較' />);

    const container = screen.getByRole('heading', { level: 2 }).parentElement;
    expect(container).toHaveClass('text-center');
  });

  it('小さいサイズのスタイルが適用される', () => {
    render(<SectionHeader title='人気サプリ比較' size='sm' />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-2xl', 'md:text-3xl');
  });

  it('大きいサイズのスタイルが適用される', () => {
    render(<SectionHeader title='人気サプリ比較' size='xl' />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-5xl', 'md:text-6xl');
  });

  it('カスタムクラス名が適用される', () => {
    render(<SectionHeader title='人気サプリ比較' className='custom-class' />);

    const container = screen.getByRole('heading', { level: 2 }).parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('子要素を表示する', () => {
    render(
      <SectionHeader title='人気サプリ比較'>
        <button>もっと見る</button>
      </SectionHeader>
    );

    expect(
      screen.getByRole('button', { name: 'もっと見る' })
    ).toBeInTheDocument();
  });

  it('Apple風のタイポグラフィクラスが適用される', () => {
    render(<SectionHeader title='人気サプリ比較' />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('font-light');
    expect(heading).toHaveClass('text-gray-900');
    expect(heading).toHaveClass('tracking-tight');
  });

  it('サブタイトルにプライマリカラーが適用される', () => {
    render(
      <SectionHeader title='人気サプリ比較' subtitle='Popular Comparisons' />
    );

    const subtitle = screen.getByText('Popular Comparisons');
    expect(subtitle).toHaveClass('text-primary-600');
  });

  it('説明文が中央寄せの場合にmx-autoが適用される', () => {
    render(
      <SectionHeader
        title='人気サプリ比較'
        description='AIが厳選した、最も人気の高いサプリメントを比較'
        align='center'
      />
    );

    const description = screen.getByText(
      'AIが厳選した、最も人気の高いサプリメントを比較'
    );
    expect(description).toHaveClass('mx-auto');
  });

  it('説明文が右寄せの場合にml-autoが適用される', () => {
    render(
      <SectionHeader
        title='人気サプリ比較'
        description='AIが厳選した、最も人気の高いサプリメントを比較'
        align='right'
      />
    );

    const description = screen.getByText(
      'AIが厳選した、最も人気の高いサプリメントを比較'
    );
    expect(description).toHaveClass('ml-auto');
  });
});
