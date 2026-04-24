import { motion } from 'framer-motion';
import styles from './PauseModal.module.css';

export default function PauseModal({
  totalCount,
  answeredCount,
  unansweredCount,
  reviewCount,
  remainingTime,
  onResume
}) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2 className={styles.title}>Summary</h2>
        
        <div className={styles.statsList}>
          <div className={styles.statRow}>
            <span className={styles.label}>Total questions:</span>
            <span className={styles.value}>{totalCount}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>Answered questions:</span>
            <span className={styles.value}>{answeredCount}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>Unanswered questions:</span>
            <span className={styles.value}>{unansweredCount}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>Review questions:</span>
            <span className={styles.value}>{reviewCount}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>Remaining Time:</span>
            <span className={styles.value}>{remainingTime}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.resumeBtn} onClick={onResume}>
            Resume
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
