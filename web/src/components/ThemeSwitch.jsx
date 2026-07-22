import { Icon } from './Icon.jsx';
import { cx } from '../lib/utils.js';

// Three modes; Auto follows the system. Renders as a segmented control in the
// expanded sidebar, and as a single cycling button on the collapsed rail.
const MODES = [
  ['auto', 'contrast', 'Auto (match system)'],
  ['light', 'sun', 'Light'],
  ['dark', 'moon', 'Dark'],
];

export function ThemeSwitch({ mode, setMode, compact }) {
  if (compact) {
    const i = Math.max(0, MODES.findIndex(([m]) => m === mode));
    const [, ic, tip] = MODES[i];
    const next = MODES[(i + 1) % MODES.length];
    const label = `Theme: ${tip} - switch to ${next[2]}`;
    return (
      <button
        class="btn btn-ghost btn-icon"
        title={label}
        aria-label={label}
        onClick={() => setMode(next[0])}
      >
        <Icon name={ic} size={18} />
      </button>
    );
  }

  return (
    <div class="flex gap-0.5 rounded-lg border border-line bg-subtle p-0.5" role="group" aria-label="Theme">
      {MODES.map(([m, ic, tip]) => (
        <button
          key={m}
          class={cx(
            'flex flex-1 items-center justify-center rounded-[7px] py-1.5 transition-colors',
            mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
          )}
          title={tip}
          aria-label={tip}
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
        >
          <Icon name={ic} size={15} />
        </button>
      ))}
    </div>
  );
}
