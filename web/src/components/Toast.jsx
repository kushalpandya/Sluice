// Transient status message, pinned bottom-centre above everything else. When
// the toast carries an action (Undo), a draining bar shows how long the action
// it announced is still reversible - see useToast.
export function Toast({ toast, onPause, onResume }) {
  const undoable = !!(toast && toast.action);
  return (
    <>
      {/* Always mounted: assistive tech only reliably announces changes to a
          live region that was already in the accessibility tree, so the visible
          toast is hidden from it and this carries the message instead. */}
      <div role="status" aria-live="polite" class="sr-only">
        {toast ? (undoable ? `${toast.msg}. Press Control Z to undo.` : toast.msg) : ''}
      </div>

      {toast && (
        <div
          key={toast.key}
          aria-hidden="true"
          onMouseEnter={undoable ? onPause : undefined}
          onMouseLeave={undoable ? onResume : undefined}
          onFocusIn={undoable ? onPause : undefined}
          onFocusOut={undoable ? onResume : undefined}
          class="toast-shell animate-pop-in fixed bottom-5 left-1/2 z-[60]
            max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl
            bg-ink text-sm font-medium text-surface shadow-xl"
        >
          <div class="flex items-center gap-3 px-4 py-2.5">
            <span class="truncate">{toast.msg}</span>
            {toast.action && (
              <button
                class="shrink-0 rounded-md border border-surface/30 px-2 py-0.5 text-xs
                  font-semibold transition-colors hover:bg-surface/15"
                onClick={toast.action.onClick}
              >
                {toast.action.label}
              </button>
            )}
          </div>
          {toast.action && (
            <div
              class="toast-progress h-0.5 bg-surface/50"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          )}
        </div>
      )}
    </>
  );
}
