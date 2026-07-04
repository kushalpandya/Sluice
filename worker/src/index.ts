/**
 * Sluice
 * ======
 * A small, self-hostable report-triage backend for any app. Reports are STORED,
 * not auto-filed: ingest writes a record to D1 + any attachments to R2 and stops
 * there. Nothing reaches your issue tracker until you promote it from the triage
 * UI, which keeps your public repo free of spam/noise.
 *
 * Two audiences, two auth schemes:
 *   - The reporting app POSTs reports with an embedded app key (X-Report-Key).
 *   - Your self-hosted triage UI calls /admin/* with a bearer ADMIN_KEY.
 *
 * Public endpoints
 *   POST /report                       app submission (multipart/form-data)
 *   GET  /                             liveness
 *
 * Admin endpoints (Authorization: Bearer <ADMIN_KEY>)
 *   GET    /admin/reports?status=&limit=          list report summaries (newest first)
 *   GET    /admin/reports/:id                     full record + attachment list
 *   DELETE /admin/reports/:id                     delete report + attachments (rows + blobs)
 *   GET    /admin/reports/:id/attachments/:attId  stream one attachment blob
 *   POST   /admin/reports/:id/promote             file an issue on your repo, mark promoted.
 *                                                   Body may override { title, body, labels }.
 *   POST   /admin/reports/:id/status              body { status: "new" | "spam" | "archived" }
 *   GET|POST /admin/reports/prune                 bulk delete by window { 24h|7d|30d|all }
 *
 * Multipart fields (POST /report): reportId, installationId, category
 *   (bug|crash|feature|other), summary, description, email, appVersion,
 *   osVersion (all required), optional metadata (JSON string/file), and zero or
 *   more `attachment` file parts (logs, screenshots, recordings, ...).
 *
 * Abuse model: "light enforcement" for an open-source app — raise cost, cap
 * blast radius. See README "Security model".
 *
 * Source layout (bundled into one Worker by wrangler/esbuild at deploy):
 *   index.ts     this router / fetch entry
 *   types.ts     Env, RateLimiter, ReportRow, AttachmentRow
 *   constants.ts validation limits + allowed sets
 *   http.ts      json / jsonCors / corsHeaders
 *   util.ts      generic form/parse helpers
 *   security.ts  admin auth, constant-time compare, daily-cap counters
 *   ingest.ts    POST /report handler
 *   admin.ts     /admin/* handlers incl. attachments + prune
 *   github.ts    issue creation for promotion
 */

import type { Env } from './types';
import { json, corsHeaders, applyCors } from './http';
import { handleReport } from './ingest';
import { handleAdmin } from './admin';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS applies only to the browser-facing /admin surface. applyCors sets the
    // per-request Allow-Origin from the ADMIN_ALLOWED_ORIGIN allowlist.
    if (request.method === 'OPTIONS' && path.startsWith('/admin/')) {
      return applyCors(new Response(null, { status: 204, headers: corsHeaders(env) }), request, env);
    }
    if (path.startsWith('/admin/')) {
      return applyCors(await handleAdmin(request, env, url), request, env);
    }
    if (request.method === 'POST' && path === '/report') {
      return handleReport(request, env, ctx);
    }
    if (request.method === 'GET' && path === '/') {
      return new Response(`${env.PRODUCT_NAME || 'Sluice'}\n`, { status: 200 });
    }
    return json(404, { ok: false, error: 'not_found' });
  },
};
