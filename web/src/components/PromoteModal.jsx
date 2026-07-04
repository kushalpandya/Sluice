import { Modal } from './Modal.jsx';

export function PromoteModal({ form, setForm, onCreate, onClose }) {
  const footer = (
    <>
      <span class="spacer"></span>
      <button class="button" onClick={onClose}>Cancel</button>
      <button class="button is-primary" onClick={onCreate}>Create issue</button>
    </>
  );
  return (
    <Modal
      open={!!form}
      onClose={onClose}
      title="Promote to GitHub issue"
      footer={footer}
    >
      {form && (
        <>
          <div class="field">
            <label class="label">Title</label>
            <div class="control">
              <input
                class="input"
                value={form.title}
                onInput={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>
          <div class="field">
            <label class="label">Description</label>
            <div class="control">
              <textarea
                class="textarea"
                rows="6"
                value={form.body}
                onInput={(e) => setForm({ ...form, body: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div class="field">
            <label class="label">Labels (comma-separated, must exist on the repo)</label>
            <div class="control">
              <input
                class="input"
                value={form.labels}
                onInput={(e) => setForm({ ...form, labels: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
