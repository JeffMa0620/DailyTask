const forbiddenVisibleText = /[\u4e00-\u9fff\u30a0-\u30ffA-Za-z]/u;

export function validateKidText(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'なまえを いれてね';
  if (forbiddenVisibleText.test(trimmed)) return 'ひらがなで いれてね';
  if (trimmed.length > 28) return 'もうすこし みじかくしてね';
  return undefined;
}

export function isKidText(value: string): boolean {
  return !validateKidText(value);
}
