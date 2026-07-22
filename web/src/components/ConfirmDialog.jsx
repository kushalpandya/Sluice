import { useEffect, useRef } from 'preact/hooks';
import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';
import { cx } from '../lib/utils.js';

// In-app replacement for window.confirm, driven by the `confirmation` state in
// useTriage. Rendered last in App so it stacks above whatever asked for it
// (e.g. the prune dialog).
//
// Focus lands on Cancel for a destructive confirmation and on the accept button
// otherwise, so a stray Enter right after triggering the action can't delete
// anything. Escape cancels either way.
export function ConfirmDialog({ state, onCancel }) {
  const focusRef = useRef(null);

  useEffect(() => {
    if (state && focusRef.current) focusRef.current.focus();
  }, [state]);

  if (!state) return null;

  const { title, message, confirmLabel = 'Confirm', icon = 'info', danger } = state;

  const footer = (
    <>
      <button class="btn" ref={danger ? focusRef : null} onClick={onCancel}>
        Cancel
      </button>
      <button
        ref={danger ? null : focusRef}
        class={cx('btn', danger ? 'btn-danger' : 'btn-primary')}
        onClick={state.onConfirm}
      >
        <Icon name={icon} size={15} />
        {confirmLabel}
      </button>
    </>
  );

  return (
    <Modal open onClose={onCancel} title={title} footer={footer}>
      <div class="flex gap-3">
        <span
          class={cx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            danger ? 'bg-bad-soft text-bad' : 'bg-info-soft text-info',
          )}
        >
          <Icon name={icon} size={18} />
        </span>
        <p class="pt-1.5 text-sm text-ink-soft">{message}</p>
      </div>
    </Modal>
  );
}
