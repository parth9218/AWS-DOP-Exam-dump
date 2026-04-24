import { useState, useEffect, useCallback } from 'react';

const KEY_ANSWERS  = 'mockExam_answers';
const KEY_FLAGS    = 'mockExam_flags';
const KEY_CURRENT  = 'mockExam_currentQ';
const KEY_START_TS = 'mockExam_startedAt';

function loadFromStorage() {
  let answers = {};
  let flagged = new Set();
  let currentIdx = 0;

  try {
    const a = localStorage.getItem(KEY_ANSWERS);
    if (a) answers = JSON.parse(a);
  } catch { /* noop */ }

  try {
    const f = localStorage.getItem(KEY_FLAGS);
    if (f) flagged = new Set(JSON.parse(f));
  } catch { /* noop */ }

  try {
    const c = localStorage.getItem(KEY_CURRENT);
    if (c !== null) {
      const n = parseInt(c, 10);
      if (!isNaN(n) && n >= 0) currentIdx = n;
    }
  } catch { /* noop */ }

  if (!localStorage.getItem(KEY_START_TS)) {
    localStorage.setItem(KEY_START_TS, new Date().toISOString());
  }

  return { answers, flagged, currentIdx };
}

export function useExamState(questions) {
  const [answers, setAnswers]     = useState({});
  const [flagged, setFlagged]     = useState(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [initialized, setInitialized] = useState(false);

  /* Load from localStorage once questions are available */
  useEffect(() => {
    if (questions.length === 0) return;
    const { answers: a, flagged: f, currentIdx: c } = loadFromStorage();
    setAnswers(a);
    setFlagged(f);
    setCurrentIdx(Math.min(c, questions.length - 1));
    setInitialized(true);
  }, [questions]);

  /* Persist answers */
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(KEY_ANSWERS, JSON.stringify(answers));
  }, [answers, initialized]);

  /* Persist flags */
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(KEY_FLAGS, JSON.stringify([...flagged]));
  }, [flagged, initialized]);

  /* Persist current index */
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(KEY_CURRENT, String(currentIdx));
  }, [currentIdx, initialized]);

  const goTo = useCallback((idx) => {
    if (idx >= 0 && idx < questions.length) setCurrentIdx(idx);
  }, [questions.length]);

  const goNext = useCallback(() => {
    setCurrentIdx(i => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const goPrev = useCallback(() => {
    setCurrentIdx(i => Math.max(i - 1, 0));
  }, []);

  const toggleFlag = useCallback((idx) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const selectAnswer = useCallback((idx, key, checked, maxSelect, isSingle) => {
    setAnswers(prev => {
      const sel = prev[idx] ? [...prev[idx]] : [];
      let next;
      if (isSingle) {
        next = checked ? [key] : [];
      } else {
        if (checked) {
          if (sel.length < maxSelect) next = [...sel, key];
          else return prev; /* enforce max */
        } else {
          next = sel.filter(k => k !== key);
        }
      }
      next.sort();
      const updated = { ...prev };
      if (next.length === 0) delete updated[idx];
      else updated[idx] = next;
      return updated;
    });
  }, []);

  const clearExam = useCallback(() => {
    [
      KEY_ANSWERS, KEY_FLAGS, KEY_CURRENT, KEY_START_TS,
      'mockExam_accumulatedTime', 'mockExam_isPaused', 'mockExam_lastStart'
    ].forEach(k => localStorage.removeItem(k));
    setAnswers({});
    setFlagged(new Set());
    setCurrentIdx(0);
    localStorage.setItem(KEY_START_TS, new Date().toISOString());
  }, []);

  return {
    answers, flagged, currentIdx, initialized,
    goTo, goNext, goPrev, toggleFlag, selectAnswer, clearExam,
  };
}
