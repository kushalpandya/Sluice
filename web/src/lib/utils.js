import { STATUSES } from './constants.js';

export const when = (ms) => new Date(ms).toLocaleString();

// YYYY-MM-DD HH:mm, for the Received column (the detail view keeps the full
// locale-formatted timestamp from `when`).
export const whenDate = (ms) => {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${date} ${time}`;
};

export const normalizeStatus = (s) => {
  s = (s || '').toLowerCase();
  if (s === 'all') return '';
  if (s === 'archive') return 'archived';
  return STATUSES.includes(s) ? s : '';
};
