import styles from './ExamHeader.module.css';

export default function ExamHeader({
  currentIdx, totalCount, elapsed, clockVisible, onToggleClock,
  theme, onCycleTheme, themeIcon, themeTitle,
  onNewExam, onSummary, onHome, onPause,
  answeredCount,
}) {
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onHome && (
          <button className={styles.homeBtn} onClick={onHome} title="Back to hub">← Hub</button>
        )}
        <span className={styles.badge}>AWS DOP-C02</span>
        <div className={styles.timerGroup}>
          <span
            className={`${styles.timer} ${!clockVisible ? styles.timerHidden : ''}`}
            aria-label="Elapsed time"
          >
            ⏱ {formatTime(elapsed)}
          </span>
          <button
            className={styles.iconBtn}
            onClick={onToggleClock}
            title={clockVisible ? 'Hide clock' : 'Show clock'}
            id="btn-clock-toggle"
          >
            {clockVisible ? '👁' : '🙈'}
          </button>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.progressWrapper}>
          <span className={styles.qLabel}>
            Question <strong>{currentIdx + 1}</strong> of <strong>{totalCount}</strong>
          </span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.pct}>{pct}%</span>
        </div>
      </div>

      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          onClick={onCycleTheme}
          title={themeTitle}
          id="btn-theme-toggle"
        >
          {themeIcon}
        </button>
        <button
          className={`${styles.btn} ${styles.btnGhost} ${styles.btnDanger}`}
          onClick={onNewExam}
          id="btn-new-exam"
          title="Clear progress and start fresh"
        >
          <span>🗑</span> New Exam
        </button>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onPause}
          id="btn-pause-exam"
        >
          <span>⏸</span> Pause
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onSummary}
          id="btn-quiz-summary"
        >
          Summary
        </button>
      </div>
    </header>
  );
}
