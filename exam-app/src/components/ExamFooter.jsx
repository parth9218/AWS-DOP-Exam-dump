import styles from './ExamFooter.module.css';

export default function ExamFooter({ currentIdx, totalCount, flagged, onPrev, onNext, onFlag, onSummary }) {
  const isFlagged = flagged.has(currentIdx);

  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <button
          className={`${styles.btn} ${styles.btnFlag} ${isFlagged ? styles.active : ''}`}
          onClick={onFlag}
          id="btn-flag"
          title={isFlagged ? 'Remove review flag' : 'Flag for review'}
        >
          <span>🚩</span>
          <span>{isFlagged ? 'Flagged' : 'Flag for Review'}</span>
        </button>
      </div>

      <div className={styles.center}>
        <button
          className={`${styles.btn} ${styles.btnNav}`}
          onClick={onPrev}
          disabled={currentIdx === 0}
          id="btn-prev"
        >
          ← Prev
        </button>
        <div className={styles.dotGroup}>
          {/* Show ±2 context dots */}
          {[-2, -1, 0, 1, 2].map(offset => {
            const idx = currentIdx + offset;
            if (idx < 0 || idx >= totalCount) return <div key={offset} className={styles.dotEmpty} />;
            const isCurrent = offset === 0;
            return (
              <div
                key={offset}
                className={`${styles.dot} ${isCurrent ? styles.dotActive : ''}`}
              />
            );
          })}
        </div>
        <button
          className={`${styles.btn} ${styles.btnNav}`}
          onClick={onNext}
          disabled={currentIdx === totalCount - 1}
          id="btn-next"
        >
          Next →
        </button>
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onSummary}
          id="btn-summary-footer"
        >
          Quiz Summary
        </button>
      </div>
    </footer>
  );
}
