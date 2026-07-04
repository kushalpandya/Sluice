// Bulma modal-card. Rendered only when open; Esc is handled centrally in useTriage.
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div class="modal is-active">
      <div class="modal-background" onClick={onClose}></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{title}</p>
          <button class="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section class="modal-card-body">{children}</section>
        {footer && (
          <footer class="modal-card-foot">
            <div class="dlg-actions">{footer}</div>
          </footer>
        )}
      </div>
    </div>
  );
}
