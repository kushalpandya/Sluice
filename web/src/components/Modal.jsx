import { Icon } from './Icon.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { cx } from '../lib/utils.js';

// Centred dialog with a scrollable body; full-width sheet on phones. Rendered
// only when open. Escape is handled centrally in useTriage so stacked dialogs
// close topmost-first.
//
// `Dialog` is the inner half, split out so the focus trap mounts with the open
// dialog rather than with the always-rendered wrapper.
function Dialog({ onClose, title, subtitle, children, footer, wide }) {
  const ref = useFocusTrap();
  return (
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        class="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabindex="-1"
        class={cx(
          'animate-pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden',
          'rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <header class="flex items-start gap-3 border-b border-line px-5 py-4">
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold">{title}</h2>
            {subtitle && <p class="mt-0.5 truncate text-xs text-ink-soft">{subtitle}</p>}
          </div>
          <button class="btn btn-ghost btn-icon" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </header>
        <div class="scroll-pane flex-1 px-5 py-4">{children}</div>
        {/* Footers are right-aligned here so no caller needs a spacer element. */}
        {footer && (
          <footer class="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Modal({ open, ...props }) {
  if (!open) return null;
  return <Dialog {...props} />;
}
