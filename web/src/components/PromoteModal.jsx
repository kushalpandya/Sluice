import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';

export function PromoteModal({ form, setForm, onCreate, onClose }) {
  const footer = (
    <>
      <button class="btn" onClick={onClose}>
        Cancel
      </button>
      <button class="btn btn-primary" onClick={onCreate}>
        <Icon name="github" size={15} />
        Create issue
      </button>
    </>
  );
  return (
    <Modal
      open={!!form}
      onClose={onClose}
      title="Promote to GitHub issue"
      subtitle="Filed on the repository configured in the Worker."
      footer={footer}
      wide
    >
      {form && (
        <div class="space-y-4">
          <div>
            <label class="field-label" for="promote-title">
              Title
            </label>
            <input
              id="promote-title"
              class="field-input"
              value={form.title}
              onInput={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label class="field-label" for="promote-body">
              Description
            </label>
            <textarea
              id="promote-body"
              class="field-input min-h-40 font-mono text-[13px] leading-relaxed"
              rows="8"
              value={form.body}
              onInput={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div>
            <label class="field-label" for="promote-labels">
              Labels
            </label>
            <input
              id="promote-labels"
              class="field-input"
              value={form.labels}
              onInput={(e) => setForm({ ...form, labels: e.target.value })}
            />
            <p class="mt-1.5 text-xs text-ink-soft">
              Comma-separated. Each label must already exist on the repository.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
