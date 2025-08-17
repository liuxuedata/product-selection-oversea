export function pickNumber(row: Record<string, any>, keys: string[], fallback = 0): number {
  for (const k of keys) {
    const v = row?.[k];
    if (v === undefined || v === null || String(v).trim() === '') continue;
    const n = Number(String(v).replace(/[^\d.\-]/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

export function pickString(row: Record<string, any>, keys: string[], fallback = ''): string {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return fallback;
}
