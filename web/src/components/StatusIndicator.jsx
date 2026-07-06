import { TAG_COLOR } from '../lib/constants.js';

export function StatusIndicator({ v }) {
  return (
    <span class="status-indicator">
      <span class={'status-dot' + (TAG_COLOR[v] ? ' ' + TAG_COLOR[v] : '')}></span>
      {v}
    </span>
  );
}
