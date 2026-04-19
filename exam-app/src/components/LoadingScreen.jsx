import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1400;
    const raf = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      // Ease-out quart
      setProgress(1 - Math.pow(1 - t, 4));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, []);

  return (
    <div className={styles.screen}>
      {/* Ambient rings */}
      <div className={styles.ring1} />
      <div className={styles.ring2} />

      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.logoEmoji}>☁️</span>
          <div className={styles.logoGlow} />
        </div>
        <h1 className={styles.title}>AWS DOP-C02</h1>
        <p className={styles.subtitle}>Mock Exam Simulator</p>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <p className={styles.hint}>Loading question bank…</p>
      </div>
    </div>
  );
}
