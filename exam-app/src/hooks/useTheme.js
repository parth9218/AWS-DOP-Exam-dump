import { useState, useEffect, useCallback } from 'react';

const KEY = 'mockExamTheme';

function getEffective() {
  const saved = localStorage.getItem(KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [saved, setSaved] = useState(() => localStorage.getItem(KEY)); // null | 'dark' | 'light'
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const effective = saved === 'dark' || saved === 'light'
    ? saved
    : (systemDark ? 'dark' : 'light');

  /* Apply to <html> on change */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effective);
  }, [effective]);

  /* Listen for OS preference change */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const cycle = useCallback(() => {
    setSaved(prev => {
      let next;
      if (!prev)          next = 'dark';
      else if (prev === 'dark')  next = 'light';
      else                next = null;

      if (next === null) localStorage.removeItem(KEY);
      else               localStorage.setItem(KEY, next);
      return next;
    });
  }, []);

  /* Icon & label */
  const icon  = saved === 'dark' ? '🌙' : saved === 'light' ? '☀️' : '🖥';
  const title = saved === 'dark' 
    ? 'Dark mode (click for light)' 
    : saved === 'light' 
      ? 'Light mode (click for system)' 
      : 'System mode (click for dark)';

  return { theme: effective, saved, cycle, icon, title };
}
