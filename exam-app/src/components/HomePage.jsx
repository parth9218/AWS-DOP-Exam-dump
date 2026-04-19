import { motion } from 'framer-motion';
import styles from './HomePage.module.css';

const features = [
  { icon: '🔍', text: 'Search & browse all questions' },
  { icon: '✅', text: 'Track what you\'ve reviewed' },
  { icon: '💡', text: 'Reveal answers on demand' },
  { icon: '🔗', text: 'Jump to ExamTopics discussion' },
];

const examFeatures = [
  { icon: '⏱', text: 'Timed, realistic exam conditions' },
  { icon: '🎯', text: '75 randomly sampled questions' },
  { icon: '🚩', text: 'Flag questions for review' },
  { icon: '📊', text: 'Detailed score summary' },
];

export default function HomePage({ onBrowse, onExam, questionCount }) {
  return (
    <div className={styles.page}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      {/* Hero */}
      <motion.div
        className={styles.hero}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.heroIcon}>☁️</div>
        <h1 className={styles.heroTitle}>AWS DOP-C02</h1>
        <p className={styles.heroSub}>DevOps Engineer Professional · Exam Prep Hub</p>
        {questionCount > 0 && (
          <span className={styles.heroCount}>{questionCount} questions in bank</span>
        )}
      </motion.div>

      {/* Mode cards */}
      <div className={styles.cards}>
        {/* Browse card */}
        <motion.div
          className={`${styles.card} ${styles.cardBrowse}`}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
        >
          <div className={styles.cardIcon}>📚</div>
          <h2 className={styles.cardTitle}>Browse Questions</h2>
          <p className={styles.cardDesc}>
            Read through the complete question bank at your own pace. Reveal correct answers, track what you've covered, and jump to community discussions.
          </p>
          <ul className={styles.featureList}>
            {features.map(f => (
              <li key={f.text}><span>{f.icon}</span>{f.text}</li>
            ))}
          </ul>
          <button className={`${styles.btn} ${styles.btnBrowse}`} onClick={onBrowse}>
            Browse All Questions →
          </button>
        </motion.div>

        {/* Exam card */}
        <motion.div
          className={`${styles.card} ${styles.cardExam}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
        >
          <div className={styles.cardIcon}>🎓</div>
          <h2 className={styles.cardTitle}>Mock Exam</h2>
          <p className={styles.cardDesc}>
            Simulate real exam conditions with a random 75-question timed test. Navigate freely between questions, flag uncertainties, and review your score.
          </p>
          <ul className={styles.featureList}>
            {examFeatures.map(f => (
              <li key={f.text}><span>{f.icon}</span>{f.text}</li>
            ))}
          </ul>
          <button className={`${styles.btn} ${styles.btnExam}`} onClick={onExam}>
            Start Mock Exam →
          </button>
        </motion.div>
      </div>

      <p className={styles.footer}>
        AWS Certified DevOps Engineer – Professional (DOP-C02) &nbsp;·&nbsp; Prep smarter, not harder.
      </p>
    </div>
  );
}
