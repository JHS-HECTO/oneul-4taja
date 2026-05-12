'use client';
import { useGameStore } from 'lib/store/gameStore';
import { GameScreen } from 'components/GameScreen/GameScreen';
import { Cutscene } from 'components/Cutscene/Cutscene';
import { Title } from 'components/Title/Title';
import { Intro } from 'components/Title/Intro';

export default function Page() {
  const phase = useGameStore((s) => s.phase);

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
        {phase === 'title' && <Title />}
        {phase === 'intro' && <Intro />}
        {(phase === 'playing' || phase === 'judging' || phase === 'cutscene') && <GameScreen />}
        {phase === 'cutscene' && <Cutscene />}
      </div>
    </main>
  );
}
