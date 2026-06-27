export function validateKidText(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'なまえを いれてね';
  if (trimmed.length > 28) return 'もうすこし みじかくしてね';
  return undefined;
}

export function isKidText(value: string): boolean {
  return !validateKidText(value);
}
