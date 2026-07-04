import { STATUSES } from './constants.js';

export const when = (ms) => new Date(ms).toLocaleString();

export const normalizeStatus = (s) => {
  s = (s || '').toLowerCase();
  if (s === 'all') return '';
  if (s === 'archive') return 'archived';
  return STATUSES.includes(s) ? s : '';
};
