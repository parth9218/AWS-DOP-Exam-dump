import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import LoadingScreen     from './components/LoadingScreen';
import HomePage          from './components/HomePage';
import BrowsePage        from './components/BrowsePage';
import ExamHeader        from './components/ExamHeader';
import QuestionNavigator from './components/QuestionNavigator';
import QuestionCard      from './components/QuestionCard';
import ExamFooter        from './components/ExamFooter';
import SummaryModal      from './components/SummaryModal';
import ConfirmModal      from './components/ConfirmModal';

import { useExamState }  from './hooks/useExamState';
import { useTimer }      from './hooks/useTimer';
import { useTheme }      from './hooks/useTheme';

import styles from './App.module.css';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Exam questions ── */
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* ── Full bank question count (for home page display) ── */
  const [fullCount, setFullCount]   = useState(0);

  /* ── Exam modals & state ── */
  const [showSummary,  setShowSummary]  = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [clockVisible, setClockVisible] = useState(
    () => localStorage.getItem('mockExam_clockVisible') !== 'false'
  );
  const [direction, setDirection] = useState(1);

  const { theme, cycle: cycleTheme, icon: themeIcon, title: themeTitle } = useTheme();
  const { elapsed } = useTimer();
  const exam = useExamState(questions);

  /* ── Load exam questions (75-question subset) ── */
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}questions.json`)
      .then(r => r.json())
      .then(data => {
        const valid = data.filter(q => q && q.title && q.body);
        setQuestions(valid);
        setLoading(false);
      })
      .catch(err => { setLoadError(err.message); setLoading(false); });
  }, []);

  /* ── Load full bank count for home page ── */
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}questions-full.json`)
      .then(r => r.json())
      .then(data => setFullCount(data.filter(q => q?.title && q?.body).length))
      .catch(() => {});
  }, []);

  /* ── Navigation helpers ── */
  const goTo = useCallback((idx) => {
    setDirection(idx > exam.currentIdx ? 1 : -1);
    exam.goTo(idx);
  }, [exam]);
  const goNext = useCallback(() => { setDirection(1); exam.goNext(); }, [exam]);
  const goPrev = useCallback(() => { setDirection(-1); exam.goPrev(); }, [exam]);

  /* ── Clock ── */
  const toggleClock = useCallback(() => {
    setClockVisible(v => {
      const next = !v;
      localStorage.setItem('mockExam_clockVisible', next ? 'true' : 'false');
      return next;
    });
  }, []);

  /* ── New exam flow ── */
  const requestNewExam = useCallback(() => setShowConfirm(true), []);
  const cancelNewExam  = useCallback(() => setShowConfirm(false), []);
  const doNewExam = useCallback(() => {
    setShowConfirm(false); setShowSummary(false);
    exam.clearExam(); setDirection(1);
  }, [exam]);

  /* ── Keyboard shortcuts (exam mode only) ── */
  useEffect(() => {
    if (!location.pathname.includes('/exam')) return;
    function onKey(e) {
      if (showSummary || showConfirm) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      else if (e.key === 'f' || e.key === 'F') exam.toggleFlag(exam.currentIdx);
      else if (e.key === 'Escape') { setShowSummary(false); setShowConfirm(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.pathname, showSummary, showConfirm, goNext, goPrev, exam]);

  const answeredCount = Object.keys(exam.answers).filter(k => exam.answers[k]?.length > 0).length;

  const onSelect = useCallback((key, checked, maxSelect, isSingle) => {
    exam.selectAnswer(exam.currentIdx, key, checked, maxSelect, isSingle);
  }, [exam]);

  /* ── Global back nav bar (shown in browse/exam to return home) ── */
  const GlobalNav = ({ currentView }) => (
    <nav className={styles.globalNav}>
      <button
        className={styles.navHome}
        onClick={() => navigate('/')}
        title="Back to hub"
      >
        ☁️ <span>AWS DOP-C02</span>
      </button>
      <div className={styles.navTabs}>
        <button
          className={`${styles.navTab} ${currentView === 'browse' ? styles.navTabActive : ''}`}
          onClick={() => navigate('/browse')}
        >
          📚 Browse
        </button>
        <button
          className={`${styles.navTab} ${currentView === 'exam' ? styles.navTabActive : ''}`}
          onClick={() => navigate('/exam')}
        >
          🎓 Exam
        </button>
      </div>
      <button className={styles.themeBtn} onClick={cycleTheme} title={themeTitle}>
        {themeIcon}
      </button>
    </nav>
  );

  /* ── Initial loading ── */
  if (loading) return <LoadingScreen />;

  /* ── Routing Elements ── */
  const homeElement = (
    <div className={styles.shell}>
      <div className={styles.homeThemeBtn}>
        <button className={styles.themeBtn} onClick={cycleTheme} title={themeTitle}>{themeIcon}</button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ flex: 1 }}>
          <HomePage
            questionCount={fullCount}
            onBrowse={() => navigate('/browse')}
            onExam={() => navigate('/exam')}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const browseElement = (
    <div className={styles.shell}>
      <GlobalNav currentView="browse" />
      <AnimatePresence mode="wait">
        <motion.div key="browse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ flex: 1 }}>
          <BrowsePage />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const q = questions[exam.currentIdx];
  const examElement = loadError ? (
    <div className={styles.shell}>
      <GlobalNav currentView="exam" />
      <div className={styles.errorScreen}>
        <p>⚠️ {loadError}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Run <code>node scripts/generate-test.js</code> to generate the exam question set.
        </p>
      </div>
    </div>
  ) : (
    <div className={styles.shell}>
      <ExamHeader
        currentIdx={exam.currentIdx}
        totalCount={questions.length}
        elapsed={elapsed}
        clockVisible={clockVisible}
        onToggleClock={toggleClock}
        theme={theme}
        onCycleTheme={cycleTheme}
        themeIcon={themeIcon}
        themeTitle={themeTitle}
        onNewExam={requestNewExam}
        onSummary={() => setShowSummary(true)}
        answeredCount={answeredCount}
        onHome={() => navigate('/')}
      />

      <QuestionNavigator
        questions={questions}
        answers={exam.answers}
        flagged={exam.flagged}
        currentIdx={exam.currentIdx}
        onGoTo={goTo}
      />

      {q && (
        <QuestionCard
          key={exam.currentIdx}
          question={q}
          questionIdx={exam.currentIdx}
          totalCount={questions.length}
          userSel={exam.answers[exam.currentIdx] || []}
          direction={direction}
          onSelect={onSelect}
        />
      )}

      <ExamFooter
        currentIdx={exam.currentIdx}
        totalCount={questions.length}
        flagged={exam.flagged}
        onPrev={goPrev}
        onNext={goNext}
        onFlag={() => exam.toggleFlag(exam.currentIdx)}
        onSummary={() => setShowSummary(true)}
      />

      <AnimatePresence>
        {showSummary && (
          <SummaryModal
            key="summary"
            questions={questions}
            answers={exam.answers}
            flagged={exam.flagged}
            onClose={() => setShowSummary(false)}
            onNewExam={requestNewExam}
            onGoTo={goTo}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal key="confirm" onConfirm={doNewExam} onCancel={cancelNewExam} />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={homeElement} />
      <Route path="/browse" element={browseElement} />
      <Route path="/exam" element={examElement} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
