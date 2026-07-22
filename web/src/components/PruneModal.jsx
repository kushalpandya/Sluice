import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';
import { WINDOW_LABELS } from '../lib/constants.js';
import { cx, reportCount } from '../lib/utils.js';

const WINDOWS = [
  ['24h', 'Last 24 hours'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['all', 'Everything'],
];

// What the dialog says and offers for the currently picked window: nothing
// until one is picked, "Checking…" while the count is in flight, then the count.
function summarise(prune) {
  if (!prune || !prune.window) return { msg: '', canDelete: false, btnLabel: 'Delete' };
  if (prune.count === null) return { msg: 'Checking…', canDelete: false, btnLabel: 'Delete' };
  const n = prune.count;
  return {
    msg: `This will permanently delete ${reportCount(n)} from ${WINDOW_LABELS[prune.window]}, including their logs.`,
    canDelete: n > 0,
    btnLabel: n === 0 ? 'Nothing to delete' : `Delete ${reportCount(n)}`,
  };
}

export function PruneModal({ prune, onClose, selectWindow, doPrune }) {
  const { msg, canDelete, btnLabel } = summarise(prune);

  const footer = (
    <>
      <button class="btn" onClick={onClose}>
        Cancel
      </button>
      <button class="btn btn-danger" disabled={!canDelete} onClick={doPrune}>
        <Icon name="trash" size={15} />
        {btnLabel}
      </button>
    </>
  );

  return (
    <Modal open={prune !== null} onClose={onClose} title="Prune reports" footer={footer}>
      <div class="mb-4 flex gap-3 rounded-lg border border-line bg-bad-soft p-3 text-sm text-bad">
        <Icon name="info" size={18} class="mt-0.5" />
        <p>
          Permanently deletes reports and their logs within a time window, whatever their
          status. This cannot be undone.
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        {WINDOWS.map(([w, l]) => {
          const on = prune && prune.window === w;
          return (
            <button
              key={w}
              class={cx('btn justify-start', on && 'border-bad text-bad')}
              aria-pressed={on}
              onClick={() => selectWindow(w)}
            >
              <Icon name="clock" size={15} />
              {l}
            </button>
          );
        })}
      </div>
      {/* The count arrives after the window is picked and relabels the delete
          button, so it has to be announced. */}
      <p class="mt-3 min-h-10 text-sm text-ink-soft" role="status" aria-live="polite">
        {msg}
      </p>
    </Modal>
  );
}
