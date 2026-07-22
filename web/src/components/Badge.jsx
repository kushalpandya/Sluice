import { Icon } from './Icon.jsx';
import { categoryMeta, statusMeta } from '../lib/constants.js';

// Pills for a report's category and status, shared by the list and the reader.

const BASE =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5';

export function CategoryBadge({ v }) {
  const m = categoryMeta(v);
  return (
    <span class={`${BASE} ${m.class}`}>
      <Icon name={m.icon} size={12} />
      {m.label}
    </span>
  );
}

export function StatusBadge({ v }) {
  const m = statusMeta(v);
  return <span class={`${BASE} ${m.class}`}>{m.label}</span>;
}
