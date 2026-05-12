'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './Intro.module.scss';

export function Intro() {
  const endIntro = useGameStore((s) => s.endIntro);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count < 0) {
      endIntro();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [count, endIntro]);

  return (
    <div className={styles.intro}>
      {count > 0 ? (
        <span key={count} className={styles.count}>{count}</span>
      ) : (
        <span className={styles.go}>GO!</span>
      )}
    </div>
  );
}
