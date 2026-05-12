import type { Team, TeamCode } from 'lib/types';

export const TEAMS: ReadonlyArray<Team> = [
  { code: 'lg',      name: 'LG 트윈스',     short: 'LG',  color: '#c30452' },
  { code: 'doosan',  name: '두산 베어스',    short: 'OB',  color: '#1a1748' },
  { code: 'kt',      name: 'KT 위즈',       short: 'KT',  color: '#000000' },
  { code: 'ssg',     name: 'SSG 랜더스',    short: 'SSG', color: '#c8102e' },
  { code: 'samsung', name: '삼성 라이온즈',  short: 'SS',  color: '#074ca1' },
  { code: 'lotte',   name: '롯데 자이언츠',  short: 'LT',  color: '#041e42' },
  { code: 'hanwha',  name: '한화 이글스',    short: 'HH',  color: '#fc4e00' },
  { code: 'kia',     name: 'KIA 타이거즈',   short: 'KIA', color: '#ea002c' },
  { code: 'nc',      name: 'NC 다이노스',    short: 'NC',  color: '#315288' },
] as const;

export function getTeam(code: TeamCode | string): Team | null {
  return TEAMS.find((t) => t.code === code) ?? null;
}
