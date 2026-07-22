import { STATUSES } from './constants.js';

// Join class-name fragments, dropping falsy ones. Keeps conditional class lists
// free of leading/trailing-space bookkeeping, which is easy to get wrong when
// the list is built from several ternaries.
export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const when = (ms) => new Date(ms).toLocaleString();

// YYYY-MM-DD HH:mm - the unambiguous form, for the list-row tooltip behind the
// abbreviated timestamp.
export const whenDate = (ms) => {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${date} ${time}`;
};

// Intl formatters are expensive to construct and these run once per list row,
// so build each one lazily and keep it. Locale changes need a reload anyway.
const dateFormat = (options) => {
  let f;
  return (date) => (f ||= new Intl.DateTimeFormat(undefined, options)).format(date);
};

const fmtTime = dateFormat({ hour: 'numeric', minute: '2-digit' });
const fmtWeekday = dateFormat({ weekday: 'short' });
const fmtMonthDay = dateFormat({ month: 'short', day: 'numeric' });
const fmtFullDate = dateFormat({ year: 'numeric', month: 'short', day: 'numeric' });

let relativeFormat;
const fmtRelative = (value, unit) =>
  (relativeFormat ||= new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })).format(
    value,
    unit,
  );

// "3 hours ago" / "last week", in the viewer's locale. Steps up through the
// units until the elapsed time fits one, so the largest sensible unit wins.
const DIVISIONS = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.34524, 'week'],
  [12, 'month'],
  [Infinity, 'year'],
];

export const timeAgo = (ms) => {
  let elapsed = (ms - Date.now()) / 1000;
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(elapsed) < amount) return fmtRelative(Math.round(elapsed), unit);
    elapsed /= amount;
  }
  return '';
};

// Mail-client list column: time for today, weekday within the last week, then
// a date. Keeps the column narrow while staying readable.
export const whenShort = (ms) => {
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return fmtTime(d);
  if ((now - d) / 86400000 < 7) return fmtWeekday(d);
  if (d.getFullYear() === now.getFullYear()) return fmtMonthDay(d);
  return fmtFullDate(d);
};

// Avatar monogram from the reporter's address.
export const initials = (email) => {
  const local = (email || '').split('@')[0] || '?';
  const parts = local.split(/[._\-+]/).filter(Boolean);
  const chars = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return chars.toUpperCase();
};

// Pluralised count, shared by the prune dialog and its confirmation so the two
// can't drift apart.
export const reportCount = (n) => `${n} report${n === 1 ? '' : 's'}`;

// The list the user actually sees: free-text filter over the fields shown in a
// row, then ordering. Pure, so it stays out of useTriage.
export const searchAndSort = (reports, query, order) => {
  const q = query.trim().toLowerCase();
  return reports
    .filter(
      (r) =>
        !q ||
        [r.summary, r.email, r.category, r.status, r.installation_id]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
    )
    .sort((a, b) => (order === 'newest' ? b.created - a.created : a.created - b.created));
};

export const normalizeStatus = (s) => {
  s = (s || '').toLowerCase();
  if (s === 'all') return '';
  if (s === 'archive') return 'archived';
  return STATUSES.includes(s) ? s : '';
};

export const formatSize = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

// Attachment content type → Icon name.
export const attachmentIcon = (ct = '') => {
  ct = ct.toLowerCase();
  if (ct.startsWith('image/')) return 'image';
  if (ct.startsWith('audio/')) return 'music';
  if (ct.startsWith('video/')) return 'film';
  return 'file';
};
