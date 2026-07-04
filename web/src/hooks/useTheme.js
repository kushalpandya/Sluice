import { useState, useEffect } from 'preact/hooks';

// Theme mode: 'auto' (follow system, default), 'light', or 'dark'. Persists to
// localStorage and sets data-theme on <html>, tracking live system changes while
// in auto mode.
export function useTheme() {
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem('sluiceThemeMode') || 'auto',
  );
  useEffect(() => {
    localStorage.setItem('sluiceThemeMode', themeMode);
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const effective =
        themeMode === 'auto' ? (mq.matches ? 'dark' : 'light') : themeMode;
      document.documentElement.setAttribute('data-theme', effective);
    };
    apply();
    if (themeMode === 'auto') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [themeMode]);
  return { themeMode, setThemeMode };
}
