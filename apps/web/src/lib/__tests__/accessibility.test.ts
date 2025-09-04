import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusManager, AriaManager, KeyboardNavigation, ColorContrast, ScreenReaderText } from '../accessibility';

// DOM環境のセットアップ
beforeEach(() => {
  document.body.innerHTML = '';
});

describe('FocusManager', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <a href="#" id="link1">Link 1</a>
        <button id="btn2" disabled>Disabled Button</button>
        <div tabindex="0" id="div1">Focusable Div</div>
      </div>
    `;
  });

  describe('getFocusableElements', () => {
    it('should return all focusable elements', () => {
      const container = document.getElementById('container')!;
      const focusableElements = FocusManager.getFocusableElements(container);
      
      expect(focusableElements).toHaveLength(4); // btn1, input1, link1, div1 (btn2 is disabled)
      expect(focusableElements[0].id).toBe('btn1');
      expect(focusableElements[1].id).toBe('input1');
      expect(focusableElements[2].id).toBe('link1');
      expect(focusableElements[3].id).toBe('div1');
    });
  });

  describe('getFirstFocusableElement', () => {
    it('should return the first focusable element', () => {
      const container = document.getElementById('container')!;
      const firstElement = FocusManager.getFirstFocusableElement(container);
      
      expect(firstElement?.id).toBe('btn1');
    });

    it('should return null if no focusable elements exist', () => {
      const container = document.createElement('div');
      const firstElement = FocusManager.getFirstFocusableElement(container);
      
      expect(firstElement).toBeNull();
    });
  });

  describe('getLastFocusableElement', () => {
    it('should return the last focusable element', () => {
      const container = document.getElementById('container')!;
      const lastElement = FocusManager.getLastFocusableElement(container);
      
      expect(lastElement?.id).toBe('div1');
    });
  });

  describe('trapFocus', () => {
    it('should move focus to last element when Tab is pressed on last element', () => {
      const container = document.getElementById('container')!;
      const lastElement = document.getElementById('div1')!;
      const firstElement = document.getElementById('btn1')!;
      
      lastElement.focus();
      
      const mockFocus = vi.fn();
      firstElement.focus = mockFocus;
      
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      FocusManager.trapFocus(container, event);
      
      expect(preventDefault).toHaveBeenCalled();
      expect(mockFocus).toHaveBeenCalled();
    });

    it('should move focus to first element when Shift+Tab is pressed on first element', () => {
      const container = document.getElementById('container')!;
      const firstElement = document.getElementById('btn1')!;
      const lastElement = document.getElementById('div1')!;
      
      firstElement.focus();
      
      const mockFocus = vi.fn();
      lastElement.focus = mockFocus;
      
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      FocusManager.trapFocus(container, event);
      
      expect(preventDefault).toHaveBeenCalled();
      expect(mockFocus).toHaveBeenCalled();
    });
  });
});

describe('AriaManager', () => {
  describe('setAttributes', () => {
    it('should set ARIA attributes on element', () => {
      const element = document.createElement('div');
      
      AriaManager.setAttributes(element, {
        'aria-expanded': 'true',
        'aria-controls': 'menu',
        'aria-hidden': null, // should remove attribute
      });
      
      expect(element.getAttribute('aria-expanded')).toBe('true');
      expect(element.getAttribute('aria-controls')).toBe('menu');
      expect(element.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  describe('announce', () => {
    it('should create and remove live region for announcement', () => {
      const message = 'Test announcement';
      
      AriaManager.announce(message, 'polite');
      
      const announcer = document.querySelector('[aria-live="polite"]');
      expect(announcer).toBeTruthy();
      expect(announcer?.textContent).toBe(message);
      expect(announcer?.className).toBe('sr-only');
    });
  });

  describe('setExpandedState', () => {
    it('should set expanded state correctly', () => {
      const trigger = document.createElement('button');
      const target = document.createElement('div');
      
      AriaManager.setExpandedState(trigger, target, true);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(target.getAttribute('aria-hidden')).toBe('false');
      expect(target.hasAttribute('hidden')).toBe(false);
      
      AriaManager.setExpandedState(trigger, target, false);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(target.getAttribute('aria-hidden')).toBe('true');
      expect(target.hasAttribute('hidden')).toBe(true);
    });
  });
});

describe('KeyboardNavigation', () => {
  let items: HTMLElement[];
  let mockOnIndexChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="item1" tabindex="0">Item 1</div>
      <div id="item2" tabindex="0">Item 2</div>
      <div id="item3" tabindex="0">Item 3</div>
    `;
    
    items = [
      document.getElementById('item1')!,
      document.getElementById('item2')!,
      document.getElementById('item3')!,
    ];
    
    mockOnIndexChange = vi.fn();
    
    // Mock focus method
    items.forEach(item => {
      item.focus = vi.fn();
    });
  });

  describe('handleArrowNavigation', () => {
    it('should navigate down with ArrowDown key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        0,
        { onIndexChange: mockOnIndexChange }
      );
      
      expect(preventDefault).toHaveBeenCalled();
      expect(newIndex).toBe(1);
      expect(items[1].focus).toHaveBeenCalled();
      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should navigate up with ArrowUp key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        1,
        { onIndexChange: mockOnIndexChange }
      );
      
      expect(preventDefault).toHaveBeenCalled();
      expect(newIndex).toBe(0);
      expect(items[0].focus).toHaveBeenCalled();
      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
    });

    it('should loop to end when ArrowUp is pressed on first item', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        0,
        { loop: true, onIndexChange: mockOnIndexChange }
      );
      
      expect(newIndex).toBe(2);
      expect(items[2].focus).toHaveBeenCalled();
    });

    it('should not loop when loop is disabled', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        0,
        { loop: false, onIndexChange: mockOnIndexChange }
      );
      
      expect(newIndex).toBe(0);
      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });

    it('should navigate to first item with Home key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        2,
        { onIndexChange: mockOnIndexChange }
      );
      
      expect(preventDefault).toHaveBeenCalled();
      expect(newIndex).toBe(0);
      expect(items[0].focus).toHaveBeenCalled();
    });

    it('should navigate to last item with End key', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        0,
        { onIndexChange: mockOnIndexChange }
      );
      
      expect(preventDefault).toHaveBeenCalled();
      expect(newIndex).toBe(2);
      expect(items[2].focus).toHaveBeenCalled();
    });
  });

  describe('handleEscapeKey', () => {
    it('should call onEscape when Escape key is pressed', () => {
      const mockOnEscape = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      KeyboardNavigation.handleEscapeKey(event, mockOnEscape);
      
      expect(preventDefault).toHaveBeenCalled();
      expect(mockOnEscape).toHaveBeenCalled();
    });

    it('should not call onEscape for other keys', () => {
      const mockOnEscape = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      
      KeyboardNavigation.handleEscapeKey(event, mockOnEscape);
      
      expect(mockOnEscape).not.toHaveBeenCalled();
    });
  });

  describe('handleActivationKeys', () => {
    it('should call onActivate when Enter key is pressed', () => {
      const mockOnActivate = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      KeyboardNavigation.handleActivationKeys(event, mockOnActivate);
      
      expect(preventDefault).toHaveBeenCalled();
      expect(mockOnActivate).toHaveBeenCalled();
    });

    it('should call onActivate when Space key is pressed', () => {
      const mockOnActivate = vi.fn();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefault = vi.fn();
      event.preventDefault = preventDefault;
      
      KeyboardNavigation.handleActivationKeys(event, mockOnActivate);
      
      expect(preventDefault).toHaveBeenCalled();
      expect(mockOnActivate).toHaveBeenCalled();
    });
  });
});

describe('ColorContrast', () => {
  describe('getContrastRatio', () => {
    it('should calculate contrast ratio correctly', () => {
      // Black on white should have high contrast
      const blackOnWhite = ColorContrast.getContrastRatio('#000000', '#ffffff');
      expect(blackOnWhite).toBeCloseTo(21, 0);
      
      // Same colors should have ratio of 1
      const sameColor = ColorContrast.getContrastRatio('#ff0000', '#ff0000');
      expect(sameColor).toBe(1);
    });
  });

  describe('isWCAGAACompliant', () => {
    it('should return true for high contrast combinations', () => {
      const result = ColorContrast.isWCAGAACompliant('#000000', '#ffffff');
      expect(result).toBe(true);
    });

    it('should return false for low contrast combinations', () => {
      const result = ColorContrast.isWCAGAACompliant('#cccccc', '#ffffff');
      expect(result).toBe(false);
    });

    it('should have different thresholds for large text', () => {
      // Test with a color that has contrast ratio between 3 and 4.5
      // #949494 on white has approximately 3.5:1 contrast ratio
      const normalText = ColorContrast.isWCAGAACompliant('#949494', '#ffffff', false);
      const largeText = ColorContrast.isWCAGAACompliant('#949494', '#ffffff', true);
      
      expect(normalText).toBe(false); // Should fail AA for normal text (needs 4.5:1)
      expect(largeText).toBe(true);   // Should pass AA for large text (needs 3:1)
    });
  });
});

describe('ScreenReaderText', () => {
  describe('formatNumber', () => {
    it('should format number for Japanese locale', () => {
      const result = ScreenReaderText.formatNumber(1234.56, 'ja');
      expect(result).toBe('1,234.56');
    });

    it('should format number for English locale', () => {
      const result = ScreenReaderText.formatNumber(1234.56, 'en');
      expect(result).toBe('1,234.56');
    });
  });

  describe('formatDate', () => {
    it('should format date for Japanese locale', () => {
      const date = new Date('2025-01-15');
      const result = ScreenReaderText.formatDate(date, 'ja');
      expect(result).toMatch(/2025年1月15日/);
    });

    it('should format date for English locale', () => {
      const date = new Date('2025-01-15');
      const result = ScreenReaderText.formatDate(date, 'en');
      expect(result).toMatch(/January 15, 2025/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage for Japanese locale', () => {
      const result = ScreenReaderText.formatPercentage(75, 'ja');
      expect(result).toBe('75パーセント');
    });

    it('should format percentage for English locale', () => {
      const result = ScreenReaderText.formatPercentage(75, 'en');
      expect(result).toBe('75 percent');
    });
  });

  describe('formatScore', () => {
    it('should format score for Japanese locale', () => {
      const result = ScreenReaderText.formatScore(85, 100, 'ja');
      expect(result).toBe('100点満点中85点');
    });

    it('should format score for English locale', () => {
      const result = ScreenReaderText.formatScore(85, 100, 'en');
      expect(result).toBe('85 out of 100 points');
    });
  });
});