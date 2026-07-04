import type { Env } from './types';

// ADMIN_ALLOWED_ORIGIN is "*" or a comma-separated allowlist of origins. Pick the
// first configured origin as a static default (overridden per-request by
// applyCors, which echoes the caller's Origin when it's on the allowlist).
function firstOrigin(env: Env): string {
  const raw = (env.ADMIN_ALLOWED_ORIGIN || '*').trim();
  if (raw === '*') return '*';
  return raw.split(',')[0].trim() || '*';
}

export function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': firstOrigin(env),
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

// Resolve the Access-Control-Allow-Origin for a specific request: "*" passes
// through; otherwise echo the request's Origin if it's on the allowlist, so
// multiple origins (e.g. the prod UI + a localhost dev server) all work. A
// non-allowed origin gets the first configured one, which the browser blocks.
export function resolveAllowedOrigin(request: Request, env: Env): string {
  const raw = (env.ADMIN_ALLOWED_ORIGIN || '*').trim();
  if (raw === '*') return '*';
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes('*')) return '*';
  const origin = request.headers.get('Origin') || '';
  return origin && list.includes(origin) ? origin : list[0] || '*';
}

// Override a response's Allow-Origin with the per-request value. Applied at the
// /admin/* boundary so the inner handlers don't need to thread the request.
export function applyCors(res: Response, request: Request, env: Env): Response {
  res.headers.set('Access-Control-Allow-Origin', resolveAllowedOrigin(request, env));
  res.headers.set('Vary', 'Origin');
  return res;
}

export function json(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonCors(status: number, obj: unknown, env: Env): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}
