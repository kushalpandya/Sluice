import { useState, useEffect } from 'preact/hooks';

// Reactive `matchMedia`, so layout decisions that CSS alone can't make (which
// shape the sidebar renders in) stay in sync with the viewport.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
