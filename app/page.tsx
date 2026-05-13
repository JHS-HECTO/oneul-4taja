'use client';
import { useGameStore } from 'lib/store/gameStore';
import { GameScreen } from 'components/GameScreen/GameScreen';
import { Cutscene } from 'components/Cutscene/Cutscene';
import { Title } from 'components/Title/Title';
import { Intro } from 'components/Title/Intro';
import { ContinueModal } from 'components/Result/ContinueModal';
import { Result } from 'components/Result/Result';
import { Leaderboard } from 'components/Leaderboard/Leaderboard';
import { DailyLimit } from 'components/DailyLimit/DailyLimit';
import { RewardPopup } from 'components/RewardPopup/RewardPopup';

export default function Page() {
  const phase = useGameStore((s) => s.phase);

  return (
    <main
      style={{
        width: '100vw',
        // svh = smallest viewport height (브라우저 chrome 포함 안 함) — 모바일에서 짤림 방지
        // fallback to vh for older browsers
        height: '100vh',
        minHeight: '100svh',
        maxHeight: '100svh',
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
          maxHeight: '100svh',
          overflow: 'hidden',
        }}
      >
        {phase === 'title' && <Title />}
        {phase === 'intro' && <Intro />}
        {(phase === 'playing' || phase === 'judging' || phase === 'cutscene') && <GameScreen />}
        {phase === 'cutscene' && <Cutscene />}
        {phase === 'continue_prompt' && <ContinueModal />}
        {phase === 'result' && <Result />}
        {phase === 'leaderboard' && <Leaderboard />}
        {phase === 'daily_limit' && <DailyLimit />}
        <RewardPopup />
      </div>
    </main>
  );
}
