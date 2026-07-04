import type { Env } from './types';
import { json } from './http';
import { timingSafeEqual, countSince, startOfUtcDayMs } from './security';
import { strField, readMaybeFile, isBlob, intOr } from './util';
import {
  ALLOWED_CATEGORIES,
  ATTACHMENT_FIELD,
  MAX_SUMMARY,
  MAX_DESCRIPTION,
  MAX_EMAIL,
  MAX_VERSION,
  MAX_FILENAME,
  UUID_RE,
} from './constants';

// A multipart file part (File extends Blob, adding name/type at runtime).
interface FilePart extends Blob {
  name?: string;
  type: string;
}

// Report ingest (app-facing).
export async function handleReport(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  // 1. App key (cheapest filter).
  if (!timingSafeEqual(request.headers.get('X-Report-Key') ?? '', env.APP_KEY)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  // 2. Total-size guard before reading the body.
  const maxTotal = intOr(env.MAX_TOTAL_BYTES, 25 * 1024 * 1024);
  if (intOr(request.headers.get('content-length'), 0) > maxTotal + 64 * 1024) {
    return json(413, { ok: false, error: 'payload_too_large' });
  }

  // 3. Per-IP burst limit (native Rate Limiting API — no storage writes).
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await env.IP_LIMITER.limit({ key: ip })).success) {
    return json(429, { ok: false, error: 'rate_limited_ip' });
  }

  // 4. Parse + validate.
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'invalid_multipart' });
  }

  const reportId = strField(form.get('reportId')) || crypto.randomUUID();
  const installationId = strField(form.get('installationId')).trim();
  const category = strField(form.get('category')).trim();
  const summary = strField(form.get('summary')).trim();
  const description = strField(form.get('description')).trim();
  const email = strField(form.get('email')).trim();
  const appVersion = strField(form.get('appVersion')).trim();
  const osVersion = strField(form.get('osVersion')).trim();

  if (!UUID_RE.test(reportId)) return json(400, { ok: false, error: 'bad_report_id' });
  if (!installationId) return json(400, { ok: false, error: 'missing_installation' });
  if (!ALLOWED_CATEGORIES.has(category)) return json(400, { ok: false, error: 'bad_category' });
  if (!summary || summary.length > MAX_SUMMARY) return json(400, { ok: false, error: 'bad_summary' });
  if (!description || description.length > MAX_DESCRIPTION) return json(400, { ok: false, error: 'bad_description' });
  if (!email || email.length > MAX_EMAIL) return json(400, { ok: false, error: 'bad_email' });
  if (!appVersion || appVersion.length > MAX_VERSION) return json(400, { ok: false, error: 'bad_app_version' });
  if (!osVersion || osVersion.length > MAX_VERSION) return json(400, { ok: false, error: 'bad_os_version' });

  // 5. Collect + validate attachment parts (count + per-file size). getAll is
  //    typed string[] in workers-types, but file parts arrive as Blob at runtime.
  const raw = form.getAll(ATTACHMENT_FIELD) as unknown[];
  const parts = raw.filter(isBlob) as FilePart[];
  const maxAttachments = intOr(env.MAX_ATTACHMENTS, 10);
  const maxEach = intOr(env.MAX_ATTACHMENT_BYTES, 10 * 1024 * 1024);
  if (parts.length > maxAttachments) return json(400, { ok: false, error: 'too_many_attachments' });
  for (const p of parts) {
    if (p.size > maxEach) return json(413, { ok: false, error: 'attachment_too_large' });
  }

  // 6. Per-installation burst limit.
  if (!(await env.INSTALL_LIMITER.limit({ key: installationId })).success) {
    return json(429, { ok: false, error: 'rate_limited_install' });
  }

  // 7. Daily budget caps via D1 COUNT (rough ceiling; burst limiters bound the
  //    rate at which these can be pushed).
  const dayStart = startOfUtcDayMs();
  const globalToday = await countSince(env, dayStart);
  if (globalToday >= intOr(env.DAILY_CAP, 200)) {
    return json(429, { ok: false, error: 'daily_cap' });
  }
  const installToday = await countSince(env, dayStart, installationId);
  if (installToday >= intOr(env.INSTALL_DAILY_CAP, 5)) {
    return json(429, { ok: false, error: 'install_daily_cap' });
  }

  // 8. Insert the record. INSERT OR IGNORE gives idempotency on the reportId
  //    primary key — a client retry is a no-op success (and we skip re-storing
  //    attachments, since the first submission already stored them).
  const metadata = await readMaybeFile(form.get('metadata'));
  const res = await env.DB.prepare(
    `INSERT OR IGNORE INTO reports
       (id, created, category, summary, description, email, installation_id, app_version, os_version, metadata, status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'new')`,
  )
    .bind(
      reportId, Date.now(), category, summary, description, email, installationId,
      appVersion, osVersion, metadata || null,
    )
    .run();

  const duplicate = res.meta.changes === 0;

  // 9. Store attachments (only for a genuinely new report). R2 first, then the
  //    metadata rows in one D1 batch.
  if (!duplicate && parts.length > 0) {
    const rows: D1PreparedStatement[] = [];
    for (const p of parts) {
      const attId = crypto.randomUUID();
      const name = (p.name || 'attachment').slice(0, MAX_FILENAME);
      const contentType = p.type || 'application/octet-stream';
      await env.REPORTS_BUCKET.put(`reports/${reportId}/${attId}`, p.stream(), {
        httpMetadata: { contentType },
      });
      rows.push(
        env.DB.prepare(
          `INSERT INTO attachments (id, report_id, name, content_type, size, created)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        ).bind(attId, reportId, name, contentType, p.size, Date.now()),
      );
    }
    if (rows.length > 0) await env.DB.batch(rows);
  }

  return json(200, { ok: true, reportId, duplicate });
}
