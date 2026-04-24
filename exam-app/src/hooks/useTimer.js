import { useState, useEffect, useCallback } from 'react';

const KEY_ACCUMULATED = 'mockExam_accumulatedTime';
const KEY_IS_PAUSED = 'mockExam_isPaused';
const KEY_LAST_START = 'mockExam_lastStart';

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function useTimer() {
  const [elapsed, setElapsed] = useState(() => {
    const acc = localStorage.getItem(KEY_ACCUMULATED);
    return acc ? parseInt(acc, 10) : 0;
  });
  const [isPaused, setIsPaused] = useState(() => {
    return localStorage.getItem(KEY_IS_PAUSED) === 'true';
  });
  const [display, setDisplay] = useState('00:00');

  useEffect(() => {
    if (isPaused) {
      localStorage.setItem(KEY_IS_PAUSED, 'true');
      localStorage.setItem(KEY_ACCUMULATED, String(elapsed));
      setDisplay(formatElapsed(elapsed));
      return;
    }

    localStorage.setItem(KEY_IS_PAUSED, 'false');
    const lastStart = Date.now();
    localStorage.setItem(KEY_LAST_START, String(lastStart));

    const id = setInterval(() => {
      const acc = parseInt(localStorage.getItem(KEY_ACCUMULATED) || '0', 10);
      const start = parseInt(localStorage.getItem(KEY_LAST_START) || String(Date.now()), 10);
      const current = Math.floor((Date.now() - start) / 1000) + acc;
      setElapsed(current);
      setDisplay(formatElapsed(current));
    }, 1000);

    return () => {
      const start = parseInt(localStorage.getItem(KEY_LAST_START) || String(Date.now()), 10);
      const currentAcc = parseInt(localStorage.getItem(KEY_ACCUMULATED) || '0', 10);
      const final = currentAcc + Math.floor((Date.now() - start) / 1000);
      localStorage.setItem(KEY_ACCUMULATED, String(final));
      clearInterval(id);
    };
  }, [isPaused]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const reset = useCallback(() => {
    localStorage.setItem(KEY_ACCUMULATED, '0');
    localStorage.setItem(KEY_LAST_START, String(Date.now()));
    setElapsed(0);
    setDisplay('00:00');
  }, []);

  return { elapsed, display, isPaused, pause, resume, reset };
}

