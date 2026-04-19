import { useState, useEffect } from 'react';

const KEY_START_TS = 'mockExam_startedAt';

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [display, setDisplay] = useState('00:00');

  useEffect(() => {
    function tick() {
      const started = new Date(localStorage.getItem(KEY_START_TS) || new Date().toISOString());
      const secs = Math.floor((Date.now() - started.getTime()) / 1000);
      setElapsed(secs);
      setDisplay(formatElapsed(secs));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { elapsed, display };
}
