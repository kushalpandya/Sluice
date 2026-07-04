import type { Env } from './types';

export function checkAdmin(request: Request, env: Env): boolean {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return !!env.ADMIN_KEY && timingSafeEqual(token, env.ADMIN_KEY);
}

/** Constant-time compare. Leaks length (fine here), not content. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Daily-cap helper: count reports created since `sinceMs` (optionally per installation). */
export async function countSince(env: Env, sinceMs: number, installationId?: string): Promise<number> {
  const stmt = installationId
    ? env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE created >= ?1 AND installation_id = ?2').bind(sinceMs, installationId)
    : env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE created >= ?1').bind(sinceMs);
  const row = await stmt.first<{ n: number }>();
  return row?.n ?? 0;
}

export function startOfUtcDayMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
