import { useRef, useEffect } from 'react';
import styles from './QuestionNavigator.module.css';

function pillClass(styles, isAnswered, isFlagged, isCurrent) {
  const classes = [styles.pill];
  if (isCurrent) classes.push(styles.current);
  if (isAnswered && isFlagged) classes.push(styles.answeredReview);
  else if (isFlagged)          classes.push(styles.review);
  else if (isAnswered)         classes.push(styles.answered);
  return classes.join(' ');
}

export default function QuestionNavigator({ questions, answers, flagged, currentIdx, onGoTo }) {
  const currentRef = useRef(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentIdx]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.strip} role="navigation" aria-label="Question navigator">
        {questions.map((_, i) => {
          const isAnswered = !!(answers[i] && answers[i].length > 0);
          const isFlagged  = flagged.has(i);
          const isCurrent  = i === currentIdx;

          return (
            <button
              key={i}
              id={`nav-pill-${i}`}
              ref={isCurrent ? currentRef : null}
              className={pillClass(styles, isAnswered, isFlagged, isCurrent)}
              onClick={() => onGoTo(i)}
              title={`Question ${i + 1}${isFlagged ? ' — Flagged' : ''}${isAnswered ? ' — Answered' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotAnswered}`}/>Answered</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotReview}`}/>Flagged</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotBoth}`}/>Both</span>
        <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotCurrent}`}/>Current</span>
      </div>
    </div>
  );
}
