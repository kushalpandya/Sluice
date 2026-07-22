// Deployment config for the triage UI. Adopters: set these for your product.
// (The brand colour is set in styles.css via `--color-brand`.)

// Static demo build (`npm run build:demo`): skips the connect screen and
// serves an in-memory mock of the admin API instead of a real Worker. Edits
// made in this mode are never persisted - a page reload starts over.
export const DEMO_MODE = import.meta.env.VITE_DEMO === 'true';

export const PRODUCT_NAME = DEMO_MODE ? 'Sluice' : '<Your Product Name>';

// Optional: pre-fill the Worker base URL on the connect screen. '' = blank.
export const DEFAULT_BASE = '';

// Shown only in demo builds, above the app shell: what this is, then what to
// expect of the demo. Keep both to one short line - it is app chrome, not copy.
export const DEMO_BANNER =
  "Sluice - a Cloudflare Workers-backed user reports triage system.";

export const DEMO_BANNER_NOTE = "Reload to reset changes.";

// Source repository, linked from the demo banner so visitors can find the project.
export const REPO_URL = "https://github.com/kushalpandya/Sluice";
