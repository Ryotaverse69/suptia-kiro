import { cn, formatPrice, formatPercentage, getScoreBadgeVariant, truncate } from '../utils';

describe('cn (className utility)', () => {
  it('複数のクラス名を結合する', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('条件付きクラス名を処理する', () => {
    const result = cn('base', true && 'conditional', false && 'hidden');
    expect(result).toBe('base conditional');
  });

  it('Tailwindの競合するクラスを解決する', () => {
    const result = cn('p-4', 'p-6');
    expect(result).toBe('p-6');
  });

  it('undefinedやnullを無視する', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });
});

describe('formatPrice', () => {
  it('日本円をデフォルトでフォーマットする', () => {
    const result = formatPrice(1000);
    expect(result).toBe('￥1,000');
  });

  it('米ドルをフォーマットする', () => {
    const result = formatPrice(1000, 'USD', 'en-US');
    expect(result).toBe('$1,000');
  });

  it('小数点以下を含まない価格をフォーマットする', () => {
    const result = formatPrice(1234.56);
    expect(result).toBe('￥1,235'); // 四捨五入される
  });

  it('0円をフォーマットする', () => {
    const result = formatPrice(0);
    expect(result).toBe('￥0');
  });
});

describe('formatPercentage', () => {
  it('デフォルトで小数点1桁でフォーマットする', () => {
    const result = formatPercentage(85.67);
    expect(result).toBe('85.7%');
  });

  it('小数点桁数を指定してフォーマットする', () => {
    const result = formatPercentage(85.67, 2);
    expect(result).toBe('85.67%');
  });

  it('整数をフォーマットする', () => {
    const result = formatPercentage(100, 0);
    expect(result).toBe('100%');
  });

  it('0%をフォーマットする', () => {
    const result = formatPercentage(0);
    expect(result).toBe('0.0%');
  });
});

describe('getScoreBadgeVariant', () => {
  it('80以上のスコアでhighを返す', () => {
    expect(getScoreBadgeVariant(80)).toBe('high');
    expect(getScoreBadgeVariant(90)).toBe('high');
    expect(getScoreBadgeVariant(100)).toBe('high');
  });

  it('60以上80未満のスコアでmediumを返す', () => {
    expect(getScoreBadgeVariant(60)).toBe('medium');
    expect(getScoreBadgeVariant(70)).toBe('medium');
    expect(getScoreBadgeVariant(79)).toBe('medium');
  });

  it('60未満のスコアでlowを返す', () => {
    expect(getScoreBadgeVariant(0)).toBe('low');
    expect(getScoreBadgeVariant(30)).toBe('low');
    expect(getScoreBadgeVariant(59)).toBe('low');
  });

  it('境界値を正しく処理する', () => {
    expect(getScoreBadgeVariant(79.9)).toBe('medium');
    expect(getScoreBadgeVariant(80.0)).toBe('high');
    expect(getScoreBadgeVariant(59.9)).toBe('low');
    expect(getScoreBadgeVariant(60.0)).toBe('medium');
  });
});

describe('truncate', () => {
  it('指定した長さより短い文字列をそのまま返す', () => {
    const result = truncate('短いテキスト', 20);
    expect(result).toBe('短いテキスト');
  });

  it('指定した長さより長い文字列を切り詰める', () => {
    const result = truncate('これは非常に長いテキストです', 10);
    expect(result).toBe('これは非常に長いテキ...');
  });

  it('指定した長さと同じ文字列をそのまま返す', () => {
    const result = truncate('ちょうど10文字です', 10);
    expect(result).toBe('ちょうど10文字です');
  });

  it('空文字列を正しく処理する', () => {
    const result = truncate('', 10);
    expect(result).toBe('');
  });

  it('長さ0を指定した場合', () => {
    const result = truncate('テキスト', 0);
    expect(result).toBe('...');
  });
});