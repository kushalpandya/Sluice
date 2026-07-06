// Mirrors worker/src/constants.ts + the prune windows from worker/src/admin.ts
// (kept separate from the worker so the demo build has no dependency on it).
export const ALLOWED_STATUSES = new Set(['new', 'promoted', 'spam', 'archived']);
export const SETTABLE_STATUSES = new Set(['new', 'spam', 'archived']);

export const PRUNE_WINDOWS_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};
