export interface Env {
  // Bindings
  REPORTS_BUCKET: R2Bucket;
  DB: D1Database;
  IP_LIMITER: RateLimiter;
  INSTALL_LIMITER: RateLimiter;
  ADMIN_LIMITER: RateLimiter;

  // Secrets (wrangler secret put ...)
  APP_KEY: string;
  ADMIN_KEY: string;
  GITHUB_TOKEN?: string; // required only for promotion

  // Vars (wrangler.jsonc)
  PRODUCT_NAME: string; // shown in the liveness banner + GitHub User-Agent
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  DAILY_CAP: string;
  INSTALL_DAILY_CAP: string;
  MAX_ATTACHMENT_BYTES: string; // per-attachment cap
  MAX_ATTACHMENTS: string; // per-report count cap
  MAX_TOTAL_BYTES: string; // whole-request cap (content-length guard)
  ADMIN_ALLOWED_ORIGIN: string;
}

/** Cloudflare Rate Limiting API binding (configured under `ratelimits`). */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface ReportRow {
  id: string;
  created: number;
  category: string;
  summary: string;
  description: string;
  email: string;
  installation_id: string;
  app_version: string;
  os_version: string;
  metadata: string | null;
  status: string;
  github_url: string | null;
}

export interface AttachmentRow {
  id: string;
  report_id: string;
  name: string;
  content_type: string;
  size: number;
  created: number;
}
