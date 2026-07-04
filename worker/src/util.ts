// Generic, Env-free helpers.

export function strField(v: string | null): string {
  return typeof v === 'string' ? v : '';
}

export async function readMaybeFile(v: unknown): Promise<string> {
  if (typeof v === 'string') return v;
  if (isBlob(v)) return await v.text();
  return '';
}

export function isBlob(v: unknown): v is Blob {
  return typeof v === 'object' && v !== null && typeof (v as Blob).arrayBuffer === 'function';
}

export function intOr(v: string | null | undefined, fallback: number): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}
