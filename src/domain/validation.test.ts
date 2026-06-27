import { describe, expect, it } from 'vitest';
import { validateKidText } from './validation';

describe('validateKidText', () => {
  it('requires a non-empty name', () => {
    expect(validateKidText('   ')).toBe('なまえを いれてね');
  });

  it('allows kanji, english, katakana, hiragana, numbers, and emoji', () => {
    expect(validateKidText('漢字ABCカタカナひらがな123⭐')).toBeUndefined();
  });

  it('keeps the length limit', () => {
    expect(validateKidText('あ'.repeat(29))).toBe('もうすこし みじかくしてね');
  });
});
