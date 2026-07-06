import { TAG_COLOR } from '../lib/constants.js';

export function Tag({ v, rounded }) {
  const classes = ['tag', TAG_COLOR[v], rounded && 'is-rounded'].filter(Boolean).join(' ');
  return <span class={classes}>{v}</span>;
}
