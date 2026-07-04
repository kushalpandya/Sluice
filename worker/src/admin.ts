import type { Env, ReportRow, AttachmentRow } from './types';
import { jsonCors, corsHeaders } from './http';
import { checkAdmin } from './security';
import { intOr } from './util';
import { createIssue } from './github';
import { ALLOWED_STATUSES, SETTABLE_STATUSES, UUID_RE } from './constants';

// Admin API (triage-UI-facing).
export async function handleAdmin(request: Request, env: Env, url: URL): Promise<Response> {
  // Per-IP throttle on the whole admin surface (before auth, so it also bounds
  // brute-force attempts and generic hammering once this is public).
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await env.ADMIN_LIMITER.limit({ key: ip })).success) {
    return jsonCors(429, { ok: false, error: 'rate_limited' }, env);
  }
  if (!checkAdmin(request, env)) {
    return jsonCors(401, { ok: false, error: 'unauthorized' }, env);
  }

  // /admin/reports[/:id[/attachments/:attId | /promote | /status]]
  const parts = url.pathname.split('/').filter(Boolean); // ['admin','reports',...]
  if (parts[1] !== 'reports') {
    return jsonCors(404, { ok: false, error: 'not_found' }, env);
  }

  const id = parts[2];
  const action = parts[3];

  // List
  if (!id && request.method === 'GET') {
    return listReports(env, url);
  }

  // Bulk prune (not a per-id action).
  if (id === 'prune') {
    if (request.method === 'GET') return prunePreview(env, url);
    if (request.method === 'POST') return pruneReports(request, env);
    return jsonCors(405, { ok: false, error: 'method_not_allowed' }, env);
  }

  if (!id || !UUID_RE.test(id)) {
    return jsonCors(400, { ok: false, error: 'bad_id' }, env);
  }

  if (!action && request.method === 'GET') return getReport(env, id);
  if (!action && request.method === 'DELETE') return deleteReport(env, id);
  if (action === 'attachments' && parts[4] && request.method === 'GET') {
    return getAttachment(env, id, parts[4]);
  }
  if (action === 'promote' && request.method === 'POST') return promoteReport(request, env, id);
  if (action === 'status' && request.method === 'POST') return setStatus(request, env, id);

  return jsonCors(404, { ok: false, error: 'not_found' }, env);
}

async function listReports(env: Env, url: URL): Promise<Response> {
  const status = url.searchParams.get('status');
  const limit = Math.min(Math.max(intOr(url.searchParams.get('limit'), 100), 1), 200);

  // Summaries only — description/metadata/attachments are fetched in detail.
  const cols =
    'id, created, category, summary, email, installation_id, status, github_url, ' +
    '(SELECT COUNT(*) FROM attachments a WHERE a.report_id = reports.id) AS attachment_count';
  let stmt: D1PreparedStatement;
  if (status && ALLOWED_STATUSES.has(status)) {
    stmt = env.DB
      .prepare(`SELECT ${cols} FROM reports WHERE status = ?1 ORDER BY created DESC LIMIT ?2`)
      .bind(status, limit);
  } else {
    stmt = env.DB
      .prepare(`SELECT ${cols} FROM reports ORDER BY created DESC LIMIT ?1`)
      .bind(limit);
  }

  const { results } = await stmt.all();
  return jsonCors(200, { ok: true, reports: results ?? [] }, env);
}

async function getReport(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM reports WHERE id = ?1').bind(id).first<ReportRow>();
  if (!row) return jsonCors(404, { ok: false, error: 'not_found' }, env);
  const { results } = await env.DB
    .prepare('SELECT id, name, content_type, size, created FROM attachments WHERE report_id = ?1 ORDER BY created')
    .bind(id)
    .all<Omit<AttachmentRow, 'report_id'>>();
  return jsonCors(200, { ok: true, report: row, attachments: results ?? [] }, env);
}

async function getAttachment(env: Env, id: string, attId: string): Promise<Response> {
  if (!UUID_RE.test(attId)) return jsonCors(400, { ok: false, error: 'bad_id' }, env);
  const meta = await env.DB
    .prepare('SELECT name, content_type FROM attachments WHERE id = ?1 AND report_id = ?2')
    .bind(attId, id)
    .first<{ name: string; content_type: string }>();
  if (!meta) return jsonCors(404, { ok: false, error: 'not_found' }, env);

  const obj = await env.REPORTS_BUCKET.get(`reports/${id}/${attId}`);
  if (!obj) return jsonCors(404, { ok: false, error: 'not_found' }, env);
  return new Response(obj.body, {
    headers: {
      'Content-Type': meta.content_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${meta.name.replace(/"/g, '')}"`,
      ...corsHeaders(env),
    },
  });
}

async function promoteReport(request: Request, env: Env, id: string): Promise<Response> {
  if (!env.GITHUB_TOKEN) {
    return jsonCors(503, { ok: false, error: 'github_not_configured' }, env);
  }
  const row = await env.DB.prepare('SELECT * FROM reports WHERE id = ?1').bind(id).first<ReportRow>();
  if (!row) return jsonCors(404, { ok: false, error: 'not_found' }, env);

  const overrides = (await request.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    labels?: string[];
  };

  let issueUrl: string;
  try {
    issueUrl = await createIssue(env, row, overrides);
  } catch (err) {
    console.error('promote failed:', err);
    return jsonCors(502, { ok: false, error: 'issue_creation_failed' }, env);
  }

  await env.DB.prepare('UPDATE reports SET status = ?1, github_url = ?2 WHERE id = ?3')
    .bind('promoted', issueUrl, id)
    .run();

  return jsonCors(200, { ok: true, issue: issueUrl }, env);
}

async function deleteReport(env: Env, id: string): Promise<Response> {
  // Remove attachment blobs + rows, then the report row.
  const { results } = await env.DB
    .prepare('SELECT id FROM attachments WHERE report_id = ?1')
    .bind(id)
    .all<{ id: string }>();
  const keys = (results ?? []).map((r) => `reports/${id}/${r.id}`);
  if (keys.length > 0) await env.REPORTS_BUCKET.delete(keys);
  await env.DB.prepare('DELETE FROM attachments WHERE report_id = ?1').bind(id).run();
  const res = await env.DB.prepare('DELETE FROM reports WHERE id = ?1').bind(id).run();
  if (res.meta.changes === 0) return jsonCors(404, { ok: false, error: 'not_found' }, env);
  return jsonCors(200, { ok: true, deleted: 1 }, env);
}

async function setStatus(request: Request, env: Env, id: string): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status = body.status ?? '';
  if (!SETTABLE_STATUSES.has(status)) {
    return jsonCors(400, { ok: false, error: 'bad_status' }, env);
  }

  const res = await env.DB.prepare('UPDATE reports SET status = ?1 WHERE id = ?2').bind(status, id).run();
  if (res.meta.changes === 0) return jsonCors(404, { ok: false, error: 'not_found' }, env);
  return jsonCors(200, { ok: true, status }, env);
}

// MARK: - Prune (bulk delete)

const PRUNE_WINDOWS_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/** Resolves a prune window to a "created >= sinceMs" bound. `all` => whole table. */
function resolvePruneWindow(window: string): { valid: boolean; sinceMs: number | null } {
  if (window === 'all') return { valid: true, sinceMs: null };
  if (window in PRUNE_WINDOWS_MS) return { valid: true, sinceMs: Date.now() - PRUNE_WINDOWS_MS[window] };
  return { valid: false, sinceMs: null };
}

/** GET /admin/reports/prune?window= — how many reports the prune would delete. */
async function prunePreview(env: Env, url: URL): Promise<Response> {
  const { valid, sinceMs } = resolvePruneWindow(url.searchParams.get('window') ?? '');
  if (!valid) return jsonCors(400, { ok: false, error: 'bad_window' }, env);

  const stmt = sinceMs === null
    ? env.DB.prepare('SELECT COUNT(*) AS n FROM reports')
    : env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE created >= ?1').bind(sinceMs);
  const row = await stmt.first<{ n: number }>();
  return jsonCors(200, { ok: true, count: row?.n ?? 0 }, env);
}

/**
 * POST /admin/reports/prune  body { window: "24h" | "7d" | "30d" | "all" }
 * Deletes reports CREATED WITHIN the window (all statuses), their attachment
 * rows, and their R2 blobs. Irreversible.
 */
async function pruneReports(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { window?: string };
  const { valid, sinceMs } = resolvePruneWindow(body.window ?? '');
  if (!valid) return jsonCors(400, { ok: false, error: 'bad_window' }, env);

  // Delete attachment blobs from R2 first (R2 delete takes up to 1000 keys/call).
  const attStmt = sinceMs === null
    ? env.DB.prepare('SELECT report_id AS rid, id AS aid FROM attachments')
    : env.DB.prepare(
        'SELECT a.report_id AS rid, a.id AS aid FROM attachments a JOIN reports r ON a.report_id = r.id WHERE r.created >= ?1',
      ).bind(sinceMs);
  const { results } = await attStmt.all<{ rid: string; aid: string }>();
  const keys = (results ?? []).map((r) => `reports/${r.rid}/${r.aid}`);
  for (let i = 0; i < keys.length; i += 1000) {
    await env.REPORTS_BUCKET.delete(keys.slice(i, i + 1000));
  }

  // Delete attachment rows, then report rows.
  if (sinceMs === null) {
    await env.DB.prepare('DELETE FROM attachments').run();
  } else {
    await env.DB
      .prepare('DELETE FROM attachments WHERE report_id IN (SELECT id FROM reports WHERE created >= ?1)')
      .bind(sinceMs)
      .run();
  }
  const delStmt = sinceMs === null
    ? env.DB.prepare('DELETE FROM reports')
    : env.DB.prepare('DELETE FROM reports WHERE created >= ?1').bind(sinceMs);
  const res = await delStmt.run();
  return jsonCors(200, { ok: true, deleted: res.meta.changes }, env);
}
