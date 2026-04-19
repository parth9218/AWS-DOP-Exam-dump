import { motion, AnimatePresence } from 'framer-motion';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog" aria-modal="true"
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        <div className={styles.iconWrap}>
          <span className={styles.icon}>⚠️</span>
        </div>
        <h3 className={styles.heading}>Start New Exam?</h3>
        <p className={styles.desc}>
          This will permanently erase <strong>all current progress</strong> and answers.
          This action cannot be undone.
        </p>
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={onConfirm}
            id="btn-confirm-yes"
          >
            Yes, Start Fresh
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onCancel}
            id="btn-confirm-no"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
