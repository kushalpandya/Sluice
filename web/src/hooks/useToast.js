import { useState, useRef, useCallback, useEffect } from 'preact/hooks';

const DEFAULT_MS = 2200;
let seq = 0; // remounts the toast element so its progress bar restarts

// A transient status message. A toast can also carry a *deferred action*: the
// work is held for the life of the toast (with a draining progress bar) so the
// user can undo it, and only runs once the toast expires. At most one deferred
// action is ever pending - starting another toast commits the previous one.
export function useToast() {
  const [toastState, setToastState] = useState(null);
  const timer = useRef(null);
  const deferred = useRef(null);
  const remaining = useRef(0);
  const startedAt = useRef(0);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
    setToastState(null);
  }, []);

  // Commit a pending deferred action now rather than when its toast expires,
  // returning whatever it returns so callers can await the write. Safe to call
  // at any time; a no-op when nothing is pending.
  const flushToast = useCallback(() => {
    const run = deferred.current;
    deferred.current = null;
    stop();
    return run ? run() : undefined;
  }, [stop]);

  // Drop the toast and its deferred action without running it (Undo).
  const cancelToast = useCallback(() => {
    deferred.current = null;
    stop();
  }, [stop]);

  const arm = useCallback(
    (ms) => {
      clearTimeout(timer.current);
      remaining.current = ms;
      startedAt.current = Date.now();
      timer.current = setTimeout(flushToast, ms);
    },
    [flushToast],
  );

  // Hovering or focusing the toast holds the undo window open (WCAG 2.2.1):
  // reaching for Undo must not be a race against the timer.
  const pauseToast = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    remaining.current -= Date.now() - startedAt.current;
  }, []);

  const resumeToast = useCallback(() => {
    if (timer.current || !deferred.current) return;
    arm(Math.max(remaining.current, 600));
  }, [arm]);

  //   toast('Saved')
  //   toast('Archived', { duration, action: { label, onClick }, onExpire })
  const toast = useCallback(
    (msg, opts = {}) => {
      flushToast();
      const duration = opts.duration || DEFAULT_MS;
      deferred.current = opts.onExpire || null;
      setToastState({ key: ++seq, msg, action: opts.action || null, duration });
      arm(duration);
    },
    [flushToast, arm],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toastState, toast, flushToast, cancelToast, pauseToast, resumeToast };
}
