import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, INITIAL_GAME_STATE } from './gameStore';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';

beforeEach(() => {
  useGameStore.setState(INITIAL_GAME_STATE);
});

describe('startGame', () => {
  it('moves phase to intro', () => {
    useGameStore.getState().startGame();
    expect(useGameStore.getState().phase).toBe('intro');
  });

  it('resets round to 1, strikes to 0', () => {
    useGameStore.setState({ totalStrikes: 2 });
    useGameStore.getState().startGame();
    expect(useGameStore.getState().current.round).toBe(1);
    expect(useGameStore.getState().totalStrikes).toBe(0);
  });

  it('preserves user, session counters, lifetime flags', () => {
    useGameStore.setState({
      user: { nickname: 'test', team: 'lg' },
      freeSessionsLeft: 1,
      adSessionsLeft: 2,
      lifetime50Done: true,
    });
    useGameStore.getState().startGame();
    const s = useGameStore.getState();
    expect(s.user?.nickname).toBe('test');
    expect(s.freeSessionsLeft).toBe(1);
    expect(s.adSessionsLeft).toBe(2);
    expect(s.lifetime50Done).toBe(true);
  });
});

describe('recordPitchResult', () => {
  it('hit: +1 hit, +score, phase=judging', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().recordPitchResult({
      outcome: 'hit', position: 0.5, scoreGained: SCORE_HIT,
    });
    const s = useGameStore.getState();
    expect(s.current.hits).toBe(1);
    expect(s.totalHits).toBe(1);
    expect(s.totalScore).toBe(SCORE_HIT);
    expect(s.phase).toBe('judging');
    expect(s.lastResult).toBe('hit');
  });

  it('homerun: +1 homerun, +score, homerunInRound=true', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().recordPitchResult({
      outcome: 'homerun', position: 0.5, scoreGained: SCORE_HOMERUN,
    });
    const s = useGameStore.getState();
    expect(s.totalHomeruns).toBe(1);
    expect(s.totalScore).toBe(SCORE_HOMERUN);
    expect(s.current.homerunInRound).toBe(true);
    expect(s.lastResult).toBe('homerun');
  });

  it('strike: +1 totalStrikes only', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().recordPitchResult({
      outcome: 'strike', position: 0, scoreGained: 0,
    });
    expect(useGameStore.getState().totalStrikes).toBe(1);
    expect(useGameStore.getState().current.hits).toBe(0);
    expect(useGameStore.getState().lastResult).toBe('strike');
  });
});

describe('proceedAfterJudging — round clear', () => {
  it('3 hits clears the round and advances', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 5, pitchIndex: 2, hits: 3, homerunInRound: false },
      totalScore: 300,
    });
    useGameStore.getState().proceedAfterJudging();
    const s = useGameStore.getState();
    expect(s.current.round).toBe(6);
    expect(s.current.hits).toBe(0);
    expect(s.maxRoundReached).toBe(5);
    expect(s.totalScore).toBe(300 + 5 * 50);
    expect(s.phase).toBe('playing');
  });

  it('homerun clears the round and shows cutscene', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 3, pitchIndex: 0, hits: 0, homerunInRound: true },
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().phase).toBe('cutscene');
    expect(useGameStore.getState().current.round).toBe(4);
  });

  it('first 50회 clear sets lifetime50Done and shows cutscene', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 50, pitchIndex: 4, hits: 3, homerunInRound: false },
      lifetime50Done: false,
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().lifetime50Done).toBe(true);
    expect(useGameStore.getState().phase).toBe('cutscene');
  });

  it('subsequent 50회 clears do not re-trigger cutscene', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 50, pitchIndex: 4, hits: 3, homerunInRound: false },
      lifetime50Done: true,
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().phase).toBe('playing'); // no cutscene
  });
});

describe('proceedAfterJudging — game over (3 strikes)', () => {
  it('3 strikes → cutscene (game over)', () => {
    useGameStore.setState({
      phase: 'judging',
      totalStrikes: 3,
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().phase).toBe('cutscene');
  });
});

describe('proceedAfterJudging — next pitch', () => {
  it('round not cleared, no game over → next pitch (phase=playing)', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 2, pitchIndex: 1, hits: 1, homerunInRound: false },
      totalStrikes: 1, // 3-strike mode: 1 strike = still alive
    });
    useGameStore.getState().proceedAfterJudging();
    const s = useGameStore.getState();
    expect(s.phase).toBe('playing');
    expect(s.current.pitchIndex).toBe(2);
    expect(s.current.hits).toBe(1);
  });
});

describe('endCutscene', () => {
  it('after game over → continue_prompt (if continues left)', () => {
    useGameStore.setState({ phase: 'cutscene', totalStrikes: 3, continuesLeft: 1 });
    useGameStore.getState().endCutscene();
    expect(useGameStore.getState().phase).toBe('continue_prompt');
  });

  it('after game over with 0 continues → result', () => {
    useGameStore.setState({ phase: 'cutscene', totalStrikes: 3, continuesLeft: 0 });
    useGameStore.getState().endCutscene();
    expect(useGameStore.getState().phase).toBe('result');
  });

  it('after homerun cutscene (not game over) → playing', () => {
    useGameStore.setState({ phase: 'cutscene', totalStrikes: 1 });
    useGameStore.getState().endCutscene();
    expect(useGameStore.getState().phase).toBe('playing');
  });
});

describe('startContinue', () => {
  it('resets strikes + round hits, decrements continuesLeft', () => {
    useGameStore.setState({
      phase: 'continue_prompt',
      totalStrikes: 3,
      continuesLeft: 2,
      current: { round: 8, pitchIndex: 4, hits: 2, homerunInRound: false },
    });
    useGameStore.getState().startContinue();
    const s = useGameStore.getState();
    expect(s.totalStrikes).toBe(0);
    expect(s.continuesLeft).toBe(1);
    expect(s.current.hits).toBe(0);
    expect(s.current.pitchIndex).toBe(0);
    expect(s.current.round).toBe(8);
    expect(s.phase).toBe('playing');
  });
});

describe('daily ticket milestones (10/20/30/40/50)', () => {
  it('reaching round 10 marks milestone 10 and sets pendingReward', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 10, pitchIndex: 2, hits: 3, homerunInRound: false },
      maxRoundReached: 9,
      dailyMilestonesDone: [],
    });
    useGameStore.getState().proceedAfterJudging();
    const s = useGameStore.getState();
    expect(s.dailyMilestonesDone).toContain(10);
    expect(s.pendingReward).toEqual({ round: 10, count: 1 });
  });

  it('does not duplicate milestones or re-trigger reward', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 12, pitchIndex: 2, hits: 3, homerunInRound: false },
      maxRoundReached: 11,
      dailyMilestonesDone: [10],
      pendingReward: null,
    });
    useGameStore.getState().proceedAfterJudging();
    const s = useGameStore.getState();
    expect(s.dailyMilestonesDone.filter((x) => x === 10)).toHaveLength(1);
    expect(s.pendingReward).toBeNull();
  });

  it('hitting round 30 marks all three milestones (10, 20, 30)', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 30, pitchIndex: 2, hits: 3, homerunInRound: false },
      maxRoundReached: 29,
      dailyMilestonesDone: [],
    });
    useGameStore.getState().proceedAfterJudging();
    const ms = useGameStore.getState().dailyMilestonesDone;
    expect(ms).toContain(10);
    expect(ms).toContain(20);
    expect(ms).toContain(30);
  });

  it('dismissReward clears pendingReward', () => {
    useGameStore.setState({ pendingReward: { round: 10, count: 1 } });
    useGameStore.getState().dismissReward();
    expect(useGameStore.getState().pendingReward).toBeNull();
  });
});

describe('giveUp', () => {
  it('sets phase to result', () => {
    useGameStore.setState({ phase: 'continue_prompt' });
    useGameStore.getState().giveUp();
    expect(useGameStore.getState().phase).toBe('result');
  });
});

describe('navigation actions', () => {
  it('goToTitle', () => {
    useGameStore.setState({ phase: 'result' });
    useGameStore.getState().goToTitle();
    expect(useGameStore.getState().phase).toBe('title');
  });

  it('showLeaderboard', () => {
    useGameStore.getState().showLeaderboard();
    expect(useGameStore.getState().phase).toBe('leaderboard');
  });

  it('showDailyLimit', () => {
    useGameStore.getState().showDailyLimit();
    expect(useGameStore.getState().phase).toBe('daily_limit');
  });
});
