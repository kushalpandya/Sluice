import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon } from './Icon.jsx';
import { cx } from '../lib/utils.js';

// Overflow menu: a trigger button and a popup of plain buttons. Closes on
// outside click, on Tab out, on Escape, or after an item runs, always handing
// focus back to the trigger.
//
// Deliberately *not* role="menu": that role promises arrow-key navigation and a
// roving tabindex, which this doesn't implement. As a group of buttons it is
// announced accurately and sequential Tab matches what actually happens.
export function Menu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = ({ refocus } = {}) => {
    setOpen(false);
    if (refocus && ref.current) ref.current.querySelector('button').focus();
  };

  useEffect(() => {
    if (!open) return;
    const box = ref.current;
    const onDoc = (e) => {
      if (box && !box.contains(e.target)) setOpen(false);
    };
    // Capture phase so closing the menu doesn't also close the dialog behind it.
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close({ refocus: true });
    };
    const onFocusOut = (e) => {
      if (box && !box.contains(e.relatedTarget)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey, true);
    box.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey, true);
      box.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  return (
    <div class="relative" ref={ref}>
      <button
        class="btn btn-ghost btn-icon"
        title="More actions"
        aria-label="More actions"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="dots" size={18} />
      </button>
      {open && (
        <div
          class="animate-pop-in absolute top-full right-0 z-40 mt-1 min-w-48 overflow-hidden
            rounded-xl border border-line bg-surface p-1 shadow-xl"
        >
          {items.map((it) => (
            <button
              key={it.label}
              class={cx(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm',
                'transition-colors hover:bg-hover',
                it.danger ? 'text-bad' : 'text-ink',
              )}
              onClick={() => {
                close({ refocus: true });
                it.onClick();
              }}
            >
              {it.icon && <Icon name={it.icon} size={16} />}
              <span class="truncate-flex flex-1">{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
