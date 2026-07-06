// Deployment config for the triage UI. Adopters: set these for your product.
// (The brand colour is set in styles.scss via Bulma's `$primary`.)

// Static demo build (`npm run build:demo`): skips the connect screen and
// serves an in-memory mock of the admin API instead of a real Worker. Edits
// made in this mode are never persisted — a page reload starts over.
export const DEMO_MODE = import.meta.env.VITE_DEMO === 'true';

export const PRODUCT_NAME = DEMO_MODE ? 'Sluice' : '<Your Product Name>';

// Optional: pre-fill the Worker base URL on the connect screen. '' = blank.
export const DEFAULT_BASE = '';

export const DEMO_BANNER =
  "Demo mode - data is fake and local to your browser. Nothing is saved; reload to reset.";
