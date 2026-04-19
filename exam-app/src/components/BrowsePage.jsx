import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BrowsePage.module.css';
import { renderMarkdown } from '../utils/parseQuestion';

const ATTEMPTED_KEY = 'examPrepAttempted';
const LAST_KEY      = 'examPrepLastQuestion';

export default function BrowsePage({ onStartExam }) {
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [query, setQuery]           = useState('');
  const [attempted, setAttempted]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(ATTEMPTED_KEY) || '[]')); }
    catch { return new Set(); }
  });
  const [revealed, setRevealed]     = useState(new Set());
  const lastRef = useRef(null);

  useEffect(() => {
    fetch('/questions-full.json')
      .then(r => r.json())
      .then(data => {
        const valid = data.filter(q => q && q.title && q.body).map((q, i) => ({ ...q, id: String(i) }));
        setQuestions(valid);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  /* Scroll to last viewed */
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const last = localStorage.getItem(LAST_KEY);
    if (last !== null) {
      setTimeout(() => {
        document.getElementById(`qcard-${last}`)?.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, 100);
    }
  }, [loading, questions]);

  const filtered = query
    ? questions.filter(q =>
        q.title.toLowerCase().includes(query.toLowerCase()) ||
        q.body.toLowerCase().includes(query.toLowerCase())
      )
    : questions;

  const toggleReveal = useCallback((id) => {
    localStorage.setItem(LAST_KEY, id);
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setAttempted(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(ATTEMPTED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  if (loading) return (
    <div className={styles.centerMsg}>
      <div className={styles.spinner} />
      <p>Loading question bank…</p>
    </div>
  );
  if (error) return <div className={styles.centerMsg} style={{ color: 'var(--danger)' }}>⚠️ {error}</div>;

  return (
    <div className={styles.page}>
      {/* Sticky toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.search}
            type="text"
            placeholder={`Search ${questions.length} questions…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={styles.clearSearch} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        <div className={styles.stats}>
          <span className={styles.statChip}>
            <span className={styles.statNum}>{attempted.size}</span>
            <span className={styles.statLbl}>Attempted</span>
          </span>
          <span className={styles.statChip}>
            <span className={styles.statNum}>{filtered.length}</span>
            <span className={styles.statLbl}>{query ? 'Results' : 'Total'}</span>
          </span>
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p>🔎 No questions match "<strong>{query}</strong>"</p>
        </div>
      )}

      {/* Question list */}
      <div className={styles.list}>
        {filtered.map((q, visIdx) => {
          const isAttempted = attempted.has(q.id);
          const isRevealed  = revealed.has(q.id);
          return (
            <motion.div
              key={q.id}
              id={`qcard-${q.id}`}
              className={`${styles.card} ${isAttempted ? styles.cardAttempted : ''}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(visIdx * 0.015, 0.3) }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  {isAttempted && <span className={styles.checkMark}>✅</span>}
                  <span className={styles.cardTitle}>{q.title}</span>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.metaTag}>#{parseInt(q.id) + 1}</span>
                  {q.timestamp && (
                    <span className={styles.metaTag}>🕘 {q.timestamp.split(' ')[0]}</span>
                  )}
                </div>
              </div>

              <div
                className={styles.cardBody}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(q.body) }}
              />

              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    className={styles.answerBox}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className={styles.answerLabel}>✓ Correct Answer</div>
                    <div className={styles.answerValue}>{q.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={styles.cardActions}>
                <button
                  className={`${styles.btn} ${isRevealed ? styles.btnOutline : styles.btnPrimary}`}
                  onClick={() => toggleReveal(q.id)}
                >
                  {isRevealed ? 'Hide Answer' : 'Show Answer'}
                </button>
                {q.link && (
                  <a href={q.link} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnGhost}`}>
                    Discussion →
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
