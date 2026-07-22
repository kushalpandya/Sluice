import { makeDemoReports } from './data.js';
import { ALLOWED_STATUSES, SETTABLE_STATUSES, PRUNE_WINDOWS_MS } from './constants.js';

// In-memory mock of the admin API, mirroring worker/src/admin.ts route-by-route
// so the UI can't tell the difference. State lives only in this module — a
// full page reload re-imports it fresh, so all edits are discarded.
let nextIssueNumber = 501;
let store = null;

// The seed data is built on first use, not at import time: with no module-level
// side effect, a real (non-demo) build tree-shakes this whole module and its
// fixtures out instead of shipping them dead.
const db = () => (store ||= makeDemoReports());

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function attachmentBlob(att) {
  if (att.content.text != null) return new Blob([att.content.text], { type: att.content_type });
  const bytes = Uint8Array.from(atob(att.content.base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: att.content_type });
}

function attachmentSize(att) {
  return attachmentBlob(att).size;
}

function resolvePruneWindow(window) {
  if (window === 'all') return { valid: true, sinceMs: null };
  if (window in PRUNE_WINDOWS_MS) return { valid: true, sinceMs: Date.now() - PRUNE_WINDOWS_MS[window] };
  return { valid: false, sinceMs: null };
}

function listReports(params) {
  const status = params.get('status');
  const limit = Math.min(Math.max(parseInt(params.get('limit'), 10) || 100, 1), 200);
  const rows = db()
    .filter((r) => !status || !ALLOWED_STATUSES.has(status) || r.status === status)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit)
    .map(({ id, created, category, summary, email, installation_id, status, github_url, attachments }) => ({
      id,
      created,
      category,
      summary,
      email,
      installation_id,
      status,
      github_url,
      attachment_count: attachments.length,
    }));
  return json(200, { ok: true, reports: rows });
}

function getReport(id) {
  const r = db().find((x) => x.id === id);
  if (!r) return json(404, { ok: false, error: 'not_found' });
  const { attachments, ...report } = r;
  return json(200, {
    ok: true,
    report,
    attachments: attachments.map((a) => ({
      id: a.id,
      name: a.name,
      content_type: a.content_type,
      size: attachmentSize(a),
      created: a.created,
    })),
  });
}

function deleteReport(id) {
  const before = db().length;
  store = db().filter((r) => r.id !== id);
  if (db().length === before) return json(404, { ok: false, error: 'not_found' });
  return json(200, { ok: true, deleted: 1 });
}

function setStatus(id, body) {
  const status = body.status ?? '';
  if (!SETTABLE_STATUSES.has(status)) return json(400, { ok: false, error: 'bad_status' });
  const r = db().find((x) => x.id === id);
  if (!r) return json(404, { ok: false, error: 'not_found' });
  r.status = status;
  return json(200, { ok: true, status });
}

function promoteReport(id, body) {
  const r = db().find((x) => x.id === id);
  if (!r) return json(404, { ok: false, error: 'not_found' });
  const issueUrl = `https://github.com/demo-org/demo-app/issues/${nextIssueNumber++}`;
  r.status = 'promoted';
  r.github_url = issueUrl;
  return json(200, { ok: true, issue: issueUrl });
}

function getAttachment(id, attId) {
  const r = db().find((x) => x.id === id);
  const att = r && r.attachments.find((a) => a.id === attId);
  if (!att) return json(404, { ok: false, error: 'not_found' });
  return new Response(attachmentBlob(att), {
    status: 200,
    headers: { 'Content-Type': att.content_type },
  });
}

function prunePreview(params) {
  const { valid, sinceMs } = resolvePruneWindow(params.get('window') ?? '');
  if (!valid) return json(400, { ok: false, error: 'bad_window' });
  const count = db().filter((r) => sinceMs === null || r.created >= sinceMs).length;
  return json(200, { ok: true, count });
}

function pruneReports(body) {
  const { valid, sinceMs } = resolvePruneWindow(body.window ?? '');
  if (!valid) return json(400, { ok: false, error: 'bad_window' });
  const before = db().length;
  store = db().filter((r) => !(sinceMs === null || r.created >= sinceMs));
  return json(200, { ok: true, deleted: before - db().length });
}

async function handle(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const [pathname, search] = path.split('?');
  const params = new URLSearchParams(search || '');
  const parts = pathname.split('/').filter(Boolean); // ['admin', 'reports', ...]
  const body = opts.body ? JSON.parse(opts.body) : {};

  if (parts[1] !== 'reports') return json(404, { ok: false, error: 'not_found' });
  const id = parts[2];
  const action = parts[3];

  if (!id && method === 'GET') return listReports(params);

  if (id === 'prune') {
    if (method === 'GET') return prunePreview(params);
    if (method === 'POST') return pruneReports(body);
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  if (!id) return json(400, { ok: false, error: 'bad_id' });
  if (!action && method === 'GET') return getReport(id);
  if (!action && method === 'DELETE') return deleteReport(id);
  if (action === 'attachments' && parts[4] && method === 'GET') return getAttachment(id, parts[4]);
  if (action === 'promote' && method === 'POST') return promoteReport(id, body);
  if (action === 'status' && method === 'POST') return setStatus(id, body);

  return json(404, { ok: false, error: 'not_found' });
}

// Same shape as createApiClient() in lib/api.js, so useTriage can use either
// interchangeably.
export function createDemoApiClient() {
  return { api: handle, apiJson: async (path, opts) => (await handle(path, opts)).json() };
}
