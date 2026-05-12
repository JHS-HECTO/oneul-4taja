'use client';
import { useEffect } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import { GameScreen } from 'components/GameScreen/GameScreen';
import { Cutscene } from 'components/Cutscene/Cutscene';

export default function Page() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    // 임시: 진입 시 자동으로 게임 시작 (Phase 8에서 타이틀로 교체)
    if (phase === 'title') {
      useGameStore.setState({ phase: 'playing' });
    }
  }, [phase]);

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--colors-game-dark)',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '9 / 16',
          height: '100%',
          maxHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <GameScreen />
        {phase === 'cutscene' && <Cutscene />}
      </div>
    </main>
  );
}
