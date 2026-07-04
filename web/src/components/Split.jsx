import { useState, useEffect, useRef } from 'preact/hooks';
import { icon } from '../lib/format.jsx';

// Split button: primary action + caret opening a dropdown (opens upward to clear the modal footer).
export function Split({ color, align, primary, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);
  const btn = 'button is-outlined' + (color ? ' ' + color : '');
  return (
    <div class="split-btn" ref={ref}>
      <button class={btn + ' split-primary'} onClick={primary.onClick}>
        {primary.label}
      </button>
      <div
        class={
          'dropdown is-up' +
          (align === 'right' ? ' is-right' : '') +
          (open ? ' is-active' : '')
        }
      >
        <div class="dropdown-trigger">
          <button
            class={btn + ' split-caret'}
            aria-haspopup="true"
            onClick={() => setOpen((o) => !o)}
          >
            {icon('caret-down')}
          </button>
        </div>
        <div class="dropdown-menu" role="menu">
          <div class="dropdown-content">
            {items.map((it, i) => (
              <a
                key={i}
                class="dropdown-item"
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
