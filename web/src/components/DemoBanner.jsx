import { Icon } from './Icon.jsx';
import { DEMO_BANNER, DEMO_BANNER_NOTE, REPO_URL } from '../config.js';

// Strip above the app shell, only in demo builds: one line saying what Sluice
// is, what to expect of the demo, and where the source lives. Tinted with the
// brand colour so it reads as a distinct band without shouting, and so it
// re-tints along with `--color-brand`.
export function DemoBanner() {
  return (
    <div class="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-brand/20 bg-brand-soft px-4 py-3 text-sm">
      <span class="font-medium text-ink">
        {DEMO_BANNER}
        {DEMO_BANNER_NOTE && (
          <span class="ml-1.5 font-normal text-ink-soft">{DEMO_BANNER_NOTE}</span>
        )}
      </span>
      {REPO_URL && (
        <a
          class="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="github" size={14} />
          View on GitHub
        </a>
      )}
    </div>
  );
}
