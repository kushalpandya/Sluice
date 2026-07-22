import { useEffect, useRef } from 'preact/hooks';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), ' +
  'select:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Modal focus handling, shared by the dialogs and the mobile nav drawer: move
// focus in on mount, keep Tab inside, and hand focus back to whatever opened it
// on unmount. Callers render the layer only while it is open, so mounting is
// the same event as opening.
//
// Returns a ref to put on the element that should contain focus.
export function useFocusTrap() {
  const ref = useRef(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const previous = document.activeElement;

    if (!box.contains(document.activeElement)) {
      // A form dialog should open on its first field rather than on the close
      // button that happens to come first in the markup.
      const target = box.querySelector('input, textarea, select') || box.querySelector(FOCUSABLE);
      (target || box).focus();
    }

    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...box.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    box.addEventListener('keydown', onKey);
    return () => {
      box.removeEventListener('keydown', onKey);
      if (previous && previous.focus) previous.focus();
    };
  }, []);

  return ref;
}
