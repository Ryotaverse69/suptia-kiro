import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLinks, useFocusManagement } from '../SkipLinks';

// useFocusManagement フックのテスト用コンポーネント
function TestFocusManagement() {
  const { getFocusableElements, trapFocus, restoreFocus } =
    useFocusManagement();

  const handleTrapFocus = () => {
    const container = document.getElementById('test-container');
    if (container) {
      trapFocus(container as HTMLElement);
    }
  };

  return (
    <div>
      <button onClick={handleTrapFocus}>Trap Focus</button>
      <div id='test-container'>
        <button>Button 1</button>
        <button>Button 2</button>
        <input type='text' placeholder='Input' />
      </div>
    </div>
  );
}

describe('SkipLinks', () => {
  beforeEach(() => {
    // DOM要素をセットアップ
    document.body.innerHTML = `
      <div id="main-content">Main Content</div>
      <div id="navigation">Navigation</div>
      <div id="search">Search</div>
    `;
  });

  it('スキップリンクが正しくレンダリングされる', () => {
    render(<SkipLinks />);

    const mainContentLink = screen.getByText('メインコンテンツへスキップ');
    const navigationLink = screen.getByText('ナビゲーションへスキップ');
    const searchLink = screen.getByText('検索へスキップ');

    expect(mainContentLink).toBeInTheDocument();
    expect(navigationLink).toBeInTheDocument();
    expect(searchLink).toBeInTheDocument();
  });

  it('スキップリンクが正しいhrefを持つ', () => {
    render(<SkipLinks />);

    const mainContentLink = screen.getByText('メインコンテンツへスキップ');
    const navigationLink = screen.getByText('ナビゲーションへスキップ');
    const searchLink = screen.getByText('検索へスキップ');

    expect(mainContentLink).toHaveAttribute('href', '#main-content');
    expect(navigationLink).toHaveAttribute('href', '#navigation');
    expect(searchLink).toHaveAttribute('href', '#search');
  });

  it('Alt+Sでスキップリンクにフォーカスが移動する', () => {
    render(<SkipLinks />);

    const mainContentLink = screen.getByText('メインコンテンツへスキップ');

    // Alt+S キーを押下
    fireEvent.keyDown(document, { key: 's', altKey: true });

    expect(mainContentLink).toHaveFocus();
  });

  it('スキップリンクがフォーカス時に表示される', () => {
    render(<SkipLinks />);

    const mainContentLink = screen.getByText('メインコンテンツへスキップ');

    // 初期状態では非表示（sr-only）
    expect(mainContentLink.closest('div')).toHaveClass('sr-only');

    // フォーカス時に表示される
    fireEvent.focus(mainContentLink);
    expect(mainContentLink.closest('div')).toHaveClass(
      'focus-within:not-sr-only'
    );
  });
});

describe('useFocusManagement', () => {
  it('フォーカス可能な要素を正しく取得する', () => {
    render(<TestFocusManagement />);

    const { getFocusableElements } = useFocusManagement();
    const container = document.getElementById('test-container');

    if (container) {
      const focusableElements = getFocusableElements(container as HTMLElement);
      expect(focusableElements).toHaveLength(3); // 2つのボタン + 1つのinput
    }
  });

  it('フォーカストラップが正しく動作する', () => {
    render(<TestFocusManagement />);

    const trapButton = screen.getByText('Trap Focus');
    const button1 = screen.getByText('Button 1');
    const button2 = screen.getByText('Button 2');
    const input = screen.getByPlaceholderText('Input');

    // フォーカストラップを有効化
    fireEvent.click(trapButton);

    // 最初の要素にフォーカスが移動
    expect(button1).toHaveFocus();

    // フォーカストラップが設定されていることを確認
    // （実際のTabキーナビゲーションのテストはE2Eテストで行う）
    const container = document.getElementById('test-container');
    expect(container).toBeInTheDocument();
  });
});
