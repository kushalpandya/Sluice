-- Sluice — D1 schema (generic report-triage platform).
-- Apply locally:  npx wrangler d1 execute sluice-reports --local  --file schema.sql
-- Apply remote:   npx wrangler d1 execute sluice-reports --remote --file schema.sql

CREATE TABLE IF NOT EXISTS reports (
  id              TEXT PRIMARY KEY,            -- client reportId (UUID); idempotency key
  created         INTEGER NOT NULL,            -- unix epoch ms
  category        TEXT NOT NULL,               -- bug | crash | feature | other
  summary         TEXT NOT NULL,
  description     TEXT NOT NULL,
  email           TEXT NOT NULL,
  installation_id TEXT NOT NULL,               -- anonymous per-install id (rate-limit subject)
  app_version     TEXT NOT NULL,               -- reporting app's version
  os_version      TEXT NOT NULL,               -- reporting OS/platform
  metadata        TEXT,                        -- optional opaque JSON blob (stored, never parsed); catch-all for extra/future fields
  status          TEXT NOT NULL DEFAULT 'new', -- new | promoted | spam | archived
  github_url      TEXT                         -- set when promoted
);

-- Keeps list/filter queries from scanning the whole table (D1 bills rows scanned).
CREATE INDEX IF NOT EXISTS idx_reports_status_created  ON reports(status, created DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created         ON reports(created DESC);
CREATE INDEX IF NOT EXISTS idx_reports_install_created ON reports(installation_id, created);

-- Zero or more binary attachments per report (logs, screenshots, recordings, ...).
-- The bytes live in R2 at reports/<report_id>/<id>; this row is the metadata.
CREATE TABLE IF NOT EXISTS attachments (
  id           TEXT PRIMARY KEY,               -- server-generated UUID; also the R2 key suffix
  report_id    TEXT NOT NULL,
  name         TEXT NOT NULL,                  -- original filename
  content_type TEXT NOT NULL,                  -- MIME type (drives how the UI renders it)
  size         INTEGER NOT NULL,               -- bytes
  created      INTEGER NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE INDEX IF NOT EXISTS idx_attachments_report ON attachments(report_id);
