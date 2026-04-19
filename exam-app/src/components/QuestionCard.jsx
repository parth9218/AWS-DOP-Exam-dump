import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OptionItem from './OptionItem';
import styles from './QuestionCard.module.css';
import { parseQuestion, questionType, allowedCount, renderMarkdown } from '../utils/parseQuestion';

const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

const typeLabels = {
  'single': { text: 'Single Answer', color: 'var(--info)', bg: 'var(--info-bg)' },
  'multiple-2': { text: 'Choose 2', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  'multiple-3': { text: 'Choose 3', color: 'var(--purple)', bg: 'var(--purple-bg)' },
};

export default function QuestionCard({
  question, questionIdx, totalCount, userSel, direction,
  onSelect,
}) {
  const { body, options } = parseQuestion(question);
  const type = questionType(question);
  const maxSelect = allowedCount(question.answer);
  const isSingle = type === 'single';
  const label = typeLabels[type] || typeLabels['single'];
  const answerCount = (userSel || []).length;

  function handleChange(key, checked) {
    onSelect(key, checked, maxSelect, isSingle);
  }

  return (
    <div className={styles.area}>
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={questionIdx}
          className={styles.card}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Meta row */}
          <div className={styles.metaRow}>
            <span className={styles.numBadge} id="q-number-badge">Q{questionIdx + 1}</span>
            <span
              className={styles.typeBadge}
              id="q-type-badge"
              style={{ color: label.color, background: label.bg, borderColor: label.color + '55' }}
            >
              {label.text}
            </span>
            {!isSingle && (
              <span className={styles.selectHint}>
                {answerCount}/{maxSelect} selected
              </span>
            )}
          </div>

          {/* Question body */}
          <div
            className={styles.body}
            id="question-text"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
          />

          {/* Options */}
          <div className={styles.options} id="options-container" role="group" aria-label="Answer options">
            {options.map(opt => (
              <OptionItem
                key={opt.key}
                optKey={opt.key}
                text={opt.text}
                checked={(userSel || []).includes(opt.key)}
                inputType={isSingle ? 'radio' : 'checkbox'}
                name={`q-${questionIdx}`}
                onChange={(e) => handleChange(opt.key, e.target.checked)}
              />
            ))}
          </div>

          {/* Keyboard hint */}
          <div className={styles.kbHint}>
            <span>⌨ <kbd>←</kbd><kbd>→</kbd> navigate &nbsp;·&nbsp; <kbd>F</kbd> flag</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
