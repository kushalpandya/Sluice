import { useState, useRef } from 'preact/hooks';

// A transient toast message that auto-clears after ~2.2s.
export function useToast() {
  const [toastMsg, setToastMsg] = useState('');
  const timer = useRef();
  const toast = (m) => {
    setToastMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(''), 2200);
  };
  return { toastMsg, toast };
}
