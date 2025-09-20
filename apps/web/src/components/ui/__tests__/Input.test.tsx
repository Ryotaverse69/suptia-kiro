import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with placeholder and hint', () => {
    render(<Input placeholder='検索キーワード' hint='ヒントテキスト' />);

    const input = screen.getByPlaceholderText('検索キーワード');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('ヒントテキスト')).toBeInTheDocument();
  });

  it('supports leading and trailing icons', () => {
    render(
      <Input
        placeholder='アイコン付き'
        leadingIcon={<span data-testid='leading' />}
        trailingIcon={<span data-testid='trailing' />}
      />
    );

    expect(screen.getByTestId('leading')).toBeInTheDocument();
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });

  it('marks invalid state with aria attributes', () => {
    render(
      <Input placeholder='メールアドレス' isInvalid hint='必須項目です' />
    );

    const input = screen.getByPlaceholderText('メールアドレス');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('必須項目です')).toBeInTheDocument();
  });
});
