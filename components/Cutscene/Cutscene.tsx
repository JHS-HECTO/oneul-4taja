'use client';
import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useGameStore } from 'lib/store/gameStore';
import {
  STRIKES_TO_GAME_OVER,
  CUTSCENE_HOMERUN_MS,
  CUTSCENE_MILESTONE_50_MS,
  CUTSCENE_GAMEOVER_MS,
} from 'lib/constants';
import styles from './Cutscene.module.scss';

type CutsceneKind = 'homerun' | 'milestone_50' | 'gameover';

const DURATIONS: Record<CutsceneKind, number> = {
  homerun: CUTSCENE_HOMERUN_MS,
  milestone_50: CUTSCENE_MILESTONE_50_MS,
  gameover: CUTSCENE_GAMEOVER_MS,
};

const IMAGES: Record<CutsceneKind, string> = {
  homerun: '/images/homerun.png',
  milestone_50: '/images/milestone-50.png',
  gameover: '/images/gameover.png',
};

const LABELS: Record<CutsceneKind, string> = {
  homerun: '★ 홈런 ★',
  milestone_50: '50회 클리어!',
  gameover: 'GAME\nOVER',
};

export function Cutscene() {
  const phase = useGameStore((s) => s.phase);
  const totalStrikes = useGameStore((s) => s.totalStrikes);
  const lifetime50Done = useGameStore((s) => s.lifetime50Done);
  const maxRound = useGameStore((s) => s.maxRoundReached);
  const endCutscene = useGameStore((s) => s.endCutscene);

  const kind: CutsceneKind | null = useMemo(() => {
    if (phase !== 'cutscene') return null;
    if (totalStrikes >= STRIKES_TO_GAME_OVER) return 'gameover';
    // proceedAfterJudging 에서 lifetime50Done 이 false→true 가 된 직후
    if (lifetime50Done && maxRound === 50) return 'milestone_50';
    return 'homerun';
  }, [phase, totalStrikes, lifetime50Done, maxRound]);

  useEffect(() => {
    if (!kind) return;
    const t = setTimeout(() => endCutscene(), DURATIONS[kind]);
    return () => clearTimeout(t);
  }, [kind, endCutscene]);

  if (!kind) return null;

  return (
    <div
      className={clsx(styles.cutscene, kind === 'gameover' && styles.gameover)}
      role="dialog"
      aria-label={LABELS[kind]}
    >
      <img src={IMAGES[kind]} alt="" className={styles.image} />
      <div className={styles.labelWrap}>
        <div className={styles.label}>{LABELS[kind]}</div>
      </div>
    </div>
  );
}
