import { TAG_COLOR } from '../lib/constants.js';

export function Tag({ v }) {
  return <span class={'tag' + (TAG_COLOR[v] ? ' ' + TAG_COLOR[v] : '')}>{v}</span>;
}
