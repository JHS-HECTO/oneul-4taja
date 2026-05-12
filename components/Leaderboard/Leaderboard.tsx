'use client';
import styles from './Leaderboard.module.scss';
import { MOCK_LEADERBOARD } from 'data/leaderboard';
import { getTeam } from 'data/teams';
import { useGameStore } from 'lib/store/gameStore';

export function Leaderboard() {
  const goToTitle = useGameStore((s) => s.goToTitle);

  return (
    <div className={styles.leaderboard}>
      <header className={styles.header}>
        <h2 className={styles.heading}>리더보드</h2>
        <button type="button" className={styles.close} onClick={goToTitle} aria-label="닫기">
          X
        </button>
      </header>
      <div className={styles.legend}>
        <span>순위</span>
        <span>닉네임</span>
        <span>팀</span>
        <span>회</span>
        <span>점수</span>
      </div>
      <ol className={styles.list}>
        {MOCK_LEADERBOARD.map((e) => {
          const team = getTeam(e.team);
          return (
            <li key={`${e.rank}-${e.nickname}`} className={styles.row}>
              <span className={styles.rank}>{e.rank}</span>
              <span className={styles.nick}>{e.nickname}</span>
              <span
                className={styles.team}
                style={team ? { background: team.color } : undefined}
              >
                {team?.short ?? '-'}
              </span>
              <span className={styles.round}>{e.round}회</span>
              <span className={styles.score}>{e.score.toLocaleString()}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
