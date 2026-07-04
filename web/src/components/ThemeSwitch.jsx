import { icon } from '../lib/format.jsx';

// Pinned to the page's top-right corner. Three modes; Auto follows the system.
const MODES = [
  ['auto', 'circle-half-stroke', 'Auto (match system)'],
  ['light', 'sun', 'Light'],
  ['dark', 'moon', 'Dark'],
];

export function ThemeSwitch({ mode, setMode }) {
  return (
    <div class="theme-switch buttons has-addons">
      {MODES.map(([m, ic, tip]) => (
        <button
          key={m}
          class={'button is-small' + (mode === m ? ' is-primary is-selected' : '')}
          title={tip}
          aria-label={tip}
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
        >
          {icon(ic)}
        </button>
      ))}
    </div>
  );
}
