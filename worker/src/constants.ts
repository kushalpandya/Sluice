export const ALLOWED_CATEGORIES = new Set(['bug', 'crash', 'feature', 'other']);
export const ALLOWED_STATUSES = new Set(['new', 'promoted', 'spam', 'archived']);
// Statuses an operator can set directly. `promoted` is excluded — it's only
// reached via the promote endpoint (which also files the issue).
export const SETTABLE_STATUSES = new Set(['new', 'spam', 'archived']);

export const MAX_SUMMARY = 200;
export const MAX_DESCRIPTION = 5000;
export const MAX_EMAIL = 254;
export const MAX_VERSION = 100;
export const MAX_FILENAME = 200;

export const UUID_RE = /^[0-9a-fA-F-]{36}$/;

// The multipart field name for a file attachment. Repeatable — a client sends
// one part per file (log, screenshot, recording, ...), all named this.
export const ATTACHMENT_FIELD = 'attachment';
