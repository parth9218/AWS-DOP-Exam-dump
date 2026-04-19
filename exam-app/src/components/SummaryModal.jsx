import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SummaryModal.module.css';
import { correctKeys, truncate } from '../utils/parseQuestion';

/* SVG donut chart */
function DonutChart({ pct }) {
  const R = 40, C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  const color = pct >= 70 ? '#3fb950' : pct >= 50 ? '#d29922' : '#f85149';

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className={styles.donut}>
      <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
      <circle
        cx="55" cy="55" r={R} fill="none"
        stroke={color} strokeWidth="12"
        strokeDasharray={`${dash} ${C}`}
        strokeDashoffset={C / 4}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}99)` }}
      />
      <text x="55" y="50" textAnchor="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="Inter">{pct}%</text>
      <text x="55" y="67" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="Inter">Score</text>
    </svg>
  );
}

const FILTERS = [
  { key: 'all',     label: 'All'       },
  { key: 'correct', label: 'Correct'   },
  { key: 'wrong',   label: 'Incorrect' },
  { key: 'skipped', label: 'Unanswered'},
  { key: 'flagged', label: 'Flagged'   },
];

export default function SummaryModal({ questions, answers, flagged, onClose, onNewExam, onGoTo }) {
  const [filter, setFilter] = useState('all');

  /* Build summary data once */
  const items = questions.map((q, i) => {
    const userKeys = (answers[i] || []).slice().sort();
    const correct  = correctKeys(q);
    const isAnswered = userKeys.length > 0;
    const isCorrect  = isAnswered && JSON.stringify(userKeys) === JSON.stringify(correct);
    const isFlagged  = flagged.has(i);
    return { i, q, userKeys, correct, isAnswered, isCorrect, isFlagged };
  });

  const totals = items.reduce((acc, { isAnswered, isCorrect, isFlagged }) => {
    if (!isAnswered) acc.skipped++;
    else if (isCorrect) acc.correct++;
    else acc.wrong++;
    if (isFlagged) acc.flagged++;
    return acc;
  }, { correct: 0, wrong: 0, skipped: 0, flagged: 0 });

  const total = questions.length;
  const pct   = total > 0 ? Math.round((totals.correct / total) * 100) : 0;

  const chips = [
    { key: 'all',     label: 'All',        value: total,          cls: styles.chipAll },
    { key: 'correct', label: 'Correct',    value: totals.correct, cls: styles.chipCorrect },
    { key: 'wrong',   label: 'Incorrect',  value: totals.wrong,   cls: styles.chipWrong },
    { key: 'skipped', label: 'Unanswered', value: totals.skipped, cls: styles.chipSkipped },
    { key: 'flagged', label: 'Flagged',    value: totals.flagged, cls: styles.chipFlagged },
  ];

  const visible = items.filter(({ isAnswered, isCorrect, isFlagged, i: idx }) => {
    if (filter === 'all')     return true;
    if (filter === 'correct') return isCorrect;
    if (filter === 'wrong')   return isAnswered && !isCorrect;
    if (filter === 'skipped') return !isAnswered;
    if (filter === 'flagged') return isFlagged;
    return true;
  });

  const handleChipClick = useCallback((key) => {
    setFilter(prev => prev === key ? 'all' : key);
  }, []);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Quiz Summary"
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>📊 Quiz Summary</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close summary" id="btn-close-summary">✕</button>
        </div>

        {/* Score + chips */}
        <div className={styles.scoreSection}>
          <DonutChart pct={pct} />
          <div className={styles.chips}>
            {chips.map(chip => (
              <button
                key={chip.key}
                className={`${styles.chip} ${chip.cls} ${filter === chip.key ? styles.chipActive : ''}`}
                onClick={() => handleChipClick(chip.key)}
                title={`Filter to ${chip.label}`}
              >
                <span className={styles.chipNum}>{chip.value}</span>
                <span className={styles.chipLbl}>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter label */}
        {filter !== 'all' && (
          <div className={styles.filterBadge}>
            Showing: <strong>{FILTERS.find(f => f.key === filter)?.label}</strong>
            <button className={styles.clearFilter} onClick={() => setFilter('all')}>✕ Clear</button>
          </div>
        )}

        {/* List */}
        <div className={styles.list} id="summary-list">
          {visible.length === 0 ? (
            <div className={styles.empty}>No questions in this category</div>
          ) : visible.map(({ i, q, userKeys, correct, isAnswered, isCorrect, isFlagged }) => {
            const icon = !isAnswered ? '⬜' : isCorrect ? '✅' : '❌';
            const cls  = !isAnswered ? styles.siSkipped : isCorrect ? styles.siCorrect : styles.siWrong;

            return (
              <button
                key={i}
                className={`${styles.item} ${cls}`}
                onClick={() => { onGoTo(i); onClose(); }}
              >
                <span className={styles.itemIcon}>{icon}</span>
                <div className={styles.itemBody}>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemQ}>Q{i + 1}</span>
                    {isFlagged && <span className={styles.flagChip}>🚩 Flagged</span>}
                  </div>
                  <div className={styles.itemTitle}>{truncate(q.title, 100)}</div>
                  <div className={styles.itemAnswers}>
                    {isAnswered ? (
                      <span className={`${styles.tag} ${isCorrect ? styles.tagCorrect : styles.tagWrong}`}>
                        Your: {userKeys.join(', ')}
                      </span>
                    ) : (
                      <span className={`${styles.tag} ${styles.tagSkipped}`}>Not answered</span>
                    )}
                    {!isCorrect && (
                      <span className={`${styles.tag} ${styles.tagRight}`}>
                        Correct: {correct.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onNewExam} id="btn-new-exam-summary">
            🗑 New Exam
          </button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} id="btn-close-summary-bottom">
            Continue Exam
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
