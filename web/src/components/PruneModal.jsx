import { Modal } from './Modal.jsx';
import { WINDOW_LABELS } from '../lib/constants.js';

const WINDOWS = [
  ['24h', 'Last 24 hours'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['all', 'Everything'],
];

export function PruneModal({ prune, onClose, selectWindow, doPrune }) {
  let msg = '';
  let canDelete = false;
  let btnLabel = 'Delete';
  if (prune && prune.window) {
    if (prune.count === null) {
      msg = 'Checking...';
    } else {
      const n = prune.count;
      msg = `This will permanently delete ${n} report${n === 1 ? '' : 's'} from ${WINDOW_LABELS[prune.window]}, including their logs.`;
      canDelete = n > 0;
      btnLabel =
        n === 0 ? 'Nothing to delete' : `Delete ${n} report${n === 1 ? '' : 's'}`;
    }
  }

  const footer = (
    <>
      <span class="spacer"></span>
      <button class="button" onClick={onClose}>Cancel</button>
      <button class="button is-danger" disabled={!canDelete} onClick={doPrune}>
        {btnLabel}
      </button>
    </>
  );

  return (
    <Modal open={prune !== null} onClose={onClose} title="Prune reports" footer={footer}>
      <p class="mb-4">
        Permanently delete reports (and their logs) created within a window. This
        cannot be undone.
      </p>
      <div class="buttons">
        {WINDOWS.map(([w, l]) => (
          <button
            key={w}
            class={
              'button is-fullwidth' +
              (prune && prune.window === w ? ' is-danger' : '')
            }
            onClick={() => selectWindow(w)}
          >
            {l}
          </button>
        ))}
      </div>
      <p class="has-text-grey" style="min-height:1.25rem">{msg}</p>
    </Modal>
  );
}
